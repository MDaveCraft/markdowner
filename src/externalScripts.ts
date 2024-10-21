import { fetch } from "bun";

const scripts = {
  turndownJs: "https://unpkg.com/turndown/dist/turndown.js",
  readabilityJs: "https://unpkg.com/@mozilla/readability@0.5.0/Readability.js",
  turndownGFM:
    "https://unpkg.com/turndown-plugin-gfm/dist/turndown-plugin-gfm.js",
} as const;


const readabilityJS = await fetch(scripts.readabilityJs)