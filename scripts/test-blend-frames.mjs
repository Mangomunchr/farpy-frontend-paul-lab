// Builds a minimal-but-valid .blend byte layout (header, SC block, DNA1
// catalog) and checks that src/lib/blendFrames.ts detects the frame range.
// Run: node --experimental-strip-types scripts/test-blend-frames.mjs

import { detectBlendFrames } from "../src/lib/blendFrames.ts";

const enc = new TextEncoder();

function cstrings(list) {
  const parts = list.map((s) => [...enc.encode(s), 0]).flat();
  return new Uint8Array(parts);
}

function pad4(arr) {
  const rem = arr.length % 4;
  if (!rem) return arr;
  const out = new Uint8Array(arr.length + (4 - rem));
  out.set(arr);
  return out;
}

export function buildTestBlend({ sfra, efra }) {
  const pointerSize = 8;

  // DNA catalog: types int(4), Scene, RenderData.
  // Scene = { RenderData r; }  RenderData = { int sfra; int efra; int pad; }
  const names = ["r", "sfra", "efra", "pad"];
  const types = ["int", "Scene", "RenderData"];
  const typeLengths = [4, 12, 12];

  const nameBlob = pad4(cstrings(names));
  const typeBlob = pad4(cstrings(types));

  const tlen = new Uint8Array(pad4(new Uint8Array(typeLengths.length * 2)).length);
  new DataView(tlen.buffer).setInt16(0, typeLengths[0], true);
  new DataView(tlen.buffer).setInt16(2, typeLengths[1], true);
  new DataView(tlen.buffer).setInt16(4, typeLengths[2], true);

  // STRC: struct Scene (type 1): 1 field (RenderData r) -> [type 2, name 0]
  //       struct RenderData (type 2): 3 int fields sfra/efra/pad
  const strc = new Uint8Array(4 + 4 + (2 + 2) * 1 + 4 + (2 + 2) * 3);
  {
    const v = new DataView(strc.buffer);
    let o = 0;
    v.setInt16(o, 1, true); o += 2;      // Scene type index
    v.setInt16(o, 1, true); o += 2;      // 1 field
    v.setInt16(o, 2, true); o += 2;      //   RenderData
    v.setInt16(o, 0, true); o += 2;      //   name "r"
    v.setInt16(o, 2, true); o += 2;      // RenderData type index
    v.setInt16(o, 3, true); o += 2;      // 3 fields
    v.setInt16(o, 0, true); o += 2; v.setInt16(o, 1, true); o += 2; // int sfra
    v.setInt16(o, 0, true); o += 2; v.setInt16(o, 2, true); o += 2; // int efra
    v.setInt16(o, 0, true); o += 2; v.setInt16(o, 3, true); o += 2; // int pad
  }

  const sdna = new Uint8Array([
    ...enc.encode("SDNA"),
    ...enc.encode("NAME"), ...int32(names.length), ...nameBlob,
    ...enc.encode("TYPE"), ...int32(types.length), ...typeBlob,
    ...enc.encode("TLEN"), ...tlen,
    ...enc.encode("STRC"), ...int32(2), ...strc,
  ]);

  // Scene data block: struct Scene { RenderData r { sfra, efra, pad } }
  const sceneData = new Uint8Array(12);
  {
    const v = new DataView(sceneData.buffer);
    v.setInt32(0, sfra, true);
    v.setInt32(4, efra, true);
  }

  const blockHeader = (code, size, sdnaIndex) => {
    const head = new Uint8Array(4 + 4 + pointerSize + 4 + 4);
    head.set(enc.encode(code.padEnd(4, "\0")), 0);
    const v = new DataView(head.buffer);
    v.setInt32(4, size, true);
    v.setInt32(4 + 4 + pointerSize, sdnaIndex, true); // old ptr left zero
    v.setInt32(4 + 4 + pointerSize + 4, 1, true);
    return head;
  };

  return new Uint8Array([
    ...enc.encode("BLENDER-v405"),           // 8-byte pointers, little endian
    ...blockHeader("SC", sceneData.length, 0), ...sceneData, // Scene = struct index 0
    ...blockHeader("DNA1", sdna.length, 0), ...sdna,
    ...blockHeader("ENDB", 0, 0),
  ]);
}

function int32(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setInt32(0, value, true);
  return out;
}

const bytes = buildTestBlend({ sfra: 1, efra: 120 });
const file = new File([bytes], "synthetic.blend");
const result = await detectBlendFrames(file);
console.log("detected:", JSON.stringify(result));
if (!result || result.frameStart !== 1 || result.frameEnd !== 120 || result.frameCount !== 120) {
  console.error("FAIL: expected frames 1-120");
  process.exit(1);
}

// gzip round-trip (Blender "Compress" pre-3.0 style)
const gz = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
const gzResult = await detectBlendFrames(new File([gz], "synthetic-gz.blend"));
console.log("detected (gzip):", JSON.stringify(gzResult));
if (!gzResult || gzResult.frameCount !== 120) {
  console.error("FAIL: gzip path");
  process.exit(1);
}

// garbage file falls back to null
const junk = await detectBlendFrames(new File([new Uint8Array(64).fill(7)], "junk.blend"));
console.log("junk file:", JSON.stringify(junk));
if (junk !== null) {
  console.error("FAIL: junk should be null");
  process.exit(1);
}

console.log("PASS");
