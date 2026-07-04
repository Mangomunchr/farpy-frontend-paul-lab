import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    FARPY_LIGHTNING_ENABLED: process.env.FARPY_LIGHTNING_ENABLED === "true" ? "true" : "false",
  },
  output: "export",
  // Pin the project root to this directory. Next/Turbopack otherwise infers the
  // root by walking up to the outermost lockfile — and when a stray lockfile
  // exists in a parent folder, it picks the wrong root, then resolves the
  // PostCSS config and node_modules (including @tailwindcss/postcss) from there
  // and fails with "Cannot find module '@tailwindcss/postcss'". Pinning the root
  // also silences the "multiple lockfiles / inferred workspace root" warning.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
