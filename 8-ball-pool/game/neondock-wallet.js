/**
 * Neon-Dock demo wallet overlay for 8 Ball Billiards.
 * Deducts a virtual entry fee when a match starts and notifies the admin console.
 */
(function () {
  "use strict";

  var ENTRY_FEE = 50;
  var STORAGE_KEY = "neondock-demo-live-v1";
  var charged = false;
  var ended = false;
  var hud;

  function apiBases() {
    var list = [];
    try {
      if (window.top && window.top !== window) list.push(window.top.location.origin);
    } catch (e) { /* cross-origin parent */ }
    list.push(location.origin);
    list.push("http://127.0.0.1:4040");
    list.push("http://localhost:4040");
    return list.filter(function (v, i, a) { return v && a.indexOf(v) === i; });
  }

  function postParent(payload) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "neondock-demo", payload: payload }, "*");
      }
    } catch (e) { /* ignore */ }
  }

  async function postFirst(path, body) {
    var bases = apiBases();
    for (var i = 0; i < bases.length; i++) {
      try {
        var res = await fetch(bases[i] + path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body || {}),
        });
        if (res.ok) return await res.json();
      } catch (e) { /* try next */ }
    }
    return null;
  }

  function readLive() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {
        users: {}, transactions: [], matches: [], activity: [], gameDeltas: {}, activeMatchId: null
      };
    } catch (e) {
      return { users: {}, transactions: [], matches: [], activity: [], gameDeltas: {}, activeMatchId: null };
    }
  }

  function writeLive(live) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(live)); } catch (e) { /* ignore */ }
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }

  function localStart(mode) {
    var live = readLive();
    if (live.activeMatchId) {
      var existing = live.matches.find(function (m) { return m.id === live.activeMatchId; });
      var tx0 = live.transactions.find(function (t) { return t.matchId === live.activeMatchId; });
      return { ok: true, duplicate: true, match: existing, transaction: tx0, balance: (live.users["u-01"] && live.users["u-01"].balance) || 950 };
    }
    var previous = (live.users["u-01"] && live.users["u-01"].balance != null) ? live.users["u-01"].balance : 1000;
    var next = previous - ENTRY_FEE;
    var now = new Date().toISOString();
    var matchId = uid("m");
    var match = {
      id: matchId, gameId: "8ball", gameName: "8 Ball Billiards", userId: "u-01", username: "PlayerOne",
      opponent: mode === 2 ? "PlayerTwo (local)" : "House AI", status: "active", result: null,
      entryFee: ENTRY_FEE, reward: 0, startedAt: now, endedAt: null, tokensDeducted: ENTRY_FEE,
      mode: mode === 2 ? "PvP" : "PvAI"
    };
    var tx = {
      id: uid("tx"), userId: "u-01", username: "PlayerOne", gameId: "8ball", gameName: "8 Ball Billiards",
      type: "entry_fee", amount: -ENTRY_FEE, previousBalance: previous, newBalance: next,
      status: "completed", date: now, description: "Entry fee · 8 Ball Billiards (" + match.mode + ")", matchId: matchId
    };
    live.users["u-01"] = Object.assign({}, live.users["u-01"] || {}, {
      balance: next, lastActive: now, gamesPlayed: ((live.users["u-01"] && live.users["u-01"].gamesPlayed) || 0) + 1
    });
    live.transactions.unshift(tx);
    live.matches.unshift(match);
    live.activity.unshift({ id: uid("act"), at: now, userId: "u-01", username: "PlayerOne", action: "tokens_deducted", detail: "Entry fee of " + ENTRY_FEE + " tokens deducted (" + previous + " → " + next + ")", gameId: "8ball" });
    live.activity.unshift({ id: uid("act"), at: now, userId: "u-01", username: "PlayerOne", action: "started_game", detail: "Started an 8 Ball Billiards match", gameId: "8ball" });
    live.gameDeltas["8ball"] = {
      plays: ((live.gameDeltas["8ball"] && live.gameDeltas["8ball"].plays) || 0) + 1,
      tokensConsumed: ((live.gameDeltas["8ball"] && live.gameDeltas["8ball"].tokensConsumed) || 0) + ENTRY_FEE,
      lastPlayed: now, activePlayers: 1
    };
    live.activeMatchId = matchId;
    writeLive(live);
    return { ok: true, match: match, transaction: tx, balance: next, previousBalance: previous };
  }

  function ensureHud() {
    if (hud) return hud;
    hud = document.createElement("div");
    hud.id = "neondock-wallet-hud";
    hud.innerHTML = '<strong>PlayerOne</strong><span id="nd-bal">1,000 tokens</span><em id="nd-flash"></em>';
    var css = document.createElement("style");
    css.textContent = "#neondock-wallet-hud{position:fixed;top:10px;right:10px;z-index:99999;background:rgba(12,12,12,.88);color:#f3f3f3;border:1px solid #2a2a2a;border-radius:10px;padding:8px 12px;font:600 12px/1.3 Space Grotesk,sans-serif;display:flex;flex-direction:column;gap:2px;pointer-events:none}#neondock-wallet-hud strong{color:#b8ff3c;font-size:10px;letter-spacing:.08em;text-transform:uppercase}#nd-flash{color:#ff6b6b;min-height:1em;font-style:normal}";
    document.documentElement.appendChild(css);
    document.documentElement.appendChild(hud);
    return hud;
  }

  function setHud(balance, flash) {
    ensureHud();
    var bal = document.getElementById("nd-bal");
    var fl = document.getElementById("nd-flash");
    if (bal) bal.textContent = Number(balance).toLocaleString("en-US") + " tokens";
    if (fl) fl.textContent = flash || "";
  }

  async function onMatchStart(data) {
    if (charged) return;
    charged = true;
    ended = false;
    var mode = (window.projectInfo && window.projectInfo.mode) || 1;
    var result = await postFirst("/api/demo/match-start", { username: "PlayerOne", mode: mode, levelName: data && data.levelName });
    if (!result || !result.ok) result = localStart(mode);
    postParent({ event: "match-start", result: result });
    if (result && result.ok) {
      setHud(result.balance, "Entry fee −" + ENTRY_FEE);
    }
  }

  async function onMatchEnd(won) {
    if (!charged || ended) return;
    ended = true;
    var result = await postFirst("/api/demo/match-end", { won: !!won });
    postParent({ event: "match-end", result: result, won: !!won });
    if (result && result.ok && result.balance != null) {
      setHud(result.balance, won ? "Win reward credited" : "Match complete");
    }
  }

  function wrapAnalytics() {
    var fa = window.famobi_analytics;
    if (!fa || fa.__ndWrapped) return !!fa && fa.__ndWrapped;
    if (typeof fa.trackEvent !== "function") return false;
    var orig = fa.trackEvent.bind(fa);
    fa.trackEvent = function (name, payload) {
      var n = String(name || "");
      if (n.indexOf("LEVELSTART") !== -1) onMatchStart(payload);
      if (n.indexOf("LEVELSUCCESS") !== -1) onMatchEnd(true);
      if (n.indexOf("LEVELFAIL") !== -1) onMatchEnd(false);
      return orig(name, payload);
    };
    fa.__ndWrapped = true;
    return true;
  }

  ensureHud();
  setHud(1000, "");
  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    if (wrapAnalytics() || tries > 200) clearInterval(timer);
  }, 200);

  window.NeonDockWallet = { onMatchStart: onMatchStart, onMatchEnd: onMatchEnd };
})();
