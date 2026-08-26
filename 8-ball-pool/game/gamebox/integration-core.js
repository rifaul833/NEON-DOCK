/**
 * Shared GameBox integration helpers for NEON DOCK games.
 */
(function (global) {
  "use strict";

  let gameHooks = null;
  let matchmakingUi = null;

  function ensureOverlay() {
    if (matchmakingUi) return matchmakingUi;
    const el = document.createElement("div");
    el.id = "gamebox-overlay";
    el.style.cssText =
      "display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.75);color:#fff;font:16px/1.4 sans-serif;align-items:center;justify-content:center;text-align:center;padding:24px;";
    el.innerHTML =
      '<div><div id="gamebox-overlay-title" style="font-size:22px;margin-bottom:8px;">Connecting to GameBox</div><div id="gamebox-overlay-body">Please wait…</div></div>';
    document.body.appendChild(el);
    matchmakingUi = el;
    return el;
  }

  function showOverlay(title, body) {
    const el = ensureOverlay();
    el.style.display = "flex";
    el.querySelector("#gamebox-overlay-title").textContent = title;
    el.querySelector("#gamebox-overlay-body").textContent = body;
  }

  function hideOverlay() {
    if (matchmakingUi) matchmakingUi.style.display = "none";
  }

  function register(hooks) {
    gameHooks = hooks || {};
  }

  async function bootstrap() {
    if (!global.GameBox || !global.GameBoxCrypto) {
      console.warn("[GameBox] SDK not loaded");
      return false;
    }

    try {
      await global.GameBox.init({ allowGuest: true, autoRedirect: true });
    } catch (err) {
      console.error("[GameBox] init error", err);
      return false;
    }

    global.__gameboxSession = {
      active: global.GameBox.isOnlineSession(),
      data: global.GameBox.getLaunchData(),
      matchActive: false,
      opponent: null,
    };

    if (global.GameBox.isOnlineSession()) {
      console.log("[GameBox] Online session ready", global.GameBox.getLaunchData());
      if (typeof gameHooks?.mountOnlineButton === "function") {
        gameHooks.mountOnlineButton(startOnlineMatch);
      } else {
        mountDefaultOnlineButton(startOnlineMatch);
      }
    }
    return true;
  }

  function mountDefaultOnlineButton(onClick) {
    if (document.getElementById("gamebox-online-btn")) return;
    const btn = document.createElement("button");
    btn.id = "gamebox-online-btn";
    btn.textContent = gameHooks?.onlineButtonLabel || "Play Online (GameBox)";
    btn.style.cssText =
      "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:99999;padding:12px 18px;border:0;border-radius:999px;background:#4aa3ff;color:#001018;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);";
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await onClick();
      } catch (_) {
        btn.disabled = false;
      }
    };
    document.body.appendChild(btn);
  }

  async function startOnlineMatch() {
    if (!global.GameBox.isOnlineSession()) {
      throw new Error("No GameBox launch session");
    }

    showOverlay("Finding Opponent", "Connecting to Nakama matchmaking…");
    try {
      await global.GameBox.authenticate();
      const result = await global.GameBox.startMatchmaking();
      showOverlay("Match Found", "Joining game server…");
      try {
        await global.GameBox.connectMatchServer();
      } catch (err) {
        console.warn("[GameBox] Dedicated server unavailable, continuing locally:", err.message);
      }

      global.__gameboxSession = global.__gameboxSession || {};
      global.__gameboxSession.matchActive = true;
      global.__gameboxSession.opponent = result.opponent;
      global.__gameboxSession.sessionId = global.GameBox.getMatch()?.match_id;

      hideOverlay();

      if (typeof gameHooks?.onOnlineMatchReady === "function") {
        await gameHooks.onOnlineMatchReady(result);
      }
      return result;
    } catch (err) {
      showOverlay("Matchmaking Failed", err.message || "Please try again.");
      setTimeout(hideOverlay, 2500);
      throw err;
    }
  }

  async function submitGameResult({ isWinner, score, stats, reason }) {
    if (!global.GameBox?.isOnlineSession()) return null;
    if (!global.__gameboxSession?.matchActive && !global.GameBox.isOnlineMatchActive()) {
      return null;
    }

    try {
      return await global.GameBox.submitLocalMatchScore({
        isWinner: !!isWinner,
        score: Number(score) || 0,
        stats: {
          game_end_reason: reason || "completed",
          opponent_id: global.__gameboxSession?.opponent?.userId || null,
          ...(stats || {}),
        },
      });
    } catch (err) {
      console.error("[GameBox] score submission failed", err);
      return null;
    }
  }

  global.GameBoxIntegration = {
    register,
    bootstrap,
    startOnlineMatch,
    submitGameResult,
    showOverlay,
    hideOverlay,
  };
})(typeof window !== "undefined" ? window : globalThis);
