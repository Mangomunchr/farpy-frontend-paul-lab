// A tiny, dependency-free ZIP writer for the front-end download flow. The render funnel
// and the Blender add-on both hand back ".zip" downloads; with no backend wired
// yet, we build real, openable archives in the browser instead of dead links.
// When the backend lands, swap the call sites for signed archive URLs.

type Entry = { name: string; data: Uint8Array };

/* CRC-32 (IEEE) — every zip entry needs one or the archive won't open. */
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let b = 0; b < 8; b++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* Minimal store-method (uncompressed) zip writer. Enough for a few text files,
   without another dependency. */
export function makeZip(entries: Entry[]): Blob {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const crc = crc32(e.data);
    const size = e.data.length;
    const nameLen = e.name.length;

    const lfh = new Uint8Array(30 + nameLen);
    const lv = new DataView(lfh.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // method: store
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x21, true); // mod date (1980-01-01, valid stub)
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed size
    lv.setUint32(22, size, true); // uncompressed size
    lv.setUint16(26, nameLen, true);
    lv.setUint16(28, 0, true); // extra length
    for (let i = 0; i < nameLen; i++) lfh[30 + i] = e.name.charCodeAt(i);
    parts.push(lfh, e.data);

    const cdh = new Uint8Array(46 + nameLen);
    const cv = new DataView(cdh.buffer);
    cv.setUint32(0, 0x02014b50, true); // central dir header signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // method
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0x21, true); // mod date
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameLen, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // local header offset
    for (let i = 0; i < nameLen; i++) cdh[46 + i] = e.name.charCodeAt(i);
    central.push(cdh);

    offset += lfh.length + size;
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // end of central directory signature
  ev.setUint16(8, entries.length, true); // entries on this disk
  ev.setUint16(10, entries.length, true); // total entries
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true); // central dir offset

  const all = [...parts, ...central, eocd];
  const total = all.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const a of all) {
    out.set(a, pos);
    pos += a.length;
  }
  return new Blob([out], { type: "application/zip" });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* build + download a zip of plain-text files in one call */
export function downloadTextZip(files: { name: string; content: string }[], filename: string) {
  const enc = new TextEncoder();
  const blob = makeZip(files.map((f) => ({ name: f.name, data: enc.encode(f.content) })));
  triggerDownload(blob, filename);
}
