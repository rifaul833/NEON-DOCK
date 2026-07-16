#!/usr/bin/env node
/**
 * Builds each vinext/Next game as a static export into static-games/<id>
 * for hosting under /games/<id> on Vercel.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_ROOT = path.join(ROOT, "static-games");

const GAMES = [
  { id: "archery", dir: "Archery/Archery", title: "Arrowfall — 3D Archery", description: "A cinematic multiplayer archery challenge built for the browser." },
  { id: "candyblast", dir: "CandyBlast/CandyBlast", title: "CandyBlast — Match, Pop & Smile", description: "A deliciously playful match-3 puzzle game in a glossy candy kingdom." },
  { id: "carrom", dir: "Carrom/Carrom", title: "Carrom Pop! — Cartoon Carrom Game", description: "Cartoon carrom — flick and pocket the pieces." },
  { id: "darts", dir: "Darts/Darts", title: "Dart Dash! — Cartoon Darts", description: "Aim, throw, and chase a huge score in this playful 3D dart game." },
  { id: "pool", dir: "Pool/Pool", title: "Happy Break! — Cartoon Pool", description: "Aim, shoot, and clear the table in this cheerful pool game." },
  { id: "snakes", dir: "SnakesAndLadder/SnakesAndLadder", title: "Snake & Ladder — Race to the Top!", description: "A colorful Snake & Ladder game — climb or slide." },
  { id: "ludo", dir: "Ludo/Ludo", title: "Ludo — Classic Race Home", description: "A polished four-player Ludo game with classic rules." },
  { id: "racingbike", dir: "Racing-Bike/Racing-Bike", title: "Turbo Dice Riders — 3D Bike Racing", description: "3D bike racing — roll the dice and ride." },
];

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function backup(file) {
  const bak = `${file}.neonbak`;
  if (fs.existsSync(file) && !fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
  }
}

function restore(file) {
  const bak = `${file}.neonbak`;
  if (fs.existsSync(bak)) {
    fs.copyFileSync(bak, file);
    fs.unlinkSync(bak);
  }
}

function writeNextConfig(gameDir, basePath) {
  const file = path.join(gameDir, "next.config.ts");
  backup(file);
  fs.writeFileSync(
    file,
    `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "${basePath}",
  assetPrefix: "${basePath}",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
`,
  );
}

function writeDbStub(gameDir) {
  const file = path.join(gameDir, "db", "index.ts");
  if (!fs.existsSync(file)) return;
  backup(file);
  fs.writeFileSync(
    file,
    `export function getDb() {
  throw new Error("Database is not available in the static web build.");
}
`,
  );
}

function patchLayout(gameDir, title, description) {
  const file = path.join(gameDir, "app", "layout.tsx");
  if (!fs.existsSync(file)) return;
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("headers(")) return;
  backup(file);
  // Replace dynamic metadata that depends on request headers with static metadata.
  const patched = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
  fs.writeFileSync(file, patched);
}

function buildGame(game) {
  const gameDir = path.join(ROOT, game.dir);
  const basePath = `/games/${game.id}`;
  const outDir = path.join(OUT_ROOT, game.id);

  if (!fs.existsSync(path.join(gameDir, "package.json"))) {
    console.error(`SKIP ${game.id}: missing package.json`);
    return false;
  }
  if (!fs.existsSync(path.join(gameDir, "node_modules", "next"))) {
    console.log(`Installing deps for ${game.id}…`);
    const install = spawnSync("npm", ["ci", "--omit=dev"], {
      cwd: gameDir,
      stdio: "inherit",
      env: process.env,
    });
    // Prefer full install if ci fails / lock issues
    if (install.status !== 0) {
      spawnSync("npm", ["install"], { cwd: gameDir, stdio: "inherit", env: process.env });
    }
  }

  console.log(`\n=== Building ${game.id} (${basePath}) ===`);
  writeNextConfig(gameDir, basePath);
  writeDbStub(gameDir);
  patchLayout(gameDir, game.title, game.description);

  try {
    rmrf(path.join(gameDir, "out"));
    rmrf(path.join(gameDir, ".next"));
    const result = spawnSync("npx", ["next", "build"], {
      cwd: gameDir,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        // Inlined into client bundles so public/ assets resolve under basePath.
        NEXT_PUBLIC_BASE_PATH: basePath,
      },
    });
    if (result.status !== 0) {
      console.error(`FAIL ${game.id}: next build exited ${result.status}`);
      return false;
    }
    const built = path.join(gameDir, "out");
    if (!fs.existsSync(path.join(built, "index.html"))) {
      console.error(`FAIL ${game.id}: no out/index.html`);
      return false;
    }
    rmrf(outDir);
    fs.cpSync(built, outDir, { recursive: true });
    console.log(`OK ${game.id} → ${outDir}`);
    return true;
  } finally {
    restore(path.join(gameDir, "next.config.ts"));
    restore(path.join(gameDir, "db", "index.ts"));
    restore(path.join(gameDir, "app", "layout.tsx"));
  }
}

fs.mkdirSync(OUT_ROOT, { recursive: true });
const results = [];
for (const game of GAMES) {
  results.push({ id: game.id, ok: buildGame(game) });
}

const failed = results.filter((r) => !r.ok);
console.log("\nBuild summary:");
for (const r of results) console.log(`  ${r.ok ? "✓" : "✗"} ${r.id}`);
if (failed.length) {
  console.error(`\n${failed.length} game(s) failed`);
  process.exit(1);
}
console.log("\nAll static games ready in static-games/");
