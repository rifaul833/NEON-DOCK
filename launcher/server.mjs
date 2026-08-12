#!/usr/bin/env node
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(__dirname, "public");
const LAUNCHER_PORT = Number(process.env.LAUNCHER_PORT) || 4040;

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   subtitle: string,
 *   category: string,
 *   controls: string,
 *   accent: string,
 *   cwd: string,
 *   port: number,
 *   kind: 'vinext' | 'static',
 *   entry?: string,
 *   cover?: string,
 * }} Game
 */

/** @type {Game[]} */
const GAMES = [
  {
    id: "archery",
    title: "Arrowfall",
    subtitle: "3D archery — draw, aim, and hit the mark",
    category: "Shooter",
    controls: "Mouse / Touch",
    accent: "#e8a54b",
    cwd: path.join(ROOT, "Archery", "Archery"),
    port: 4101,
    kind: "vinext",
    cover: path.join(ROOT, "Archery", "Archery", "public", "desert-sunset.jpg"),
  },
  {
    id: "candyblast",
    title: "CandyBlast",
    subtitle: "Match-3 puzzles in a glossy candy kingdom",
    category: "Puzzle",
    controls: "Mouse / Touch",
    accent: "#ff6b9d",
    cwd: path.join(ROOT, "CandyBlast", "CandyBlast"),
    port: 4102,
    kind: "vinext",
    cover: path.join(ROOT, "CandyBlast", "CandyBlast", "public", "og.png"),
  },
  {
    id: "carrom",
    title: "Carrom Pop!",
    subtitle: "Cartoon carrom — flick and pocket the pieces",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#f0c14b",
    cwd: path.join(ROOT, "Carrom", "Carrom"),
    port: 4103,
    kind: "vinext",
    cover: path.join(ROOT, "Carrom", "Carrom", "public", "og.png"),
  },
  {
    id: "darts",
    title: "Dart Dash!",
    subtitle: "Cartoon darts — throw for the bullseye",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#ff5a5a",
    cwd: path.join(ROOT, "Darts", "Darts"),
    port: 4104,
    kind: "vinext",
    cover: path.join(PUBLIC, "covers", "darts.png"),
  },
  {
    id: "pool",
    title: "Happy Break!",
    subtitle: "Cheerful pool — aim, shoot, clear the table",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#3ecf8e",
    cwd: path.join(ROOT, "Pool", "Pool"),
    port: 4105,
    kind: "vinext",
    cover: path.join(ROOT, "Pool", "Pool", "public", "og.png"),
  },
  {
    id: "snakes",
    title: "Snake & Ladder",
    subtitle: "Race to the top — climb ladders or slide down",
    category: "Board",
    controls: "Mouse / Touch",
    accent: "#5ad4ff",
    cwd: path.join(ROOT, "SnakesAndLadder", "SnakesAndLadder"),
    port: 4106,
    kind: "vinext",
    cover: path.join(PUBLIC, "covers", "snakes.png"),
  },
  {
    id: "ludo",
    title: "Ludo",
    subtitle: "3D board race — roll, capture, and get all pieces home",
    category: "Board",
    controls: "Mouse / Touch",
    accent: "#ffb347",
    cwd: path.join(ROOT, "Ludo", "Ludo"),
    port: 4108,
    kind: "vinext",
    cover: path.join(PUBLIC, "covers", "ludo.png"),
  },
  {
    id: "bubbleshooter",
    title: "Bubble Boom!",
    subtitle: "3D bubble shooter — aim, bounce, and pop",
    category: "Puzzle",
    controls: "Mouse / Touch",
    accent: "#5ec8ff",
    cwd: path.join(ROOT, "Bubble Shooter", "Bubble Shooter"),
    port: 4109,
    kind: "vinext",
    cover: path.join(PUBLIC, "covers", "bubbleshooter.png"),
  },
  {
    id: "popper",
    title: "Pop! Party",
    subtitle: "Tap bubbles, chain combos, dodge bombs",
    category: "Arcade",
    controls: "Mouse / Touch",
    accent: "#ff6bcb",
    cwd: path.join(ROOT, "Popper", "Popper"),
    port: 4110,
    kind: "vinext",
    cover: path.join(PUBLIC, "covers", "popper.png"),
  },
  {
    id: "highhills",
    title: "Summit Rush",
    subtitle: "Flip, boost, and climb endless hill tracks",
    category: "Racing",
    controls: "Tap / Hold",
    accent: "#7ad4ff",
    cwd: path.join(ROOT, "high-hills"),
    port: 4111,
    kind: "static",
    entry: "game/index.html",
    cover: path.join(PUBLIC, "covers", "highhills.jpg"),
  },
  {
    id: "shootingcar",
    title: "Shooting Car",
    subtitle: "Shoot, dodge, and outrun the chaos",
    category: "Action",
    controls: "Keyboard / Touch",
    accent: "#ff5a36",
    cwd: path.join(ROOT, "shooting-car"),
    port: 4112,
    kind: "static",
    entry: "game/index.html",
    cover: path.join(PUBLIC, "covers", "shootingcar.jpg"),
  },
  {
    id: "rushracing",
    title: "Rush Racing",
    subtitle: "Race through traffic at breakneck speed",
    category: "Racing",
    controls: "Keyboard / Touch",
    accent: "#ffd24a",
    cwd: path.join(ROOT, "rush-racing"),
    port: 4113,
    kind: "static",
    entry: "game/index.html",
    cover: path.join(PUBLIC, "covers", "rushracing.jpg"),
  },
  {
    id: "driftking",
    title: "Drift King",
    subtitle: "Hold to turn right, release to turn left — drift to the top",
    category: "Racing",
    controls: "Hold / Release",
    accent: "#ffb347",
    cwd: path.join(ROOT, "Drift-King"),
    port: 4114,
    kind: "static",
    entry: "game/index.html",
    cover: path.join(PUBLIC, "covers", "driftking.jpg"),
  },
];

