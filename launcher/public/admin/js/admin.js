import { buildSeed } from "./seed.mjs";
import { mergeLive, emptyLive, LIVE_STORAGE_KEY } from "./store-core.mjs";

const PAGE_SIZE = 10;
const AUTH_KEY = "neondock-admin-auth";
const DEMO_EMAIL = "admin@gmail.com";
const DEMO_PASSWORD = "12345678";
const NAV = [
  { hash: "#/", id: "overview", label: "Overview", icon: "▦" },
  { hash: "#/users", id: "users", label: "Users", icon: "☺" },
  { hash: "#/tokens", id: "tokens", label: "Tokens", icon: "◎" },
  { hash: "#/games", id: "games", label: "Games", icon: "▶" },
  { hash: "#/games/8ball", id: "8ball", label: "8 Ball Billiards", icon: "●" },
  { hash: "#/transactions", id: "transactions", label: "Transactions", icon: "⇄" },
  { hash: "#/activity", id: "activity", label: "Activity", icon: "⌁" },
  { hash: "#/analytics", id: "analytics", label: "Analytics", icon: "▴" },
];

const TYPE_LABEL = {
  credit: "Credit",
  debit: "Debit",
  reward: "Reward",
  entry_fee: "Entry fee",
  refund: "Refund",
};

const ACTION_LABEL = {
  started_game: "User started a game",
  completed_match: "User completed a match",
  tokens_deducted: "Tokens deducted",
  tokens_credited: "Tokens credited",
  joined_match: "User joined a match",
  won_match: "User won a match",
  lost_match: "User lost a match",
};

let data = null;
let loading = true;
let rangeDays = 14;
const tableState = {
  users: { q: "", sort: "username", dir: 1, page: 1, status: "all" },
  tx: { q: "", sort: "date", dir: -1, page: 1, type: "all", game: "all" },
  games: { q: "" },
  activity: { q: "", page: 1, action: "all" },
  matches: { page: 1 },
};

const app = document.getElementById("app");

function isAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

function setAuthed(on) {
  try {
    if (on) sessionStorage.setItem(AUTH_KEY, "1");
    else sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

function renderLogin(error = "") {
  app.classList.add("login-mode");
  app.innerHTML = `
    <div class="login-screen">
      <form class="login-card" id="login-form" autocomplete="on">
        <div class="brand" style="padding:0">
          <span class="brand-mark"></span>
          <div>NEON DOCK<small>ADMIN CONSOLE</small></div>
        </div>
        <h1>Sign in</h1>
        <p class="sub">Enter your admin credentials to open the dashboard.</p>
        <p class="login-error ${error ? "show" : ""}" id="login-error">${escapeHtml(error || "Invalid email or password.")}</p>
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" required placeholder="admin@gmail.com" autocomplete="username" />
        </div>
        <div class="field">
          <label for="login-password">Password</label>
          <input id="login-password" name="password" type="password" required placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button class="btn btn-lime" type="submit">Sign in</button>
        <div class="login-hint">Demo access · <code>${DEMO_EMAIL}</code> · <code>${DEMO_PASSWORD}</code></div>
      </form>
    </div>
  `;
  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setAuthed(true);
      loading = true;
      render();
      await loadData();
      render();
      return;
    }
    const err = document.getElementById("login-error");
    err.classList.add("show");
    document.getElementById("login-password").value = "";
    document.getElementById("login-password").focus();
  });
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US");
}
function fmtAmt(n) {
  const v = Number(n);
  const sign = v > 0 ? "+" : "";
  return `${sign}${fmt(v)}`;
}
function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseRoute() {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  if (!parts.length) return { name: "overview" };
  if (parts[0] === "users" && parts[1]) return { name: "user", id: parts[1] };
  if (parts[0] === "users") return { name: "users" };
  if (parts[0] === "tokens") return { name: "tokens" };
  if (parts[0] === "games" && parts[1] === "8ball") return { name: "8ball" };
  if (parts[0] === "games") return { name: "games" };
  if (parts[0] === "transactions" && parts[1]) return { name: "tx", id: parts[1] };
  if (parts[0] === "transactions") return { name: "transactions" };
  if (parts[0] === "activity") return { name: "activity" };
  if (parts[0] === "analytics") return { name: "analytics" };
  if (parts[0] === "matches" && parts[1]) return { name: "match", id: parts[1] };
  return { name: "overview" };
}

