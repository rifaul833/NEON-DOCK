/**
 * GameBox Multiplayer SDK v1.2
 * Launch decrypt, Nakama auth/matchmaking, encrypted score submission.
 */
(function (global) {
  "use strict";

  const DEFAULT_NAKAMA_SERVER_KEY = "testkey";

  const state = {
    ready: false,
    launch: null,
    gameData: null,
    session: null,
    socket: null,
    client: null,
    matchTicket: null,
    match: null,
    matchSocket: null,
    sessionId: null,
    opponent: null,
    error: null,
    onlineActive: false,
  };

  function getGameType() {
    return (
      global.GAMEBOX_CONFIG?.gameType ||
      global.GameBox?._gameType ||
      "BallPhysicGame"
    );
  }

  function log(...args) {
    console.log("[GameBox]", ...args);
  }

  function warn(...args) {
    console.warn("[GameBox]", ...args);
  }

  function getQueryParam(name) {
    return new URLSearchParams(global.location.search).get(name);
  }

  function getDeviceId() {
    const key = "gamebox_device_id";
    let id = null;
    try {
      id = localStorage.getItem(key);
    } catch (_) {
      /* ignore */
    }
    if (!id) {
      id = "webgl_" + crypto.randomUUID();
      try {
        localStorage.setItem(key, id);
      } catch (_) {
        /* ignore */
      }
    }
    return id;
  }

  function normalizeGameData(raw) {
    if (!raw) return null;
    return {
      ...raw,
      nakamaURL: raw.nakamaURL || raw.nakamaURl || "",
      matchmakingUrl: raw.matchmakingUrl || "",
    };
  }

  function parseNakamaHost(nakamaURL) {
    const url = new URL(nakamaURL);
    const useSSL = url.protocol === "https:";
    const host = url.hostname;
    const port = url.port ? Number(url.port) : useSSL ? 443 : 7350;
    const serverKey =
      global.GAMEBOX_CONFIG?.nakamaServerKey || DEFAULT_NAKAMA_SERVER_KEY;
    return { host, port, useSSL, serverKey };
  }

  function parseMatchmakingWsBase(matchmakingUrl) {
    const url = new URL(matchmakingUrl);
    const scheme = url.protocol === "https:" ? "wss" : "ws";
    return `${scheme}://${url.host}`;
  }

  async function readLaunchFromUrl(options) {
    const encryptedString = getQueryParam("encryptedString");
    const launchKey =
      options.launchDecryptionKey || global.GameBoxCrypto.DEFAULT_LAUNCH_KEY;

    if (!encryptedString) {
      if (options.allowGuest) {
        return { success: true, guest: true, gameData: null };
      }
      throw new Error("encryptedString query parameter is missing");
    }

    const launch = await global.GameBoxCrypto.decryptToken(
      encryptedString,
      launchKey,
    );
    if (!launch || !launch.gameData) {
      throw new Error("Launch payload missing gameData");
    }
    launch.gameData = normalizeGameData(launch.gameData);
    return launch;
  }

  async function init(options = {}) {
    if (state.ready) return state.launch;

    const opts = {
      allowGuest: true,
      autoRedirect: true,
      launchDecryptionKey: global.GameBoxCrypto.DEFAULT_LAUNCH_KEY,
      nakamaServerKey: DEFAULT_NAKAMA_SERVER_KEY,
      ...options,
    };

    try {
      state.launch = await readLaunchFromUrl(opts);
      state.gameData = state.launch.gameData;

      if (state.gameData && state.gameData.canPlay === false && opts.autoRedirect) {
        const redirect = state.gameData.redirectUrl;
        if (redirect) {
          log("canPlay=false, redirecting to", redirect);
          global.location.href = redirect;
          return state.launch;
        }
      }

      state.ready = true;
      log("Launch ready", state.gameData || "(guest mode)");
      return state.launch;
    } catch (err) {
      state.error = err;
      warn("Launch init failed:", err.message);
      if (opts.allowGuest) {
        state.launch = { success: true, guest: true, gameData: null };
        state.ready = true;
        return state.launch;
      }
      throw err;
    }
  }

  function isOnlineSession() {
    return !!(state.gameData && state.gameData.userId && !state.launch?.guest);
  }

  function isOnlineMatchActive() {
    return state.onlineActive;
  }

  async function ensureNakamaClient() {
    if (!global.NakamaJs || !global.NakamaJs.Client) {
      throw new Error(
        "Nakama SDK not loaded. Check your internet connection and reload the game.",
      );
    }
    if (!state.gameData?.nakamaURL) {
      throw new Error("nakamaURL missing from launch data");
    }
    if (state.client) return state.client;

    const { Client } = global.NakamaJs;
    const { host, port, useSSL, serverKey } = parseNakamaHost(state.gameData.nakamaURL);
    state.client = new Client(serverKey, host, port, useSSL);
    return state.client;
  }

  async function authenticate() {
    const client = await ensureNakamaClient();

    if (state.session) return state.session;

    if (state.gameData?.userId) {
      const username =
        state.gameData.userName ||
        "Player_" + String(state.gameData.userId).slice(0, 8);
      state.session = await client.authenticateCustom(
        state.gameData.userId,
        true,
        username,
      );
      log("Authenticated via custom ID", state.session.user_id);
      return state.session;
    }

    const deviceId = getDeviceId();
    state.session = await client.authenticateDevice(deviceId, true);
    log("Authenticated via device ID", state.session.user_id);
    return state.session;
  }

  async function connectSocket() {
    if (state.socket) return state.socket;
    const client = await ensureNakamaClient();
    const session = await authenticate();
    state.socket = client.createSocket(true);
    await state.socket.connect(session, true);
    log("Nakama socket connected");
    return state.socket;
  }

  function buildMatchmakingQuery(gameData) {
    const gameType = getGameType();
    const skill = gameData.user_skill || "e";
    const level = Number(gameData.user_level || 1);
    const minLevel = Math.max(1, level - 5);
    const maxLevel = level + 5;
    return `+properties.gameType:${gameType} +properties.userSkill:${skill} +properties.userLevel:>=${minLevel} +properties.userLevel:<=${maxLevel}`;
  }

  async function startMatchmaking() {
    const socket = await connectSocket();
    const gameData = state.gameData || {};
    const gameType = getGameType();

    const query = buildMatchmakingQuery(gameData);
    const ticket = await socket.addMatchmaker(
      query,
      2,
      2,
      {
        gameType,
        userSkill: String(gameData.user_skill || "e"),
      },
      { userLevel: Number(gameData.user_level || 1) },
    );

    state.matchTicket = ticket.ticket;
    log("Matchmaking ticket", state.matchTicket);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Matchmaking timed out after 30 seconds"));
      }, 30000);

      socket.onmatchmakermatched = async (matched) => {
        clearTimeout(timeout);
        try {
          state.match = matched;
          const match = await socket.joinMatch(matched.token);
          state.sessionId = matched.match_id;
          state.opponent = pickOpponent(matched, state.session.user_id);
          state.onlineActive = true;
          log("Match found", matched.match_id, state.opponent);
          resolve({ matched, match, opponent: state.opponent });
        } catch (err) {
          reject(err);
        }
      };
    });
  }

  function pickOpponent(matched, selfUserId) {
    const users = matched.users || [];
    for (const entry of users) {
      const uid = entry.presence?.user_id;
      if (uid && uid !== selfUserId) {
        return {
          userId: uid,
          username: entry.presence?.username || "Opponent",
          isbot: entry.string_properties?.isbot === "true",
          properties: entry,
        };
      }
    }
    return null;
  }

  async function cancelMatchmaking() {
    if (!state.socket || !state.matchTicket) return;
    try {
      await state.socket.removeMatchmaker(state.matchTicket);
    } catch (err) {
      warn("cancelMatchmaking:", err.message);
    }
    state.matchTicket = null;
  }

  async function connectMatchServer() {
    if (!state.match?.match_id || !state.gameData?.matchmakingUrl) {
      throw new Error("No active match to connect");
    }
    const wsBase = parseMatchmakingWsBase(state.gameData.matchmakingUrl);
    const url = `${wsBase}/match/${state.match.match_id}`;
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("Match server connection timed out"));
      }, 15000);

      ws.onopen = () => {
        clearTimeout(timer);
        state.matchSocket = ws;
        log("Connected to match server", url);
        resolve(ws);
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Match server connection failed"));
      };
      ws.onmessage = (event) => {
        handleMatchMessage(event.data);
      };
      ws.onclose = () => {
        state.matchSocket = null;
      };
    });
  }

  function handleMatchMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (_) {
      return;
    }
    if (msg.message_type === "MatchEndNotification") {
      global.dispatchEvent(
        new CustomEvent("gamebox:match-end", { detail: msg }),
      );
      submitMatchScoreFromNotification(msg).catch((err) =>
        warn("Score submit failed:", err.message),
      );
    }
  }

  function sendMatchInput(messageType, parameters) {
    if (!state.matchSocket || state.matchSocket.readyState !== WebSocket.OPEN) {
      throw new Error("Match socket is not connected");
    }
    const payload = {
      message_type: messageType,
      player_id: state.gameData?.userId || state.session?.user_id,
      parameters,
    };
    state.matchSocket.send(JSON.stringify(payload));
  }

  async function submitScore(scorePayload) {
    const gameData = state.gameData;
    if (!gameData?.gameScoreAPIUrl || !gameData?.scoreEncryptionKey) {
      throw new Error("Score API URL or encryption key missing from launch data");
    }

    const required = ["userId", "gameId", "session_id"];
    for (const field of required) {
      if (scorePayload[field] === undefined || scorePayload[field] === null) {
        throw new Error(`Score payload missing required field: ${field}`);
      }
    }

    const encryptedString = await global.GameBoxCrypto.encryptToken(
      scorePayload,
      gameData.scoreEncryptionKey,
    );

    const response = await fetch(gameData.gameScoreAPIUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encryptedString }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || `Score submit failed (${response.status})`);
    }
    log("Score submitted", body);
    return body;
  }

  async function submitMatchScoreFromNotification(notification) {
    const gameData = state.gameData || {};
    const winnerId = notification.winner_user_id;
    const selfId = gameData.userId || state.session?.user_id;
    const isWinner = winnerId === selfId;
    const finalScores = notification.final_scores || {};
    const scoreValues = Object.values(finalScores).filter((v) => typeof v === "number");
    const score = scoreValues.length ? Math.max(...scoreValues) : isWinner ? 1 : 0;

    return submitScore({
      userId: String(gameData.userId || selfId),
      gameId: String(gameData.gameId || ""),
      session_id: String(state.sessionId || state.match?.match_id || ""),
      is_winner: isWinner,
      score,
      stats: {
        game_end_reason: notification.game_end_reason || "completed",
        final_scores: finalScores,
        match_summary: notification.match_summary || {},
      },
    });
  }

  async function submitLocalMatchScore({ isWinner, score, stats = {} }) {
    const gameData = state.gameData || {};
    return submitScore({
      userId: String(gameData.userId || state.session?.user_id || ""),
      gameId: String(gameData.gameId || ""),
      session_id: String(
        state.sessionId || "local_session_" + crypto.randomUUID(),
      ),
      is_winner: !!isWinner,
      score: Number(score) || 0,
      stats,
    });
  }

  global.GameBox = {
    getGameType,
    init,
    isOnlineSession,
    isOnlineMatchActive,
    authenticate,
    connectSocket,
    startMatchmaking,
    cancelMatchmaking,
    connectMatchServer,
    sendMatchInput,
    submitScore,
    submitLocalMatchScore,
    submitMatchScoreFromNotification,
    getLaunchData: () => state.gameData,
    getState: () => ({ ...state }),
    getSession: () => state.session,
    getMatch: () => state.match,
    getOpponent: () => state.opponent,
  };
})(typeof window !== "undefined" ? window : globalThis);