/** @type {Map<string, { child: import('node:child_process').ChildProcess | null, status: 'stopped' | 'starting' | 'running' | 'error', error?: string, startedAt?: number }>} */
const processes = new Map();
/** Currently focused game for one-at-a-time play */
let activeGameId = null;

for (const game of GAMES) {
  processes.set(game.id, { child: null, status: "stopped" });
}

function gameById(id) {
  return GAMES.find((g) => g.id === id);
}

function publicUrl(port, entry) {
  const host = `http://127.0.0.1:${port}`;
  return entry ? `${host}/${entry}` : host;
}

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path: "/", method: "GET", timeout: 800 },
      (res) => {
        res.resume();
        resolve(true);
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function spawnCommand(cwd, command, args, env = {}) {
  return spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    detached: true,
  });
}

function killProcessTree(child) {
  if (!child) return;
  try {
    if (child.pid) process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
}

function freePort(port) {
  try {
    spawn("fuser", ["-k", `${port}/tcp`], {
      stdio: "ignore",
      detached: true,
    }).unref();
  } catch {
    /* ignore */
  }
}

function assertGameReady(game) {
  if (!fs.existsSync(game.cwd)) {
    throw new Error(`Missing folder: ${game.cwd}`);
  }
  if (game.kind === "vinext") {
    const pkg = path.join(game.cwd, "package.json");
    if (!fs.existsSync(pkg)) {
      throw new Error(
        `${game.title} folder is empty or incomplete (no package.json). Re-copy the full game into ${path.relative(ROOT, game.cwd)}.`,
      );
    }
  }
  if (game.kind === "static") {
    const index = path.join(game.cwd, game.entry || "index.html");
    if (!fs.existsSync(index) && !fs.existsSync(path.join(game.cwd, "index.html"))) {
      throw new Error(`${game.title} is missing its HTML files.`);
    }
  }
}

async function stopGame(id) {
  const game = gameById(id);
  const state = processes.get(id);
  if (!game || !state) throw new Error("Unknown game");

  if (state.child) {
    const child = state.child;
    killProcessTree(child);
    setTimeout(() => {
      try {
        if (child.pid) process.kill(-child.pid, "SIGKILL");
      } catch {
        /* ignore */
      }
    }, 1500);
  }
  freePort(game.port);
  state.child = null;
  state.status = "stopped";
  state.error = undefined;
  if (activeGameId === id) activeGameId = null;
  return { status: "stopped" };
}

async function stopOthers(exceptId) {
  await Promise.all(
    GAMES.filter((g) => g.id !== exceptId).map(async (g) => {
      const state = processes.get(g.id);
      if (state && state.status !== "stopped") {
        await stopGame(g.id);
      } else if (g.id !== exceptId) {
        freePort(g.port);
      }
    }),
  );
}

async function stopAllGames() {
  await Promise.all(GAMES.map((g) => stopGame(g.id)));
}

async function startGame(id, { exclusive = true } = {}) {
  const game = gameById(id);
  if (!game) throw new Error("Unknown game");

  const state = processes.get(id);
  if (!state) throw new Error("Unknown game");

  try {
    assertGameReady(game);
  } catch (err) {
    state.status = "error";
    state.error = err instanceof Error ? err.message : String(err);
    throw err;
  }

  if (exclusive) {
    await stopOthers(id);
  }

  // Always clear this game's port so an orphaned old process can't hijack it
  freePort(game.port);
  await new Promise((r) => setTimeout(r, 400));

  if (state.status === "running" && (await isPortOpen(game.port))) {
    // Port was still held — force free and restart cleanly
    freePort(game.port);
    await new Promise((r) => setTimeout(r, 400));
  }

  if (state.child) {
    killProcessTree(state.child);
    state.child = null;
  }

  state.status = "starting";
  state.error = undefined;
  state.startedAt = Date.now();
  activeGameId = id;

  let child;
  if (game.kind === "vinext") {
    const vinextBin = path.join(game.cwd, "node_modules", ".bin", "vinext");
    const cmd = fs.existsSync(vinextBin) ? vinextBin : "npx";
    const args = fs.existsSync(vinextBin)
      ? ["dev", "-p", String(game.port), "-H", "127.0.0.1"]
      : ["vinext", "dev", "-p", String(game.port), "-H", "127.0.0.1"];
    child = spawnCommand(game.cwd, cmd, args, {
      WRANGLER_LOG_PATH: path.join(game.cwd, ".wrangler", "wrangler.log"),
    });
  } else {
    child = spawnCommand(game.cwd, "python3", [
      "-m",
      "http.server",
      String(game.port),
      "--bind",
      "127.0.0.1",
    ]);
  }

  state.child = child;

  let recentErr = "";
  let exitedEarly = null;
  const logPrefix = `[${game.id}]`;
  child.stdout?.on("data", (buf) => {
    const line = buf.toString().trim();
    if (line) console.log(logPrefix, line.slice(0, 200));
  });
  child.stderr?.on("data", (buf) => {
    const text = buf.toString();
    recentErr = (recentErr + text).slice(-1200);
    const line = text.trim();
    if (line) console.error(logPrefix, line.slice(0, 200));
  });
  child.on("exit", (code, signal) => {
    const current = processes.get(id);
    if (current?.child === child) {
      current.child = null;
      if (current.status === "starting") {
        exitedEarly = { code, signal };
      } else if (current.status !== "stopped") {
        current.status = code === 0 || signal === "SIGTERM" ? "stopped" : "error";
        if (code !== 0 && code !== null && signal !== "SIGTERM") {
          current.error = recentErr.trim() || `Process exited with code ${code}`;
        }
      }
    }
  });

  const timeoutMs = game.kind === "static" ? 20000 : 120000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (exitedEarly) {
      const detail =
        recentErr.match(/Cannot find native binding[\s\S]{0,80}/)?.[0] ||
        recentErr.trim().split("\n").filter(Boolean).slice(-2).join(" ") ||
        `Process exited with code ${exitedEarly.code}`;
      state.status = "error";
      state.error = detail.slice(0, 240);
      if (activeGameId === id) activeGameId = null;
      throw new Error(state.error);
    }
    if (await isPortOpen(game.port)) {
      state.status = "running";
      activeGameId = id;
      return { url: publicUrl(game.port, game.entry), status: "running", active: id };
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  state.status = "error";
  state.error = recentErr.trim()
    ? recentErr.trim().slice(0, 240)
    : "Timed out waiting for the game server to start";
  killProcessTree(child);
  state.child = null;
  if (activeGameId === id) activeGameId = null;
  throw new Error(state.error);
}

async function snapshot() {
  const list = [];
  for (const game of GAMES) {
    const state = processes.get(game.id);
    let status = state?.status ?? "stopped";
    if (status === "running" || status === "starting") {
      const open = await isPortOpen(game.port);
      if (open) status = "running";
      else if (status === "running") status = "starting";
    }
    list.push({
      id: game.id,
      title: game.title,
      subtitle: game.subtitle,
      category: game.category,
      controls: game.controls,
      accent: game.accent,
      port: game.port,
      status,
      error: state?.error,
      url: status === "running" ? publicUrl(game.port, game.entry) : null,
      cover: `/covers/${game.id}?v=3`,
      active: activeGameId === game.id,
    });
  }
  return list;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC, urlPath));
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  serveFile(filePath, res);
}