function localLive() {
  try {
    return JSON.parse(localStorage.getItem(LIVE_STORAGE_KEY) || "null") || emptyLive();
  } catch {
    return emptyLive();
  }
}

async function loadData() {
  const seed = buildSeed();
  try {
    const res = await fetch("/api/demo/state", { cache: "no-store" });
    if (res.ok) {
      data = await res.json();
      loading = false;
      return;
    }
  } catch {
    /* static / no API */
  }
  data = mergeLive(seed, localLive());
  loading = false;
}

function badge(kind, label) {
  return `<span class="badge ${kind}">${escapeHtml(label)}</span>`;
}

function pager(page, total, key) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return `<div class="pager">
    <span>Page ${page} / ${pages} · ${fmt(total)}</span>
    <button data-page-key="${key}" data-page="${Math.max(1, page - 1)}">Prev</button>
    <button data-page-key="${key}" data-page="${Math.min(pages, page + 1)}">Next</button>
  </div>`;
}

function slicePage(list, page) {
  const start = (page - 1) * PAGE_SIZE;
  return list.slice(start, start + PAGE_SIZE);
}

function sortBy(list, key, dir) {
  return [...list].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
}

function demoUser() {
  return data.users.find((u) => u.id === data.demoUser.id);
}

function renderShell(title, body) {
  const route = parseRoute();
  const user = data ? demoUser() : null;
  app.classList.remove("login-mode");
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark"></span>
        <div>NEON DOCK<small>ADMIN CONSOLE</small></div>
      </div>
      ${NAV.map((n) => `<a class="nav-link ${isActive(route, n) ? "active" : ""}" href="${n.hash}"><span class="nav-ico">${n.icon}</span>${n.label}</a>`).join("")}
      <div class="sidebar-foot"><a class="dock-link" href="/">← Back to dock</a></div>
    </aside>
    <section class="main">
      <header class="top">
        <h1>${escapeHtml(title)}</h1>
        <div class="top-right">
          <span class="chip live">Demo · virtual tokens</span>
          ${user ? `<span class="chip">${escapeHtml(user.username)} · ${fmt(user.balance)} tok</span>` : ""}
          <input class="search" id="global-search" placeholder="Search users, tx, games…" />
          <button class="btn btn-ghost" type="button" id="sign-out">Sign out</button>
        </div>
      </header>
      <div class="content">${loading ? skeleton() : body}</div>
    </section>
  `;
  const gs = document.getElementById("global-search");
  if (gs) {
    gs.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const q = gs.value.trim();
      if (!q) return;
      location.hash = `#/transactions?q=${encodeURIComponent(q)}`;
    });
  }
  document.getElementById("sign-out")?.addEventListener("click", () => {
    setAuthed(false);
    renderLogin();
  });
}

function isActive(route, nav) {
  if (nav.id === "overview") return route.name === "overview";
  if (nav.id === "8ball") return route.name === "8ball";
  if (nav.id === "users") return route.name === "users" || route.name === "user";
  if (nav.id === "transactions") return route.name === "transactions" || route.name === "tx";
  return route.name === nav.id;
}

function skeleton() {
  return `<div class="kpis">${"<div class='skeleton'></div>".repeat(4)}</div><div class="skeleton" style="height:280px"></div>`;
}

function kpi(label, value, hint) {
  return `<article class="card kpi"><div class="label">${label}</div><div class="value">${value}</div>${hint ? `<div class="hint">${hint}</div>` : ""}</article>`;
}

