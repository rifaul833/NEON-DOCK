(function (global) {
  var audioEnabled = true;
  var audioChangeHandler = null;

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
    system: {
      isAudioEnabled: function () {
        return audioEnabled;
      },
      onAudioEnabledChange: function (handler) {
        audioChangeHandler = handler;
      },
      onPause: function () {},
      onResume: function () {},
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
