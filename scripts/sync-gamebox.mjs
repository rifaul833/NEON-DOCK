#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHARED = path.join(ROOT, "shared", "gamebox");

const TARGETS = [
  "8-ball-pool/game/gamebox",
  "Drift-King/game/gamebox",
  "Fall-Cars/game/gamebox",
];

const COPY_FILES = [
  "crypto.js",
  "gamebox-sdk.js",
  "integration-core.js",
  "bootstrap.js",
  "vendor/pako.min.js",
];

for (const rel of TARGETS) {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.join(dest, "vendor"), { recursive: true });
  for (const file of COPY_FILES) {
    const src = path.join(SHARED, file);
    const out = path.join(dest, file);
  if (!fs.existsSync(src)) {
      console.error("Missing shared file:", src);
      process.exit(1);
    }
    fs.copyFileSync(src, out);
  }
  console.log("Synced gamebox ->", rel);
}