function renderOverview() {
  const t = data.totals;
  const demo = demoUser();
  const recentAct = data.activity.slice(0, 8);
  const recentTx = data.transactions.slice(0, 8);
  renderShell("Dashboard overview", `
    <div class="callout">
      <div>
        <strong>8 Ball token demo</strong>
        <div class="muted">${escapeHtml(demo.username)} starts at ${fmt(data.demoUser.startingBalance)} tokens. Playing 8 Ball Billiards deducts an entry fee of ${data.demoUser.entryFee}. Win reward is ${data.demoUser.winReward}.</div>
      </div>
      <div>
        Current balance: <strong>${fmt(demo.balance)}</strong>
        ${data.liveCount ? `<div class="muted">${data.liveCount} live demo transaction(s) recorded this session</div>` : `<div class="muted">No live match yet — play 8 Ball from the dock</div>`}
      </div>
    </div>
    <div class="kpis">
      ${kpi("Total users", fmt(t.totalUsers), `${fmt(t.activeUsers)} active`)}
      ${kpi("Total games", fmt(t.totalGames), `${fmt(data.games.filter((g) => g.status === "live").length)} live now`)}
      ${kpi("Matches played", fmt(t.totalMatches), "All catalog titles")}
      ${kpi("Token circulation", fmt(t.circulation), "Sum of user wallets")}
      ${kpi("Tokens credited", fmt(t.tokensCredited), "Bonuses, rewards, refunds")}
      ${kpi("Tokens deducted", fmt(t.tokensDeducted), "Entry fees and adjustments")}
      ${kpi("Demo player", fmt(demo.balance), `${demo.gamesPlayed} games · ${demo.wins}W / ${demo.losses}L`)}
      ${kpi("8 Ball plays", fmt(data.games.find((g) => g.id === "8ball").totalPlays), `${fmt(data.games.find((g) => g.id === "8ball").tokensConsumed)} tokens consumed`)}
    </div>
    <div class="split">
      <article class="card">
        <div class="section-title"><h2>Recent transactions</h2><a class="muted" href="#/transactions">View all</a></div>
        ${txTable(recentTx, false)}
      </article>
      <article class="card">
        <div class="section-title"><h2>Recent activity</h2><a class="muted" href="#/activity">Audit log</a></div>
        ${activityList(recentAct)}
      </article>
    </div>
  `);
}

