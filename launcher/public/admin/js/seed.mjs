/**
 * Deterministic mock catalog for the Neon-Dock admin demo.
 * Numbers are internally consistent (balances, credits, deductions).
 */

const GAME_CATALOG = [
  { id: "archery", name: "Arrowfall", category: "Shooter", accent: "#e8a54b", entry: 20, reward: 35 },
  { id: "candyblast", name: "CandyBlast", category: "Puzzle", accent: "#ff6b9d", entry: 15, reward: 25 },
  { id: "carrom", name: "Carrom Pop!", category: "Arcade", accent: "#f0c14b", entry: 30, reward: 50 },
  { id: "darts", name: "Dart Dash!", category: "Arcade", accent: "#ff5a5a", entry: 20, reward: 35 },
  { id: "pool", name: "Happy Break!", category: "Arcade", accent: "#3ecf8e", entry: 40, reward: 65 },
  { id: "snakes", name: "Snake & Ladder", category: "Board", accent: "#5ad4ff", entry: 15, reward: 28 },
  { id: "ludo", name: "Ludo", category: "Board", accent: "#ffb347", entry: 15, reward: 30 },
  { id: "bubbleshooter", name: "Bubble Boom!", category: "Puzzle", accent: "#5ec8ff", entry: 18, reward: 32 },
  { id: "popper", name: "Pop! Party", category: "Arcade", accent: "#ff6bcb", entry: 12, reward: 22 },
  { id: "highhills", name: "Summit Rush", category: "Racing", accent: "#7ad4ff", entry: 25, reward: 40 },
  { id: "shootingcar", name: "Shooting Car", category: "Action", accent: "#ff5a36", entry: 22, reward: 38 },
  { id: "rushracing", name: "Rush Racing", category: "Racing", accent: "#ffd24a", entry: 25, reward: 42 },
  { id: "driftking", name: "Drift King", category: "Racing", accent: "#ffb347", entry: 25, reward: 40 },
  { id: "8ball", name: "8 Ball Billiards", category: "Sports", accent: "#4aa3ff", entry: 50, reward: 75 },
  { id: "fallcars", name: "Fall Cars", category: "Racing", accent: "#ff6b35", entry: 20, reward: 36 },
];

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function atDay(offsetDays, hour, minute) {
  const d = new Date("2026-09-08T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - offsetDays);
  d.setUTCHours(hour, minute, (minute * 3) % 60, 0);
  return d.toISOString();
}

function isoDateFromOffset(offsetDays) {
  return atDay(offsetDays, 0, 0).slice(0, 10);
}

export function buildSeed() {
  const rng = mulberry32(20260908);

  const users = [
    { id: "u-01", username: "PlayerOne", email: "player.one@neondock.demo", status: "active", joinedDaysAgo: 2, color: "#b8ff3c" },
    { id: "u-02", username: "RackMaster", email: "rack.master@neondock.demo", status: "active", joinedDaysAgo: 48, color: "#4aa3ff" },
    { id: "u-03", username: "CueQueen", email: "cue.queen@neondock.demo", status: "active", joinedDaysAgo: 41, color: "#ff6bcb" },
    { id: "u-04", username: "NeonAce", email: "neon.ace@neondock.demo", status: "active", joinedDaysAgo: 36, color: "#5ce1e6" },
    { id: "u-05", username: "BreakShot", email: "break.shot@neondock.demo", status: "active", joinedDaysAgo: 29, color: "#ffd24a" },
    { id: "u-06", username: "PocketPro", email: "pocket.pro@neondock.demo", status: "active", joinedDaysAgo: 24, color: "#3ecf8e" },
    { id: "u-07", username: "SpinDoctor", email: "spin.doctor@neondock.demo", status: "inactive", joinedDaysAgo: 60, color: "#e8a54b" },
    { id: "u-08", username: "LimeLancer", email: "lime.lancer@neondock.demo", status: "active", joinedDaysAgo: 18, color: "#d9ff7a" },
    { id: "u-09", username: "DriftNova", email: "drift.nova@neondock.demo", status: "active", joinedDaysAgo: 14, color: "#ffb347" },
    { id: "u-10", username: "ArcadeOwl", email: "arcade.owl@neondock.demo", status: "suspended", joinedDaysAgo: 55, color: "#ff6b6b" },
    { id: "u-11", username: "BoardBaron", email: "board.baron@neondock.demo", status: "active", joinedDaysAgo: 11, color: "#7ad4ff" },
    { id: "u-12", username: "CandyPilot", email: "candy.pilot@neondock.demo", status: "active", joinedDaysAgo: 7, color: "#ff6b9d" },
  ].map((u) => ({
    ...u,
    balance: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    lastActive: atDay(u.id === "u-01" ? 0 : Math.min(u.joinedDaysAgo - 1, 3), 9, 12),
    joinedAt: atDay(u.joinedDaysAgo, 10, 0),
  }));

  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const transactions = [];
  const matches = [];
  const activity = [];
  const gameStats = Object.fromEntries(
    GAME_CATALOG.map((g) => [
      g.id,
      { totalPlays: 0, activePlayers: 0, tokensConsumed: 0, tokensRewarded: 0, lastPlayed: atDay(20, 12, 0) },
    ]),
  );

  const dailyGames = {};
  const dailyDeduct = {};
  const dailyCredit = {};
  const dailyActive = {};
  for (let i = 29; i >= 0; i--) {
    const key = isoDateFromOffset(i);
    dailyGames[key] = 0;
    dailyDeduct[key] = 0;
    dailyCredit[key] = 0;
    dailyActive[key] = new Set();
  }

  let txN = 1000;
  let matchN = 400;
  let actN = 700;

  function pushActivity(at, user, action, detail, gameId) {
    activity.push({
      id: `act-${pad(actN++)}`,
      at,
      userId: user.id,
      username: user.username,
      action,
      detail,
      gameId: gameId || null,
    });
  }

  function credit(user, amount, at, type, game, description, matchId, status = "completed") {
    const previousBalance = user.balance;
    const newBalance = previousBalance + amount;
    user.balance = newBalance;
    const tx = {
      id: `TX-${txN++}`,
      userId: user.id,
      username: user.username,
      gameId: game?.id || null,
      gameName: game?.name || "—",
      type,
      amount,
      previousBalance,
      newBalance,
      status,
      date: at,
      description,
      matchId: matchId || null,
    };
    transactions.push(tx);
    const day = at.slice(0, 10);
    if (dailyCredit[day] != null) dailyCredit[day] += amount;
    if (game) gameStats[game.id].tokensRewarded += amount;
    return tx;
  }

  function debit(user, amount, at, type, game, description, matchId, status = "completed") {
    const previousBalance = user.balance;
    const newBalance = previousBalance - amount;
    user.balance = newBalance;
    const tx = {
      id: `TX-${txN++}`,
      userId: user.id,
      username: user.username,
      gameId: game?.id || null,
      gameName: game?.name || "—",
      type,
      amount: -amount,
      previousBalance,
      newBalance,
      status,
      date: at,
      description,
      matchId: matchId || null,
    };
    transactions.push(tx);
    const day = at.slice(0, 10);
    if (dailyDeduct[day] != null) dailyDeduct[day] += amount;
    if (game) gameStats[game.id].tokensConsumed += amount;
    return tx;
  }

  // Welcome grants
  for (const u of users) {
    const grant = u.id === "u-01" ? 1000 : 400 + Math.floor(rng() * 500);
    const at = atDay(u.joinedDaysAgo, 10, 15);
    credit(u, grant, at, "credit", null, "Welcome bonus · demo wallet", null);
    pushActivity(at, u, "tokens_credited", `Welcome bonus of ${grant} tokens`, null);
  }

  const playableUsers = users.filter((u) => u.id !== "u-01");
  const opponents = ["House AI", "RackMaster", "CueQueen", "NeonAce", "BreakShot", "PocketPro"];

  // Scripted 8-ball showcase (RackMaster): 1000-style story for a different user is not required;
  // include several completed 8-ball matches so the dedicated page is populated.
  const eightBall = GAME_CATALOG.find((g) => g.id === "8ball");

  function playMatch(user, game, offsetDays, hour, minute, { win, status = "completed", refund = false } = {}) {
    const start = atDay(offsetDays, hour, minute);
    const end = atDay(offsetDays, hour, minute + 12 + Math.floor(rng() * 18));
    const matchId = `m-${pad(matchN++)}`;
    const mode = game.id === "8ball" && rng() > 0.72 ? "PvP" : "PvAI";
    const match = {
      id: matchId,
      gameId: game.id,
      gameName: game.name,
      userId: user.id,
      username: user.username,
      opponent: mode === "PvP" ? opponents[Math.floor(rng() * opponents.length)] : "House AI",
      status,
      result: status === "completed" ? (win ? "win" : "loss") : null,
      entryFee: game.entry,
      reward: status === "completed" && win ? game.reward : 0,
      startedAt: start,
      endedAt: status === "completed" ? end : null,
      tokensDeducted: game.entry,
      mode,
    };
    matches.push(match);

    user.gamesPlayed += 1;
    user.lastActive = status === "active" ? start : end;
    gameStats[game.id].totalPlays += 1;
    gameStats[game.id].lastPlayed = match.endedAt || start;
    if (status === "active") gameStats[game.id].activePlayers += 1;

    const day = start.slice(0, 10);
    if (dailyGames[day] != null) dailyGames[day] += 1;
    if (dailyActive[day]) dailyActive[day].add(user.id);

    pushActivity(start, user, "joined_match", `Joined ${game.name}`, game.id);
    pushActivity(start, user, "started_game", `Started ${game.name} (${mode})`, game.id);
    debit(user, game.entry, start, "entry_fee", game, `Entry fee · ${game.name}`, matchId);
    pushActivity(start, user, "tokens_deducted", `Entry fee of ${game.entry} tokens deducted`, game.id);

    if (refund) {
      const refundAt = atDay(offsetDays, hour, minute + 4);
      credit(user, game.entry, refundAt, "refund", game, `Match cancelled · refund`, matchId);
      match.status = "refunded";
      match.result = "cancelled";
      match.endedAt = refundAt;
      match.reward = 0;
      pushActivity(refundAt, user, "tokens_credited", `Refund of ${game.entry} tokens`, game.id);
      return match;
    }

    if (status !== "completed") return match;

    if (win) {
      user.wins += 1;
      credit(user, game.reward, end, "reward", game, `Match win reward · ${game.name}`, matchId);
      pushActivity(end, user, "won_match", `Won ${game.name}`, game.id);
      pushActivity(end, user, "tokens_credited", `Win reward of ${game.reward} tokens`, game.id);
    } else {
      user.losses += 1;
      pushActivity(end, user, "lost_match", `Lost ${game.name}`, game.id);
    }
    pushActivity(end, user, "completed_match", `Completed ${game.name}`, game.id);
    return match;
  }

  // Dedicated 8-ball history
  playMatch(byId["u-02"], eightBall, 1, 18, 20, { win: true });
  playMatch(byId["u-03"], eightBall, 1, 16, 5, { win: false });
  playMatch(byId["u-05"], eightBall, 2, 21, 40, { win: true });
  playMatch(byId["u-06"], eightBall, 3, 14, 10, { win: false });
  playMatch(byId["u-04"], eightBall, 4, 19, 0, { win: true });
  playMatch(byId["u-08"], eightBall, 5, 11, 30, { win: false });
  playMatch(byId["u-02"], eightBall, 6, 20, 15, { win: true });
  playMatch(byId["u-03"], eightBall, 8, 13, 45, { win: true });
  playMatch(byId["u-09"], eightBall, 0, 9, 50, { win: false, status: "active" });
  playMatch(byId["u-07"], eightBall, 12, 15, 0, { win: false, refund: true });

  // Broader catalog activity
  for (let i = 0; i < 72; i++) {
    const user = playableUsers[Math.floor(rng() * playableUsers.length)];
    const game = GAME_CATALOG[Math.floor(rng() * GAME_CATALOG.length)];
    const offset = Math.floor(rng() * 28);
    const hour = 8 + Math.floor(rng() * 14);
    const minute = Math.floor(rng() * 50);
    const win = rng() > 0.46;
    const status = rng() > 0.97 ? "active" : "completed";
    playMatch(user, game, offset, hour, minute, { win, status });
  }

  // Manual promo credit / penalty for variety
  credit(byId["u-04"], 150, atDay(9, 12, 0), "credit", null, "Promo credit · weekend event", null);
  debit(byId["u-10"], 80, atDay(20, 16, 0), "debit", null, "Fair-play adjustment", null);
  pushActivity(atDay(9, 12, 1), byId["u-04"], "tokens_credited", "Promo credit of 150 tokens", null);

  transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
  matches.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  const games = GAME_CATALOG.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    accent: g.accent,
    status: gameStats[g.id].activePlayers > 0 ? "live" : "online",
    totalPlays: gameStats[g.id].totalPlays,
    activePlayers: gameStats[g.id].activePlayers,
    tokensConsumed: gameStats[g.id].tokensConsumed,
    tokensRewarded: gameStats[g.id].tokensRewarded,
    lastPlayed: gameStats[g.id].lastPlayed,
    entryFee: g.entry,
    winReward: g.reward,
  }));

  const analytics = {
    dailyGames: Object.keys(dailyGames)
      .sort()
      .map((date) => ({ date, count: dailyGames[date] })),
    dailyDeductions: Object.keys(dailyDeduct)
      .sort()
      .map((date) => ({ date, amount: dailyDeduct[date] })),
    dailyCredits: Object.keys(dailyCredit)
      .sort()
      .map((date) => ({ date, amount: dailyCredit[date] })),
    dailyActiveUsers: Object.keys(dailyActive)
      .sort()
      .map((date) => ({ date, count: dailyActive[date].size })),
    popularity: games
      .map((g) => ({ gameId: g.id, name: g.name, plays: g.totalPlays }))
      .sort((a, b) => b.plays - a.plays),
  };

  return {
    generatedAt: "2026-09-08T10:00:00.000Z",
    demoUser: {
      id: "u-01",
      username: "PlayerOne",
      startingBalance: 1000,
      entryFee: 50,
      winReward: 75,
    },
    users,
    games,
    transactions,
    matches,
    activity,
    analytics,
  };
}

export { GAME_CATALOG };
