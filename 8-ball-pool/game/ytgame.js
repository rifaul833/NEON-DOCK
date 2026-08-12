(function (global) {
  var ytgame = {
    SDK_VERSION: "neon-dock-stub",
    game: {
      firstFrameReady: function () {},
      gameReady: function () {},
      loadData: function () {
        return Promise.resolve(null);
      },
      saveData: function () {
        return Promise.resolve();
      },
    },
    ads: {
      AdResult: {
        UNKNOWN: "unknown",
        SHOWED: "showed",
        REJECTED: "rejected",
      },
      requestAd: function () {
        return Promise.resolve("rejected");
      },
    },
    engagement: {
      sendScore: function () {
        return Promise.resolve();
      },
    },
  };
  global.ytgame = ytgame;
})(window);
