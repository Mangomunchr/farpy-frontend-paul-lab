// Shared source of truth for the showcased renders, used by both the proof
// filmstrip (landing) and the /proof/[slug] detail pages. Placeholder Unsplash
// imagery — swap for real verified Farpy renders before ship (see proof memory).
//
// Costs follow the pricing source of truth: Normal queue = $0.01 / frame.
// Everything here is in ARTIST language: scene file, frames, dollars, GPU —
// never job hashes, node ids, "beans", or amount_cents.

export type Proof = {
  slug: string;
  name: string;
  scene: string; // .blend file name
  frames: number;
  cost: number; // dollars
  queue: "Normal" | "Fast";
  gpu: string;
  date: string; // human date, e.g. "Jun 14, 2026"
  iso: string; // machine timestamp for the raw receipt
  duration: string; // render time
  alt: string;
  src: string;
  label: string;
};

const RATE = 0.01; // Normal queue, $/frame — matches PricingSection

export const PROOFS: Proof[] = [
  {
    slug: "studio-render",
    name: "Studio render",
    scene: "Studio_Car.blend",
    frames: 240,
    cost: +(240 * RATE).toFixed(2),
    queue: "Normal",
    gpu: "RTX 4090",
    date: "Jun 14, 2026",
    iso: "2026-06-14T18:32:00Z",
    duration: "6m 02s",
    alt: "Sleek sports car rendered in a clean studio light setup",
    src: "https://images.unsplash.com/photo-1747229521023-5f89d2749fa3?auto=format&fit=crop&w=1040&q=80",
    label: "Example studio car render, 240 frames, $2.40",
  },
  {
    slug: "lakeside-scene",
    name: "Lakeside scene",
    scene: "Lakeside_Dusk.blend",
    frames: 48,
    cost: +(48 * RATE).toFixed(2),
    queue: "Normal",
    gpu: "RTX 4090",
    date: "Jun 15, 2026",
    iso: "2026-06-15T09:11:00Z",
    duration: "1m 38s",
    alt: "Red cabin on stilts above dark water, rendered dusk scene",
    src: "https://images.unsplash.com/photo-1779126931857-f12866cf7049?auto=format&fit=crop&w=1040&q=80",
    label: "Example lakeside cabin scene, 48 frames, $0.48",
  },
  {
    slug: "abstract-loop",
    name: "Abstract loop",
    scene: "Iridescent_Loop.blend",
    frames: 90,
    cost: +(90 * RATE).toFixed(2),
    queue: "Normal",
    gpu: "RTX 4090",
    date: "Jun 13, 2026",
    iso: "2026-06-13T22:47:00Z",
    duration: "3m 11s",
    alt: "Iridescent metallic abstract sculpture with colored reflections",
    src: "https://images.unsplash.com/photo-1777973320887-3012937be88c?auto=format&fit=crop&w=1040&q=80",
    label: "Example abstract iridescent loop, 90 frames, $0.90",
  },
  {
    slug: "motion-design",
    name: "Motion design",
    scene: "Spiral_Motion.blend",
    frames: 60,
    cost: +(60 * RATE).toFixed(2),
    queue: "Normal",
    gpu: "RTX 4090",
    date: "Jun 16, 2026",
    iso: "2026-06-16T14:05:00Z",
    duration: "2m 04s",
    alt: "White perforated spiral structure on pink background",
    src: "https://images.unsplash.com/photo-1778336594780-5c7a55398227?auto=format&fit=crop&w=1040&q=80",
    label: "Example motion design spiral, 60 frames, $0.60",
  },
  {
    slug: "product-still",
    name: "Product still",
    scene: "Alu_Cans.blend",
    frames: 30,
    cost: +(30 * RATE).toFixed(2),
    queue: "Normal",
    gpu: "RTX 4090",
    date: "Jun 12, 2026",
    iso: "2026-06-12T11:20:00Z",
    duration: "0m 52s",
    alt: "Stack of shiny aluminum cans, product render",
    src: "https://images.unsplash.com/photo-1777991642395-84d980dcb733?auto=format&fit=crop&w=1040&q=80",
    label: "Example product still life, 30 frames, $0.30",
  },
  {
    slug: "material-study",
    name: "Material study",
    scene: "Cloth_Study.blend",
    frames: 120,
    cost: +(120 * RATE).toFixed(2),
    queue: "Normal",
    gpu: "RTX 4090",
    date: "Jun 11, 2026",
    iso: "2026-06-11T08:03:00Z",
    duration: "4m 20s",
    alt: "Flowing textured surface with soft lines, material study render",
    src: "https://images.unsplash.com/photo-1772732415000-538016ab2b9c?auto=format&fit=crop&w=1040&q=80",
    label: "Example material study, 120 frames, $1.20",
  },
];

export const money = (n: number) => "$" + n.toFixed(2);

// filmstrip caption, e.g. "240f · $2.40"
export const metaOf = (p: Proof) => `${p.frames}f · ${money(p.cost)}`;

export const getProof = (slug: string) => PROOFS.find((p) => p.slug === slug);

export const receiptHash = (p: Proof) => `rcpt_${p.slug.replace(/-/g, "_")}_${p.frames.toString(16)}`;
export const outputHash = (p: Proof) => `out_${p.slug.replace(/-/g, "_")}_${Math.round(p.cost * 100).toString(16)}`;

// The "raw receipt" for the technical minority — still artist-readable keys,
// no job hashes / node ids / amount_cents / beans.
export const rawReceipt = (p: Proof) =>
  JSON.stringify(
    {
      render: p.scene,
      frames_rendered: p.frames,
      frames_failed: 0,
      rate_per_frame: money(p.cost / p.frames),
      total_charged: money(p.cost),
      gpu: p.gpu,
      queue: p.queue,
      render_time: p.duration,
      status: "completed",
      example: true,
      output: `${p.slug}.zip`,
      receipt_hash: receiptHash(p),
      output_hash: outputHash(p),
      finished: p.iso,
    },
    null,
    2,
  );
