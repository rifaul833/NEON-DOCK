export const DEMO_USER_ID = "u-01";
export const LIVE_STORAGE_KEY = "neondock-demo-live-v1";

export function emptyLive() {
  return {
    users: {},
    transactions: [],
    matches: [],
    activity: [],
    gameDeltas: {},
    activeMatchId: null,
  };
}

export function mergeLive(seed, live = emptyLive()) {
  const users = seed.users.map((u) => {
    const patch = live.users?.[u.id];
    return patch ? { ...u, ...patch } : { ...u };
  });

  const transactions = [...(live.transactions || []), ...seed.transactions];
  const matches = [...(live.matches || []), ...seed.matches];
  const activity = [...(live.activity || []), ...seed.activity];

  const games = seed.games.map((g) => {
    const d = live.gameDeltas?.[g.id] || {};
    return {
      ...g,
      totalPlays: g.totalPlays + (d.plays || 0),
      activePlayers: Math.max(g.activePlayers || 0, d.activePlayers || 0),
      tokensConsumed: g.tokensConsumed + (d.tokensConsumed || 0),
      tokensRewarded: g.tokensRewarded + (d.tokensRewarded || 0),
      lastPlayed: d.lastPlayed || g.lastPlayed,
      status: (d.activePlayers || g.activePlayers) > 0 ? "live" : g.status,
    };
  });

  const analytics = {
    dailyGames: seed.analytics.dailyGames.map((r) => ({ ...r })),
    dailyDeductions: seed.analytics.dailyDeductions.map((r) => ({ ...r })),
    dailyCredits: seed.analytics.dailyCredits.map((r) => ({ ...r })),
    dailyActiveUsers: seed.analytics.dailyActiveUsers.map((r) => ({ ...r })),
    popularity: seed.analytics.popularity.map((r) => ({ ...r })),
  };

  const today = new Date().toISOString().slice(0, 10);
  const bump = (series, key, amount) => {
    const row = series.find((r) => r.date === today);
    if (row) row[key] += amount;
    else series.push({ date: today, [key]: amount });
  };
  for (const tx of live.transactions || []) {
    if (tx.amount < 0) bump(analytics.dailyDeductions, "amount", Math.abs(tx.amount));
    else bump(analytics.dailyCredits, "amount", tx.amount);
  }
  for (const m of live.matches || []) {
    bump(analytics.dailyGames, "count", 1);
    const pop = analytics.popularity.find((p) => p.gameId === m.gameId);
    if (pop) pop.plays += 1;
  }
  if ((live.matches || []).length) bump(analytics.dailyActiveUsers, "count", 1);
  analytics.popularity.sort((a, b) => b.plays - a.plays);

  const credited = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const deducted = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return {
    ...seed,
    users,
    transactions,
    matches,
    activity,
    games,
    analytics,
    totals: {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      totalGames: games.length,
      totalMatches: matches.length,
      tokensCredited: credited,
      tokensDeducted: deducted,
      circulation: users.reduce((s, u) => s + u.balance, 0),
    },
    liveCount: (live.transactions || []).length,
  };
}