function serveCover(id, res) {
  const game = gameById(id);
  if (!game) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  if (game.cover && fs.existsSync(game.cover)) {
    serveFile(game.cover, res);
    return;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${game.accent}"/>
        <stop offset="100%" stop-color="#111"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="#0d0d0d"/>
    <rect width="640" height="400" fill="url(#g)" opacity="0.85"/>
    <text x="40" y="210" fill="#fff" font-family="Arial Black, sans-serif" font-size="42">${game.title}</text>
    <text x="40" y="250" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="18">${game.category}</text>
  </svg>`;
  res.writeHead(200, { "Content-Type": "image/svg+xml" });
  res.end(svg);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${LAUNCHER_PORT}`);
  const { pathname } = url;

  try {
    if (req.method === "GET" && pathname === "/api/games") {
      sendJson(res, 200, { games: await snapshot(), active: activeGameId });
      return;
    }

    if (req.method === "POST" && pathname === "/api/stop-all") {
      await readBody(req);
      await stopAllGames();
      sendJson(res, 200, { status: "stopped" });
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/games/") && pathname.endsWith("/play")) {
      const id = pathname.slice("/api/games/".length, -"/play".length);
      await readBody(req);
      const result = await startGame(id, { exclusive: true });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/games/") && pathname.endsWith("/start")) {
      const id = pathname.slice("/api/games/".length, -"/start".length);
      await readBody(req);
      const result = await startGame(id, { exclusive: true });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && pathname.startsWith("/api/games/") && pathname.endsWith("/stop")) {
      const id = pathname.slice("/api/games/".length, -"/stop".length);
      await readBody(req);
      const result = await stopGame(id);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/covers/")) {
      serveCover(pathname.slice("/covers/".length), res);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res);
      return;
    }

    res.writeHead(405);
    res.end("Method not allowed");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    sendJson(res, 500, { error: message });
  }
});

function shutdown() {
  console.log("\nShutting down games…");
  for (const [id, state] of processes) {
    if (state.child) {
      killProcessTree(state.child);
      console.log(`  stopped ${id}`);
    }
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(LAUNCHER_PORT, "127.0.0.1", () => {
  console.log(`\n  NEON DOCK`);
  console.log(`  → http://127.0.0.1:${LAUNCHER_PORT}\n`);
  console.log(`  Click a card to play. Switching games auto-stops the previous one.`);
  console.log(`  Press Ctrl+C to stop the launcher and any running games.\n`);
});
