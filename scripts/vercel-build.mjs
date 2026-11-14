#!/usr/bin/env node
/**
 * Builds a static site for Vercel from the local NEON DOCK launcher
 * plus prebuilt static game exports in static-games/.
 *
 * launcher/public/games.json is the single source of truth for the catalog.
 * Any edit there (add/remove/reorder/rename a card) ships on the next push.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public");
const STATIC_GAMES = path.join(ROOT, "static-games");
const CATALOG = path.join(ROOT, "launcher", "public", "games.json");

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function readCatalog() {
  if (!fs.existsSync(CATALOG)) {
    console.error(`Missing catalog: ${path.relative(ROOT, CATALOG)}`);
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  } catch (error) {
    console.error(`Invalid catalog JSON in ${path.relative(ROOT, CATALOG)}: ${error.message}`);
    process.exit(1);
  }
  const games = Array.isArray(data) ? data : data.games;
  if (!Array.isArray(games) || games.length === 0) {
    console.error(`Catalog ${path.relative(ROOT, CATALOG)} contains no games.`);
    process.exit(1);
  }
  return games;
}

function outputPathFor(url) {
  const clean = String(url).split(/[?#]/)[0].replace(/^\/+/, "");
  return path.join(OUT, clean);
}

function playUrlExists(url) {
  const target = outputPathFor(url);
  if (!url.endsWith("/") && fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  if (fs.existsSync(path.join(target, "index.html"))) return true;
  if (fs.existsSync(`${target}.html`)) return true;
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

rmrf(OUT);
mkdirp(OUT);

// Launcher UI + covers
copyDir(path.join(ROOT, "launcher", "public"), OUT);

// Summit Rush (Famobi HTML5 package, local stub)
copyDir(path.join(ROOT, "high-hills"), path.join(OUT, "games", "highhills"));

// Shooting Car (Famobi HTML5 package, local stub)
copyDir(path.join(ROOT, "shooting-car"), path.join(OUT, "games", "shootingcar"));

// Rush Racing (Famobi WASM package, local stub)
copyDir(path.join(ROOT, "rush-racing"), path.join(OUT, "games", "rushracing"));

// Drift King (Babylon.js 3D drift game, local mirror)
copyDir(path.join(ROOT, "Drift-King"), path.join(OUT, "games", "driftking"));

// 8 Ball Billiards (Famobi HTML5 package, local stub)
copyDir(path.join(ROOT, "8-ball-pool"), path.join(OUT, "games", "8ball"));

// Fall Cars (Three.js color battle arena)
copyDir(path.join(ROOT, "Fall-Cars"), path.join(OUT, "games", "fallcars"));

// Prebuilt Next static exports
if (!fs.existsSync(STATIC_GAMES)) {
  console.error("Missing static-games/. Run: node scripts/build-static-games.mjs");
  process.exit(1);
}
// Built but unpublished games — kept on disk, not shipped.
const UNPUBLISHED = new Set(["pool", "popper"]);
for (const id of fs.readdirSync(STATIC_GAMES)) {
  const src = path.join(STATIC_GAMES, id);
  if (!fs.statSync(src).isDirectory()) continue;
  if (UNPUBLISHED.has(id)) {
    console.log(`skipped game: ${id}`);
    continue;
  }
  copyDir(src, path.join(OUT, "games", id));
  console.log(`packed game: ${id}`);
}

const games = readCatalog();

const extraCovers = [
  ["Archery/Archery/public/desert-sunset.jpg", "covers/archery.jpg"],
  ["CandyBlast/CandyBlast/public/og.png", "covers/candyblast.png"],
  ["Carrom/Carrom/public/og.png", "covers/carrom.png"],
  ["Bubble Shooter/Bubble Shooter/public/og.png", "covers/bubbleshooter.png"],
  ["launcher/public/covers/highhills.jpg", "covers/highhills.jpg"],
  ["launcher/public/covers/shootingcar.jpg", "covers/shootingcar.jpg"],
  ["launcher/public/covers/rushracing.jpg", "covers/rushracing.jpg"],
  ["launcher/public/covers/driftking.jpg", "covers/driftking.jpg"],
  ["launcher/public/covers/8ball.jpg", "covers/8ball.jpg"],
  ["launcher/public/covers/fallcars.jpg", "covers/fallcars.jpg"],
];
for (const [srcRel, destRel] of extraCovers) {
  const src = path.join(ROOT, srcRel);
  const dest = path.join(OUT, destRel);
  if (fs.existsSync(src)) {
    mkdirp(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// Ship the catalog exactly as authored in launcher/public/games.json.
fs.writeFileSync(path.join(OUT, "games.json"), `${JSON.stringify({ games }, null, 2)}\n`);

const missingPlay = games.filter((game) => game.playUrl && !playUrlExists(game.playUrl));
if (missingPlay.length) {
  console.error("\nCatalog references playable games that were not built:");
  for (const game of missingPlay) console.error(`  - ${game.id}: ${game.playUrl}`);
  console.error("Add the game to scripts/build-static-games.mjs or fix the playUrl in launcher/public/games.json.");
  process.exit(1);
}

const missingCovers = games.filter(
  (game) => game.cover && !fs.existsSync(outputPathFor(game.cover)),
);
if (missingCovers.length) {
  console.warn("\nWarning: catalog covers missing from the build:");
  for (const game of missingCovers) console.warn(`  - ${game.id}: ${game.cover}`);
}

const commit = process.env.VERCEL_GIT_COMMIT_SHA || "";
const buildInfo = {
  commit,
  shortCommit: commit ? commit.slice(0, 7) : "",
  ref: process.env.VERCEL_GIT_COMMIT_REF || "",
  environment: process.env.VERCEL_ENV || "local",
  builtAt: new Date().toISOString(),
  games: games.map((game) => game.id),
};
fs.writeFileSync(path.join(OUT, "build-info.json"), `${JSON.stringify(buildInfo, null, 2)}\n`);

console.log(`Vercel static build ready → ${OUT}`);
console.log(`Playable games: ${games.filter((game) => game.playUrl).length}`);
console.log(`Commit: ${buildInfo.shortCommit || "(local build)"}`);
