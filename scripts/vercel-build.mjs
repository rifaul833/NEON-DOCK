#!/usr/bin/env node
/**
 * Builds a static site for Vercel from the local NEON DOCK launcher
 * plus prebuilt static game exports in static-games/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public");
const STATIC_GAMES = path.join(ROOT, "static-games");

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
for (const id of fs.readdirSync(STATIC_GAMES)) {
  const src = path.join(STATIC_GAMES, id);
  if (!fs.statSync(src).isDirectory()) continue;
  copyDir(src, path.join(OUT, "games", id));
  console.log(`packed game: ${id}`);
}

const catalog = [
  {
    id: "archery",
    title: "Arrowfall",
    subtitle: "3D archery — draw, aim, and hit the mark",
    category: "Shooter",
    controls: "Mouse / Touch",
    accent: "#e8a54b",
    cover: "/covers/archery.jpg",
    playUrl: "/games/archery/",
  },
  {
    id: "candyblast",
    title: "CandyBlast",
    subtitle: "Match-3 puzzles in a glossy candy kingdom",
    category: "Puzzle",
    controls: "Mouse / Touch",
    accent: "#ff6b9d",
    cover: "/covers/candyblast.png",
    playUrl: "/games/candyblast/",
  },
  {
    id: "carrom",
    title: "Carrom Pop!",
    subtitle: "Cartoon carrom — flick and pocket the pieces",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#f0c14b",
    cover: "/covers/carrom.png",
    playUrl: "/games/carrom/",
  },
  {
    id: "darts",
    title: "Dart Dash!",
    subtitle: "Cartoon darts — throw for the bullseye",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#ff5a5a",
    cover: "/covers/darts.png",
    playUrl: "/games/darts/",
  },
  {
    id: "pool",
    title: "Happy Break!",
    subtitle: "Cheerful pool — aim, shoot, clear the table",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#3ecf8e",
    cover: "/covers/pool.png",
    playUrl: "/games/pool/",
  },
  {
    id: "snakes",
    title: "Snake & Ladder",
    subtitle: "Race to the top — climb ladders or slide down",
    category: "Board",
    controls: "Mouse / Touch",
    accent: "#5ad4ff",
    cover: "/covers/snakes.png",
    playUrl: "/games/snakes/",
  },
  {
    id: "ludo",
    title: "Ludo",
    subtitle: "3D board race — roll, capture, and get all pieces home",
    category: "Board",
    controls: "Mouse / Touch",
    accent: "#ffb347",
    cover: "/covers/ludo.png",
    playUrl: "/games/ludo/",
  },
  {
    id: "bubbleshooter",
    title: "Bubble Boom!",
    subtitle: "3D bubble shooter — aim, bounce, and pop",
    category: "Puzzle",
    controls: "Mouse / Touch",
    accent: "#5ec8ff",
    cover: "/covers/bubbleshooter.png",
    playUrl: "/games/bubbleshooter/",
  },
  {
    id: "popper",
    title: "Pop! Party",
    subtitle: "Tap bubbles, chain combos, dodge bombs",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#ff6bcb",
    cover: "/covers/popper.png",
    playUrl: "/games/popper/",
  },
  {
    id: "highhills",
    title: "Summit Rush",
    subtitle: "Flip, boost, and climb endless hill tracks",
    category: "Racing",
    controls: "Tap / Hold",
    accent: "#7ad4ff",
    cover: "/covers/highhills.jpg",
    playUrl: "/games/highhills/game/index.html",
  },
  {
    id: "shootingcar",
    title: "Shooting Car",
    subtitle: "Shoot, dodge, and outrun the chaos",
    category: "Action",
    controls: "Keyboard / Touch",
    accent: "#ff5a36",
    cover: "/covers/shootingcar.jpg",
    playUrl: "/games/shootingcar/game/index.html",
  },
  {
    id: "rushracing",
    title: "Rush Racing",
    subtitle: "Race through traffic at breakneck speed",
    category: "Racing",
    controls: "Keyboard / Touch",
    accent: "#ffd24a",
    cover: "/covers/rushracing.jpg",
    playUrl: "/games/rushracing/game/index.html",
  },
  {
    id: "driftking",
    title: "Drift King",
    subtitle: "Hold to turn right, release to turn left — drift to the top",
    category: "Racing",
    controls: "Hold / Release",
    accent: "#ffb347",
    cover: "/covers/driftking.jpg",
    playUrl: "/games/driftking/game/index.html",
  },
  {
    id: "8ball",
    title: "8 Ball Billiards",
    subtitle: "Classic 8-ball pool — aim, spin, and sink every ball",
    category: "Sports",
    controls: "Mouse / Touch",
    accent: "#4aa3ff",
    cover: "/covers/8ball.jpg",
    playUrl: "/games/8ball/game/index.html",
  },
  {
    id: "fallcars",
    title: "Fall Cars",
    subtitle: "Drive to the right color before the tiles fall away",
    category: "Racing",
    controls: "WASD / Arrows",
    accent: "#ff6b35",
    cover: "/covers/fallcars.jpg",
    playUrl: "/games/fallcars/game/index.html",
  },
];

const extraCovers = [
  ["Archery/Archery/public/desert-sunset.jpg", "covers/archery.jpg"],
  ["CandyBlast/CandyBlast/public/og.png", "covers/candyblast.png"],
  ["Carrom/Carrom/public/og.png", "covers/carrom.png"],
  ["Pool/Pool/public/og.png", "covers/pool.png"],
  ["Bubble Shooter/Bubble Shooter/public/og.png", "covers/bubbleshooter.png"],
  ["Popper/Popper/public/og.png", "covers/popper.png"],
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

fs.writeFileSync(path.join(OUT, "games.json"), JSON.stringify({ games: catalog }, null, 2));
console.log(`Vercel static build ready → ${OUT}`);
console.log(`Playable games: ${catalog.filter((g) => g.playUrl).length}`);
