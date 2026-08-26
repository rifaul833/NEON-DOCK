/**
 * GameBox integration for 8 Ball Billiards Classic.
 */
(function (global) {
  "use strict";

  global.GAMEBOX_CONFIG = { gameType: "BallPhysicGame" };

  const MODE_ONLINE = 3;

  function addOnlineButton(onClick) {
    const tryHook = () => {
      if (!global.game?.state?.states?.menu) {
        setTimeout(tryHook, 500);
        return;
      }
      if (document.getElementById("gamebox-online-btn")) return;

      const btn = document.createElement("button");
      btn.id = "gamebox-online-btn";
      btn.textContent = "Play Online (GameBox)";
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
    };
    tryHook();
  }

  global.GameBoxIntegration.register({
    mountOnlineButton: addOnlineButton,
    onOnlineMatchReady: async function (result) {
      global.projectInfo = global.projectInfo || {};
      global.projectInfo.mode = MODE_ONLINE;
      global.projectInfo.levelName = "gamebox_online";
      global.projectInfo.gamebox = {
        active: true,
        data: global.GameBox.getLaunchData(),
        opponent: result.opponent,
        sessionId: global.GameBox.getMatch()?.match_id,
        isBot: !!result.opponent?.isbot,
      };

      if (result.opponent?.isbot) {
        global.projectInfo.aiRating = Math.min(
          5,
          Math.max(1, Number(global.GameBox.getLaunchData()?.user_level || 1)),
        );
        global.projectInfo.mode = 1;
      }

      if (typeof global.initGame === "function") {
        global.initGame();
      } else if (global.game?.state) {
        global.projectInfo.lastBreaker = "none";
        global.game.state.start("play");
      }
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
