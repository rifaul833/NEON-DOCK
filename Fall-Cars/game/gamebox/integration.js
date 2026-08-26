/**
 * GameBox integration for Fall Cars.
 */
(function (global) {
  "use strict";

  global.GAMEBOX_CONFIG = { gameType: "FallCars" };

  function addSplashOnlineButton(onClick) {
    const mount = () => {
      if (document.getElementById("gamebox-online-btn")) return;
      const splash = document.getElementById("splash");
      if (!splash) return;

      const btn = document.createElement("button");
      btn.id = "gamebox-online-btn";
      btn.type = "button";
      btn.textContent = "Play Online (GameBox)";
      btn.className = "btn btn-primary";
      btn.style.cssText =
        "width:100%;margin-top:10px;background:linear-gradient(135deg,#4aa3ff,#2d6cdf);";
      btn.onclick = async (e) => {
        e.stopPropagation();
        btn.disabled = true;
        try {
          await onClick();
        } catch (_) {
          btn.disabled = false;
        }
      };

      const playBtn = document.getElementById("btn-play");
      if (playBtn?.parentElement) {
        playBtn.parentElement.insertBefore(btn, playBtn.nextSibling);
      } else {
        splash.appendChild(btn);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount);
    } else {
      setTimeout(mount, 500);
    }
  }

  global.GameBoxIntegration.register({
    mountOnlineButton: addSplashOnlineButton,
    onOnlineMatchReady: async function () {
      if (typeof G !== "undefined") G.mode = "classic";
      if (typeof showOverlay === "function") showOverlay(null);
      if (typeof resetGame === "function") resetGame(false);
      if (typeof runCountdown === "function") await runCountdown();
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
