// Client-side .blend scene frame-range detection.
//
// Reads the Blender file's DNA catalog to find Scene.r (RenderData) and pull
// sfra/efra — the same numbers Blender shows in the timeline. Handles
// uncompressed and gzip-compressed files; zstd-compressed files (Blender 3.0+
// default "Compress" option) can't be inflated natively in the browser, so
// callers must fall back to a default range.

export type BlendFrameRange = {
  frameStart: number;
  frameEnd: number;
  frameCount: number;
};

const MAX_REASONABLE_FRAME = 1_000_000;

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += String.fromCharCode(bytes[offset + i]);
  return out;
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Null-terminated string list reader used by the DNA NAME/TYPE tables. */
function readStrings(bytes: Uint8Array, offset: number, count: number): { values: string[]; end: number } {
  const values: string[] = [];
  let cursor = offset;
  for (let i = 0; i < count; i++) {
    const start = cursor;
    while (bytes[cursor] !== 0) cursor++;
    values.push(ascii(bytes, start, cursor - start));
    cursor++;
  }
  return { values, end: cursor };
}

const align4 = (value: number) => (value + 3) & ~3;

/** Size in bytes of one struct field. Pointers collapse to the file's pointer size. */
function fieldSize(name: string, typeLength: number, pointerSize: number): number {
  let size = name.startsWith("*") || name.startsWith("(*") ? pointerSize : typeLength;
  const arrayDims = name.matchAll(/\[(\d+)\]/g);
  for (const dim of arrayDims) size *= Number(dim[1]);
  return size;
}

/** Strip pointer/array decorations: "*ob" -> "ob", "mat[4][4]" -> "mat". */
function bareName(name: string): string {
  return name.replace(/^\(\*|^\*+/, "").replace(/\[.*$/, "").replace(/\)\(.*$/, "");
}

function parseBlend(bytes: Uint8Array): BlendFrameRange | null {
  if (ascii(bytes, 0, 7) !== "BLENDER") return null;
  const pointerSize = bytes[7] === 0x5f /* "_" */ ? 4 : 8;
  const littleEndian = bytes[8] === 0x76; /* "v" */
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const i32 = (offset: number) => view.getInt32(offset, littleEndian);
  const i16 = (offset: number) => view.getInt16(offset, littleEndian);

  // Walk the block table: collect candidate Scene blocks and the DNA1 catalog.
  const blockHeaderSize = 4 + 4 + pointerSize + 4 + 4;
  const blocks: { code: string; sdnaIndex: number; dataOffset: number; size: number }[] = [];
  let dna: { offset: number; size: number } | null = null;
  let cursor = 12;
  while (cursor + blockHeaderSize <= bytes.length) {
    const code = ascii(bytes, cursor, 4);
    if (code === "ENDB") break;
    const size = i32(cursor + 4);
    const sdnaIndex = i32(cursor + 4 + 4 + pointerSize);
    const dataOffset = cursor + blockHeaderSize;
    if (size < 0 || dataOffset + size > bytes.length) return null;
    if (code === "DNA1") dna = { offset: dataOffset, size };
    else if (code.startsWith("SC")) blocks.push({ code, sdnaIndex, dataOffset, size });
    cursor = dataOffset + size;
  }
  if (!dna) return null;

  // ---- Parse the SDNA catalog ----
  let p = dna.offset;
  if (ascii(bytes, p, 4) !== "SDNA") return null;
  p += 4;
  if (ascii(bytes, p, 4) !== "NAME") return null;
  const nameCount = i32(p + 4);
  const names = readStrings(bytes, p + 8, nameCount);
  p = align4(names.end);
  if (ascii(bytes, p, 4) !== "TYPE") return null;
  const typeCount = i32(p + 4);
  const types = readStrings(bytes, p + 8, typeCount);
  p = align4(types.end);
  if (ascii(bytes, p, 4) !== "TLEN") return null;
  p += 4;
  const typeLengths: number[] = [];
  for (let i = 0; i < typeCount; i++) typeLengths.push(i16(p + i * 2));
  p = align4(p + typeCount * 2);
  if (ascii(bytes, p, 4) !== "STRC") return null;
  const structCount = i32(p + 4);
  p += 8;

  type StructDef = { typeIndex: number; fields: { typeIndex: number; nameIndex: number }[] };
  const structs: StructDef[] = [];
  for (let i = 0; i < structCount; i++) {
    const typeIndex = i16(p);
    const fieldCount = i16(p + 2);
    p += 4;
    const fields: StructDef["fields"] = [];
    for (let f = 0; f < fieldCount; f++) {
      fields.push({ typeIndex: i16(p), nameIndex: i16(p + 2) });
      p += 4;
    }
    structs.push({ typeIndex, fields });
  }

  const structIndexByName = new Map<string, number>();
  structs.forEach((s, index) => structIndexByName.set(types.values[s.typeIndex], index));

  /** Byte offset of a (bare) field within a struct, or null. */
  const offsetOf = (structName: string, target: string): number | null => {
    const structIndex = structIndexByName.get(structName);
    if (structIndex === undefined) return null;
    let offset = 0;
    for (const field of structs[structIndex].fields) {
      const name = names.values[field.nameIndex];
      if (bareName(name) === target && !name.startsWith("*")) return offset;
      offset += fieldSize(name, typeLengths[field.typeIndex], pointerSize);
    }
    return null;
  };

  const sceneStructIndex = structIndexByName.get("Scene");
  const rOffset = offsetOf("Scene", "r");
  const sfraOffset = offsetOf("RenderData", "sfra");
  const efraOffset = offsetOf("RenderData", "efra");
  if (sceneStructIndex === undefined || rOffset === null || sfraOffset === null || efraOffset === null) return null;

  const sceneBlock = blocks.find((b) => b.sdnaIndex === sceneStructIndex);
  if (!sceneBlock) return null;

  const frameStart = i32(sceneBlock.dataOffset + rOffset + sfraOffset);
  const frameEnd = i32(sceneBlock.dataOffset + rOffset + efraOffset);
  if (
    !Number.isInteger(frameStart) || !Number.isInteger(frameEnd) ||
    frameEnd < frameStart || frameStart < -MAX_REASONABLE_FRAME || frameEnd > MAX_REASONABLE_FRAME
  ) {
    return null;
  }
  return { frameStart, frameEnd, frameCount: frameEnd - frameStart + 1 };
}

/**
 * Detect the scene frame range of a .blend file in the browser.
 * Returns null when the file can't be read (zstd compression, corrupt file,
 * or an unexpected layout) — callers should fall back to a default range.
 */
export async function detectBlendFrames(file: File): Promise<BlendFrameRange | null> {
  try {
    let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer());
    if (bytes.length < 16) return null;
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      bytes = await gunzip(bytes);
    }
    return parseBlend(bytes);
  } catch {
    return null;
  }
}
