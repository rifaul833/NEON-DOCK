/**
 * GameBox integration for Arrowfall.
 */
(function (global) {
  "use strict";

  global.GAMEBOX_CONFIG = { gameType: "Arrowfall" };

  global.GameBoxIntegration.register({
    mountOnlineButton: function () {
      /* Lobby button is rendered by the React game when a GameBox session is active. */
    },
    onOnlineMatchReady: async function (result) {
      global.dispatchEvent(
        new CustomEvent("gamebox:match-ready", { detail: result || {} }),
      );
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
