/**
 * GameBox integration for Drift King.
 */
(function (global) {
  "use strict";

  global.GAMEBOX_CONFIG = { gameType: "DriftKing" };

  function addLobbyOnlineButton(onClick) {
    const mount = () => {
      const lobby = document.getElementById("lobbyScreen");
      if (!lobby || document.getElementById("gamebox-online-btn")) return;

      const btn = document.createElement("button");
      btn.id = "gamebox-online-btn";
      btn.type = "button";
      btn.textContent = "Play Online (GameBox)";
      btn.className = "menu-btn";
      btn.style.cssText =
        "margin-top:12px;background:linear-gradient(135deg,#4aa3ff,#2d6cdf);border:none;color:#fff;font-weight:700;";
      btn.onclick = async (e) => {
        e.stopPropagation();
        btn.disabled = true;
        try {
          await onClick();
        } catch (_) {
          btn.disabled = false;
        }
      };

      const playBtn = document.getElementById("lobbyPlayBtn");
      if (playBtn?.parentElement) {
        playBtn.parentElement.insertBefore(btn, playBtn.nextSibling);
      } else {
        lobby.appendChild(btn);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount);
    } else {
      mount();
    }
  }

  global.GameBoxIntegration.register({
    onlineButtonLabel: "Play Online (GameBox)",
    mountOnlineButton: addLobbyOnlineButton,
    onOnlineMatchReady: async function () {
      if (typeof hideLobby === "function") {
        hideLobby(function () {
          if (typeof levelMode !== "undefined") levelMode = false;
          if (typeof carMesh !== "undefined" && carMesh) {
            carMesh.getChildMeshes().forEach(function (m) {
              m.isVisible = false;
            });
          }
          if (typeof lobbyPedestalMesh !== "undefined" && lobbyPedestalMesh) {
            lobbyPedestalMesh.isVisible = false;
          }
          if (typeof lobbyRotating !== "undefined") lobbyRotating = false;
          if (typeof resetGame === "function") resetGame();
          if (typeof gameState !== "undefined") gameState = "playing";
          if (typeof lastTime !== "undefined") lastTime = performance.now() / 1000;
          if (typeof startGameMusic === "function") startGameMusic();
        });
      }
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