function txTable(rows, sortable = true) {
  if (!rows.length) return `<div class="empty">No transactions match these filters.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr>
      <th data-sort="id">ID</th><th data-sort="username">User</th><th data-sort="gameName">Game</th>
      <th data-sort="type">Type</th><th data-sort="amount">Amount</th>
      <th>Previous</th><th>New</th><th>Status</th><th data-sort="date">Date</th>
    </tr></thead>
    <tbody>${rows.map((t) => `<tr class="clickable" data-href="#/transactions/${t.id}">
      <td>${escapeHtml(t.id)}</td>
      <td>${escapeHtml(t.username)}</td>
      <td>${escapeHtml(t.gameName)}</td>
      <td>${badge(t.type, TYPE_LABEL[t.type] || t.type)}</td>
      <td class="amt ${t.amount < 0 ? "neg" : "pos"}">${fmtAmt(t.amount)}</td>
      <td>${fmt(t.previousBalance)}</td>
      <td>${fmt(t.newBalance)}</td>
      <td>${badge(t.status, t.status)}</td>
      <td>${fmtWhen(t.date)}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function activityList(rows) {
  if (!rows.length) return `<div class="empty">No activity yet.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>When</th><th>User</th><th>Event</th><th>Detail</th></tr></thead>
    <tbody>${rows.map((a) => `<tr>
      <td>${fmtWhen(a.at)}</td>
      <td>${escapeHtml(a.username)}</td>
      <td>${badge(a.action, ACTION_LABEL[a.action] || a.action)}</td>
      <td>${escapeHtml(a.detail)}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function renderUsers() {
  const st = tableState.users;
  let list = data.users.filter((u) => {
    const q = st.q.toLowerCase();
    const hit = !q || [u.username, u.email, u.id].some((v) => String(v).toLowerCase().includes(q));
    const stOk = st.status === "all" || u.status === st.status;
    return hit && stOk;
  });
  list = sortBy(list, st.sort, st.dir);
  const pageRows = slicePage(list, st.page);
  renderShell("Users", `
    <div class="toolbar">
      <input id="user-q" value="${escapeHtml(st.q)}" placeholder="Search username, email, ID" />
      <select id="user-status">
        ${["all", "active", "inactive", "suspended"].map((s) => `<option ${st.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </div>
    <article class="card">
      <div class="table-wrap"><table>
        <thead><tr>
          <th data-usort="id">User ID</th><th data-usort="username">Username</th><th data-usort="email">Email</th>
          <th data-usort="balance">Token balance</th><th data-usort="gamesPlayed">Games</th>
          <th>W / L</th><th data-usort="status">Status</th><th data-usort="lastActive">Last active</th>
        </tr></thead>
        <tbody>${pageRows.map((u) => `<tr class="clickable" data-href="#/users/${u.id}">
          <td>${escapeHtml(u.id)}</td>
          <td>${escapeHtml(u.username)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${fmt(u.balance)}</td>
          <td>${fmt(u.gamesPlayed)}</td>
          <td>${u.wins} / ${u.losses}</td>
          <td>${badge(u.status, u.status)}</td>
          <td>${fmtWhen(u.lastActive)}</td>
        </tr>`).join("")}</tbody>
      </table></div>
      ${pager(st.page, list.length, "users")}
    </article>
  `);
  document.getElementById("user-q").addEventListener("input", (e) => { st.q = e.target.value; st.page = 1; renderUsers(); });
  document.getElementById("user-status").addEventListener("change", (e) => { st.status = e.target.value; st.page = 1; renderUsers(); });
}

function renderUser(id) {
  const u = data.users.find((x) => x.id === id);
  if (!u) {
    renderShell("User", `<div class="empty">User not found.</div>`);
    return;
  }
  const txs = data.transactions.filter((t) => t.userId === id).slice(0, 12);
  const ms = data.matches.filter((m) => m.userId === id).slice(0, 8);
  renderShell(`User · ${u.username}`, `
    <div class="profile">
      <article class="card">
        <div class="avatar" style="background:${u.color}">${u.username.slice(0, 2).toUpperCase()}</div>
        <h2 style="margin:0.7rem 0 0.2rem">${escapeHtml(u.username)}</h2>
        <div class="muted">${escapeHtml(u.email)}</div>
        <div class="statgrid">
          ${kpi("Balance", fmt(u.balance))}
          ${kpi("Played", fmt(u.gamesPlayed))}
          ${kpi("Record", `${u.wins}W / ${u.losses}L`)}
        </div>
        <p class="muted" style="margin-top:0.8rem">Status ${badge(u.status, u.status)} · Joined ${fmtWhen(u.joinedAt)}</p>
      </article>
      <div>
        <article class="card" style="margin-bottom:0.85rem">
          <div class="section-title"><h2>Wallet history</h2></div>
          ${txTable(txs, false)}
        </article>
        <article class="card">
          <div class="section-title"><h2>Matches</h2></div>
          ${matchTable(ms)}
        </article>
      </div>
    </div>
  `);
}

function matchTable(rows) {
  if (!rows.length) return `<div class="empty">No matches.</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Match</th><th>Game</th><th>User</th><th>Opponent</th><th>Status</th><th>Result</th><th>Fee</th><th>Started</th></tr></thead>
    <tbody>${rows.map((m) => `<tr class="clickable" data-href="#/matches/${m.id}">
      <td>${escapeHtml(m.id)}</td><td>${escapeHtml(m.gameName)}</td><td>${escapeHtml(m.username)}</td>
      <td>${escapeHtml(m.opponent)}</td><td>${badge(m.status, m.status)}</td>
      <td>${m.result ? badge(m.result, m.result) : "—"}</td>
      <td>${fmt(m.entryFee)}</td><td>${fmtWhen(m.startedAt)}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function renderTokens() {
  const credits = data.transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const debits = data.transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  renderShell("Token / wallet management", `
    <div class="kpis">
      ${kpi("Circulation", fmt(data.totals.circulation), "Current wallets")}
      ${kpi("Total credits", fmt(credits), "Inbound")}
      ${kpi("Total deductions", fmt(debits), "Outbound")}
      ${kpi("Demo player", fmt(demoUser().balance), "PlayerOne")}
    </div>
    <article class="card">
      <div class="section-title"><h2>Balances</h2></div>
      <div class="table-wrap"><table>
        <thead><tr><th>User</th><th>Balance</th><th>Credits in</th><th>Deductions</th><th>Last active</th></tr></thead>
        <tbody>${data.users.map((u) => {
          const mine = data.transactions.filter((t) => t.userId === u.id);
          const cin = mine.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
          const dout = mine.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
          return `<tr class="clickable" data-href="#/users/${u.id}"><td>${escapeHtml(u.username)}</td><td>${fmt(u.balance)}</td><td class="amt pos">+${fmt(cin)}</td><td class="amt neg">-${fmt(dout)}</td><td>${fmtWhen(u.lastActive)}</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </article>
    <article class="card" style="margin-top:0.85rem">
      <div class="section-title"><h2>Transaction history</h2><a class="muted" href="#/transactions">Open full ledger</a></div>
      ${txTable(data.transactions.slice(0, 12), false)}
    </article>
  `);
}

function renderGames() {
  const q = tableState.games.q.toLowerCase();
  const list = data.games.filter((g) => !q || g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
  renderShell("Game management", `
    <div class="toolbar"><input id="game-q" value="${escapeHtml(tableState.games.q)}" placeholder="Filter games" /></div>
    <div class="game-grid">${list.map((g) => `
      <article class="card game-card" ${g.id === "8ball" ? `style="cursor:pointer" data-href="#/games/8ball"` : ""}>
        <div class="section-title"><h3>${escapeHtml(g.name)}</h3>${badge(g.status, g.status)}</div>
        <div class="meta">${escapeHtml(g.category)} · entry ${fmt(g.entryFee)} · reward ${fmt(g.winReward)}</div>
        <dl>
          <div><dt>Total plays</dt><dd>${fmt(g.totalPlays)}</dd></div>
          <div><dt>Active players</dt><dd>${fmt(g.activePlayers)}</dd></div>
          <div><dt>Tokens consumed</dt><dd>${fmt(g.tokensConsumed)}</dd></div>
          <div><dt>Tokens rewarded</dt><dd>${fmt(g.tokensRewarded)}</dd></div>
        </dl>
        <p class="muted" style="margin-top:0.65rem">Last played ${fmtWhen(g.lastPlayed)}</p>
      </article>`).join("")}</div>
  `);
  document.getElementById("game-q").addEventListener("input", (e) => { tableState.games.q = e.target.value; renderGames(); });
}

function renderEightBall() {
  const g = data.games.find((x) => x.id === "8ball");
  const matches = data.matches.filter((m) => m.gameId === "8ball");
  const txs = data.transactions.filter((t) => t.gameId === "8ball");
  const players = new Set(matches.map((m) => m.userId)).size;
  const live = demoUser();
  const example = txs.find((t) => t.userId === live.id && t.type === "entry_fee") || {
    username: live.username,
    previousBalance: data.demoUser.startingBalance,
    amount: -data.demoUser.entryFee,
    newBalance: live.balance,
    status: "awaiting play",
  };
  renderShell("8 Ball Billiards", `
    <div class="callout">
      <div>
        <strong>Live deduction story</strong>
        <div>User: ${escapeHtml(example.username)} · Game: 8 Ball Billiards · Entry fee: ${data.demoUser.entryFee} tokens</div>
        <div class="muted">Previous ${fmt(example.previousBalance)} · Deducted ${fmtAmt(example.amount)} · New ${fmt(example.newBalance)} · ${example.status}</div>
      </div>
      <a class="btn btn-lime" href="/">Play from dock</a>
    </div>
    <div class="kpis">
      ${kpi("Total matches", fmt(matches.length))}
      ${kpi("Active matches", fmt(matches.filter((m) => m.status === "active").length))}
      ${kpi("Completed", fmt(matches.filter((m) => m.status === "completed").length))}
      ${kpi("Players", fmt(players))}
      ${kpi("Tokens deducted", fmt(g.tokensConsumed))}
      ${kpi("Tokens rewarded", fmt(g.tokensRewarded))}
    </div>
    <div class="split">
      <article class="card">
        <div class="section-title"><h2>Recent matches</h2></div>
        ${matchTable(matches.slice(0, 10))}
      </article>
      <article class="card">
        <div class="section-title"><h2>Recent token transactions</h2></div>
        ${txTable(txs.slice(0, 10), false)}
      </article>
    </div>
  `);
}

function txFiltersFromHash() {
  const q = new URLSearchParams(location.hash.split("?")[1] || "");
  if (q.get("q") && !tableState.tx.q) tableState.tx.q = q.get("q");
}

function renderTransactions() {
  txFiltersFromHash();
  const st = tableState.tx;
  let list = data.transactions.filter((t) => {
    const q = st.q.toLowerCase();
    const hit = !q || [t.id, t.username, t.gameName, t.description, t.type].some((v) => String(v).toLowerCase().includes(q));
    const typeOk = st.type === "all" || t.type === st.type;
    const gameOk = st.game === "all" || t.gameId === st.game;
    return hit && typeOk && gameOk;
  });
  list = sortBy(list, st.sort, st.dir);
  const rows = slicePage(list, st.page);
  const games = [{ id: "all", name: "All games" }, ...data.games];
  renderShell("Transactions", `
    <div class="toolbar">
      <input id="tx-q" value="${escapeHtml(st.q)}" placeholder="Search ID, user, game, description" />
      <select id="tx-type">${["all", "credit", "debit", "reward", "entry_fee", "refund"].map((t) => `<option value="${t}" ${st.type === t ? "selected" : ""}>${t === "all" ? "All types" : TYPE_LABEL[t]}</option>`).join("")}</select>
      <select id="tx-game">${games.map((g) => `<option value="${g.id}" ${st.game === g.id ? "selected" : ""}>${escapeHtml(g.name)}</option>`).join("")}</select>
    </div>
    <article class="card">
      ${txTable(rows)}
      ${pager(st.page, list.length, "tx")}
    </article>
  `);
  document.getElementById("tx-q").addEventListener("input", (e) => { st.q = e.target.value; st.page = 1; renderTransactions(); });
  document.getElementById("tx-type").addEventListener("change", (e) => { st.type = e.target.value; st.page = 1; renderTransactions(); });
  document.getElementById("tx-game").addEventListener("change", (e) => { st.game = e.target.value; st.page = 1; renderTransactions(); });
}

function renderTx(id) {
  const t = data.transactions.find((x) => x.id === id);
  if (!t) {
    renderShell("Transaction", `<div class="empty">Transaction not found.</div>`);
    return;
  }
  renderShell(`Transaction · ${t.id}`, `
    <article class="card">
      <dl class="kv">
        <dt>Transaction ID</dt><dd>${escapeHtml(t.id)}</dd>
        <dt>User</dt><dd><a href="#/users/${t.userId}">${escapeHtml(t.username)}</a></dd>
        <dt>Game</dt><dd>${escapeHtml(t.gameName)}</dd>
        <dt>Type</dt><dd>${badge(t.type, TYPE_LABEL[t.type] || t.type)}</dd>
        <dt>Amount</dt><dd class="amt ${t.amount < 0 ? "neg" : "pos"}">${fmtAmt(t.amount)}</dd>
        <dt>Previous balance</dt><dd>${fmt(t.previousBalance)}</dd>
        <dt>New balance</dt><dd>${fmt(t.newBalance)}</dd>
        <dt>Status</dt><dd>${badge(t.status, t.status)}</dd>
        <dt>Date</dt><dd>${fmtWhen(t.date)}</dd>
        <dt>Description</dt><dd>${escapeHtml(t.description)}</dd>
        <dt>Match</dt><dd>${t.matchId ? `<a href="#/matches/${t.matchId}">${escapeHtml(t.matchId)}</a>` : "—"}</dd>
      </dl>
    </article>
  `);
}

function renderMatch(id) {
  const m = data.matches.find((x) => x.id === id);
  if (!m) {
    renderShell("Match", `<div class="empty">Match not found.</div>`);
    return;
  }
  const txs = data.transactions.filter((t) => t.matchId === id);
  renderShell(`Match · ${m.id}`, `
    <article class="card" style="margin-bottom:0.85rem">
      <dl class="kv">
        <dt>Game</dt><dd>${escapeHtml(m.gameName)}</dd>
        <dt>Player</dt><dd><a href="#/users/${m.userId}">${escapeHtml(m.username)}</a></dd>
        <dt>Opponent</dt><dd>${escapeHtml(m.opponent)}</dd>
        <dt>Mode</dt><dd>${escapeHtml(m.mode || "—")}</dd>
        <dt>Status</dt><dd>${badge(m.status, m.status)}</dd>
        <dt>Result</dt><dd>${m.result ? badge(m.result, m.result) : "—"}</dd>
        <dt>Entry fee</dt><dd>${fmt(m.entryFee)}</dd>
        <dt>Reward</dt><dd>${fmt(m.reward)}</dd>
        <dt>Started</dt><dd>${fmtWhen(m.startedAt)}</dd>
        <dt>Ended</dt><dd>${fmtWhen(m.endedAt)}</dd>
      </dl>
    </article>
    <article class="card">
      <div class="section-title"><h2>Related transactions</h2></div>
      ${txTable(txs, false)}
    </article>
  `);
}

function renderActivity() {
  const st = tableState.activity;
  let list = data.activity.filter((a) => {
    const q = st.q.toLowerCase();
    const hit = !q || [a.username, a.detail, a.action].some((v) => String(v).toLowerCase().includes(q));
    return hit && (st.action === "all" || a.action === st.action);
  });
  const rows = slicePage(list, st.page);
  renderShell("Activity / audit log", `
    <div class="toolbar">
      <input id="act-q" value="${escapeHtml(st.q)}" placeholder="Search activity" />
      <select id="act-type">${["all", ...Object.keys(ACTION_LABEL)].map((k) => `<option value="${k}" ${st.action === k ? "selected" : ""}>${k === "all" ? "All events" : ACTION_LABEL[k]}</option>`).join("")}</select>
    </div>
    <article class="card">
      ${activityList(rows)}
      ${pager(st.page, list.length, "activity")}
    </article>
  `);
  document.getElementById("act-q").addEventListener("input", (e) => { st.q = e.target.value; st.page = 1; renderActivity(); });
  document.getElementById("act-type").addEventListener("change", (e) => { st.action = e.target.value; st.page = 1; renderActivity(); });
}

function lastN(series, days, key) {
  return series.slice(-days).map((r) => r[key] || 0);
}

function drawBars(canvas, values, color) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth * 2;
  const h = canvas.height = canvas.clientHeight * 2;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(1, ...values);
  const gap = 6;
  const barW = (w - gap * values.length) / values.length;
  values.forEach((v, i) => {
    const bh = (v / max) * (h - 24);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(i * (barW + gap), h - bh, barW, bh);
  });
}

function renderAnalytics() {
  const days = rangeDays;
  renderShell("Analytics", `
    <div class="toolbar">
      ${[7, 14, 30].map((d) => `<button class="btn ${rangeDays === d ? "btn-lime" : "btn-ghost"}" data-range="${d}">${d}d</button>`).join("")}
    </div>
    <div class="split">
      <article class="card"><div class="section-title"><h2>Daily games played</h2></div><canvas class="chart" id="c-games"></canvas></article>
      <article class="card"><div class="section-title"><h2>Active users</h2></div><canvas class="chart" id="c-users"></canvas></article>
      <article class="card"><div class="section-title"><h2>Token deductions</h2></div><canvas class="chart" id="c-ded"></canvas></article>
      <article class="card"><div class="section-title"><h2>Token credits</h2></div><canvas class="chart" id="c-cred"></canvas></article>
    </div>
    <article class="card" style="margin-top:0.85rem">
      <div class="section-title"><h2>Games by popularity</h2></div>
      <div class="table-wrap"><table><thead><tr><th>Game</th><th>Plays</th></tr></thead>
      <tbody>${data.analytics.popularity.map((p) => `<tr><td>${escapeHtml(p.name)}</td><td>${fmt(p.plays)}</td></tr>`).join("")}</tbody></table></div>
    </article>
    <article class="card" style="margin-top:0.85rem">
      <div class="section-title"><h2>8 Ball Billiards activity</h2></div>
      <p class="muted">${fmt(data.matches.filter((m) => m.gameId === "8ball").length)} matches · ${fmt(data.transactions.filter((t) => t.gameId === "8ball" && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0))} tokens deducted</p>
    </article>
  `);
  requestAnimationFrame(() => {
    const g = document.getElementById("c-games");
    if (!g) return;
    drawBars(g, lastN(data.analytics.dailyGames, days, "count"), "#b8ff3c");
    drawBars(document.getElementById("c-users"), lastN(data.analytics.dailyActiveUsers, days, "count"), "#5ce1e6");
    drawBars(document.getElementById("c-ded"), lastN(data.analytics.dailyDeductions, days, "amount"), "#ff6b6b");
    drawBars(document.getElementById("c-cred"), lastN(data.analytics.dailyCredits, days, "amount"), "#3ecf8e");
  });
}

function render() {
  if (!isAuthed()) {
    renderLogin();
    return;
  }
  if (loading || !data) {
    renderShell("Loading", skeleton());
    return;
  }
  const route = parseRoute();
  const map = {
    overview: renderOverview,
    users: renderUsers,
    user: () => renderUser(route.id),
    tokens: renderTokens,
    games: renderGames,
    "8ball": renderEightBall,
    transactions: renderTransactions,
    tx: () => renderTx(route.id),
    activity: renderActivity,
    analytics: renderAnalytics,
    match: () => renderMatch(route.id),
  };
  (map[route.name] || renderOverview)();
}

app.addEventListener("click", (e) => {
  const href = e.target.closest("[data-href]")?.dataset.href;
  if (href) {
    location.hash = href;
    return;
  }
  const pageBtn = e.target.closest("[data-page-key]");
  if (pageBtn) {
    tableState[pageBtn.dataset.pageKey].page = Number(pageBtn.dataset.page);
    render();
    return;
  }
  const range = e.target.closest("[data-range]")?.dataset.range;
  if (range) {
    rangeDays = Number(range);
    renderAnalytics();
  }
  const usort = e.target.closest("[data-usort]")?.dataset.usort;
  if (usort) {
    const st = tableState.users;
    st.dir = st.sort === usort ? -st.dir : 1;
    st.sort = usort;
    renderUsers();
  }
  const tsort = e.target.closest("[data-sort]")?.dataset.sort;
  if (tsort && parseRoute().name === "transactions") {
    const st = tableState.tx;
    st.dir = st.sort === tsort ? -st.dir : -1;
    st.sort = tsort;
    renderTransactions();
  }
});

window.addEventListener("hashchange", render);
window.addEventListener("storage", (e) => {
  if (e.key === LIVE_STORAGE_KEY && isAuthed()) loadData().then(render);
});
window.addEventListener("message", (e) => {
  if (e.data?.type === "neondock-demo" && isAuthed()) loadData().then(render);
});

if (isAuthed()) {
  await loadData();
  render();
} else {
  renderLogin();
}
setInterval(() => {
  if (!isAuthed()) return;
  loadData().then(() => {
    const name = parseRoute().name;
    if (!["overview", "8ball", "tokens", "transactions", "activity"].includes(name)) return;
    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
    render();
  });
}, 2500);
