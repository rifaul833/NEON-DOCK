#!/usr/bin/env node
/**
 * Builds a static site for Vercel from the local NEON DOCK launcher.
 * Vinext games need the local Node launcher; Highway Racing is included as static files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public");

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

// Static Highway Racing game
copyDir(path.join(ROOT, "javascript-racer"), path.join(OUT, "games", "racer"));

const catalog = [
  {
    id: "archery",
    title: "Arrowfall",
    subtitle: "3D archery — draw, aim, and hit the mark",
    category: "Shooter",
    controls: "Mouse / Touch",
    accent: "#e8a54b",
    cover: "/covers/archery.jpg",
    playUrl: null,
    localOnly: true,
  },
  {
    id: "candyblast",
    title: "CandyBlast",
    subtitle: "Match-3 puzzles in a glossy candy kingdom",
    category: "Puzzle",
    controls: "Mouse / Touch",
    accent: "#ff6b9d",
    cover: "/covers/candyblast.png",
    playUrl: null,
    localOnly: true,
  },
  {
    id: "carrom",
    title: "Carrom Pop!",
    subtitle: "Cartoon carrom — flick and pocket the pieces",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#f0c14b",
    cover: "/covers/carrom.png",
    playUrl: null,
    localOnly: true,
  },
  {
    id: "darts",
    title: "Dart Dash!",
    subtitle: "Cartoon darts — throw for the bullseye",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#ff5a5a",
    cover: "/covers/darts.png",
    playUrl: null,
    localOnly: true,
  },
  {
    id: "pool",
    title: "Happy Break!",
    subtitle: "Cheerful pool — aim, shoot, clear the table",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#3ecf8e",
    cover: "/covers/pool.png",
    playUrl: null,
    localOnly: true,
  },
  {
    id: "snakes",
    title: "Snake & Ladder",
    subtitle: "Race to the top — climb ladders or slide down",
    category: "Board",
    controls: "Mouse / Touch",
    accent: "#5ad4ff",
    cover: "/covers/snakes.png",
    playUrl: null,
    localOnly: true,
  },
  {
    id: "racer",
    title: "Highway Racing",
    subtitle: "Classic pseudo-3D highway racing",
    category: "Racing",
    controls: "Left / Right",
    accent: "#7cffb2",
    cover: "/covers/highway.png",
    playUrl: "/games/racer/v4.final.html",
    localOnly: false,
  },
  {
    id: "ludo",
    title: "Ludo",
    subtitle: "3D board race — roll, capture, and get all pieces home",
    category: "Board",
    controls: "Mouse / Touch",
    accent: "#ffb347",
    cover: "/covers/ludo.png",
    playUrl: null,
    localOnly: true,
  },
  {
    id: "racingbike",
    title: "Turbo Dice Riders",
    subtitle: "3D bike racing — roll the dice and ride",
    category: "Racing",
    controls: "Arrows / A D",
    accent: "#ff8a3d",
    cover: "/covers/cycling.png",
    playUrl: null,
    localOnly: true,
  },
];

// Copy game cover assets that live outside launcher/public/covers
const extraCovers = [
  ["Archery/Archery/public/desert-sunset.jpg", "covers/archery.jpg"],
  ["CandyBlast/CandyBlast/public/og.png", "covers/candyblast.png"],
  ["Carrom/Carrom/public/og.png", "covers/carrom.png"],
  ["Pool/Pool/public/og.png", "covers/pool.png"],
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
console.log(`Games in catalog: ${catalog.length}`);
