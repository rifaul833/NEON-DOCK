/**
 * Loads Nakama SDK then starts GameBox integration.
 */
(function () {
  "use strict";

  async function bootstrap() {
    try {
      const mod = await import(
        "https://cdn.jsdelivr.net/npm/@heroiclabs/nakama-js@2.8.0/+esm"
      );
      window.NakamaJs = mod;
    } catch (err) {
      console.warn(
        "[GameBox] Nakama SDK unavailable (online play disabled):",
        err.message,
      );
      window.NakamaJs = null;
    }

    if (window.GameBoxIntegration?.bootstrap) {
      await window.GameBoxIntegration.bootstrap();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
