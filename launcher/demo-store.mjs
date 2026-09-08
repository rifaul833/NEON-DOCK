/**
 * In-memory demo wallet + mock catalog for the Neon-Dock admin prototype.
 * Live 8 Ball events are persisted to launcher/.demo-live.json (no real payments).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeed } from "./public/admin/js/seed.mjs";
import { emptyLive, mergeLive, DEMO_USER_ID } from "./public/admin/js/store-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIVE_PATH = path.join(__dirname, ".demo-live.json");

export { DEMO_USER_ID, mergeLive };
export const ENTRY_FEE = 50;
export const WIN_REWARD = 75;

function readLive() {
  try {
    if (!fs.existsSync(LIVE_PATH)) return emptyLive();
    const raw = JSON.parse(fs.readFileSync(LIVE_PATH, "utf8"));
    return { ...emptyLive(), ...raw };
  } catch {
    return emptyLive();
  }
}

function writeLive(live) {
  fs.writeFileSync(LIVE_PATH, JSON.stringify(live, null, 2));
}


function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getState() {
  const seed = buildSeed();
  return mergeLive(seed, readLive());
}

export function recordMatchStart({ username, mode } = {}) {
  const live = readLive();
  const seed = buildSeed();
  const merged = mergeLive(seed, live);
  const user = merged.users.find((u) => u.id === DEMO_USER_ID);
  if (live.activeMatchId) {
    const existing = live.matches.find((m) => m.id === live.activeMatchId);
    const tx = live.transactions.find((t) => t.matchId === live.activeMatchId && t.type === "entry_fee");
    return { ok: true, duplicate: true, match: existing, transaction: tx, balance: user.balance, previousBalance: tx?.previousBalance, state: merged };
  }
  const fee = ENTRY_FEE;
  if (user.balance < fee) {
    return { ok: false, error: "Insufficient demo tokens", state: merged };
  }
  const previous = user.balance;
  const next = previous - fee;
  const now = new Date().toISOString();
  const matchId = uid("m");
  const txId = uid("tx");

  const match = {
    id: matchId,
    gameId: "8ball",
    gameName: "8 Ball Billiards",
    userId: user.id,
    username: user.username,
    opponent: mode === 2 ? "PlayerTwo (local)" : "House AI",
    status: "active",
    result: null,
    entryFee: fee,
    reward: 0,
    startedAt: now,
    endedAt: null,
    tokensDeducted: fee,
    mode: mode === 2 ? "PvP" : "PvAI",
  };

  const tx = {
    id: txId,
    userId: user.id,
    username: username || user.username,
    gameId: "8ball",
    gameName: "8 Ball Billiards",
    type: "entry_fee",
    amount: -fee,
    previousBalance: previous,
    newBalance: next,
    status: "completed",
    date: now,
    description: `Entry fee · 8 Ball Billiards (${match.mode})`,
    matchId,
  };

  live.users[user.id] = {
    ...live.users[user.id],
    balance: next,
    gamesPlayed: user.gamesPlayed + 1,
    lastActive: now,
    wins: user.wins,
    losses: user.losses,
    status: user.status,
  };
  live.transactions.unshift(tx);
  live.matches.unshift(match);
  live.activity.unshift({
    id: uid("act"),
    at: now,
    userId: user.id,
    username: user.username,
    action: "started_game",
    detail: "Started an 8 Ball Billiards match",
    gameId: "8ball",
  });
  live.activity.unshift({
    id: uid("act"),
    at: now,
    userId: user.id,
    username: user.username,
    action: "tokens_deducted",
    detail: `Entry fee of ${fee} tokens deducted (${previous} → ${next})`,
    gameId: "8ball",
  });
  live.gameDeltas["8ball"] = {
    plays: (live.gameDeltas["8ball"]?.plays || 0) + 1,
    tokensConsumed: (live.gameDeltas["8ball"]?.tokensConsumed || 0) + fee,
    lastPlayed: now,
    activePlayers: 1,
  };
  live.activeMatchId = matchId;
  writeLive(live);
  return { ok: true, match, transaction: tx, balance: next, previousBalance: previous, state: mergeLive(seed, live) };
}

export function recordMatchEnd({ won } = {}) {
  const live = readLive();
  const seed = buildSeed();
  const match = live.matches.find((m) => m.id === live.activeMatchId) || live.matches.find((m) => m.status === "active");
  if (!match) {
    return { ok: false, error: "No active match", state: mergeLive(seed, live) };
  }
  const user = mergeLive(seed, live).users.find((u) => u.id === DEMO_USER_ID);
  const now = new Date().toISOString();
  match.status = "completed";
  match.endedAt = now;
  match.result = won ? "win" : "loss";
  live.gameDeltas["8ball"] = {
    ...(live.gameDeltas["8ball"] || {}),
    activePlayers: 0,
    lastPlayed: now,
  };

  const patch = { ...(live.users[user.id] || {}), lastActive: now };
  if (won) patch.wins = (user.wins || 0) + 1;
  else patch.losses = (user.losses || 0) + 1;

  live.activity.unshift({
    id: uid("act"),
    at: now,
    userId: user.id,
    username: user.username,
    action: won ? "won_match" : "lost_match",
    detail: won
      ? "Won 8 Ball Billiards"
      : "Lost 8 Ball Billiards",
    gameId: "8ball",
  });
  live.activity.unshift({
    id: uid("act"),
    at: now,
    userId: user.id,
    username: user.username,
    action: "completed_match",
    detail: `Match ${match.id} completed`,
    gameId: "8ball",
  });

  let rewardTx = null;
  if (won) {
    const previous = patch.balance ?? user.balance;
    const next = previous + WIN_REWARD;
    patch.balance = next;
    match.reward = WIN_REWARD;
    rewardTx = {
      id: uid("tx"),
      userId: user.id,
      username: user.username,
      gameId: "8ball",
      gameName: "8 Ball Billiards",
      type: "reward",
      amount: WIN_REWARD,
      previousBalance: previous,
      newBalance: next,
      status: "completed",
      date: now,
      description: "Match win reward · 8 Ball Billiards",
      matchId: match.id,
    };
    live.transactions.unshift(rewardTx);
    live.activity.unshift({
      id: uid("act"),
      at: now,
      userId: user.id,
      username: user.username,
      action: "tokens_credited",
      detail: `Win reward of ${WIN_REWARD} tokens credited (${previous} → ${next})`,
      gameId: "8ball",
    });
    live.gameDeltas["8ball"].tokensRewarded =
      (live.gameDeltas["8ball"].tokensRewarded || 0) + WIN_REWARD;
  }

  live.users[user.id] = patch;
  live.activeMatchId = null;
  writeLive(live);
  return {
    ok: true,
    match,
    transaction: rewardTx,
    balance: live.users[user.id].balance,
    state: mergeLive(seed, live),
  };
}

export function resetLive() {
  writeLive(emptyLive());
  return getState();
}
