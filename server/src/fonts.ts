import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const FONT_DIR = path.dirname(require.resolve("@fontsource/inter/400.css"));

const WEIGHTS: { weight: number; file: string }[] = [
  { weight: 400, file: "inter-latin-400-normal.woff2" },
  { weight: 600, file: "inter-latin-600-normal.woff2" },
  { weight: 700, file: "inter-latin-700-normal.woff2" },
  { weight: 800, file: "inter-latin-800-normal.woff2" },
];

function toDataUri(file: string): string {
  const bytes = fs.readFileSync(path.join(FONT_DIR, "files", file));
  return `data:font/woff2;base64,${bytes.toString("base64")}`;
}

/** Self-hosted Inter, inlined as base64 so PDF rendering never depends on network access. */
export const FONT_FACE_CSS: string = WEIGHTS.map(
  ({ weight, file }) => `
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: ${weight};
    font-display: swap;
    src: url("${toDataUri(file)}") format('woff2');
  }`
).join("\n");

export const FONT_STACK = `'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
