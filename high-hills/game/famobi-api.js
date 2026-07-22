/* Minimal Famobi API stub for offline / local NEON DOCK play */
(function (global) {
  function noop() {}
  function noopPromise(result) {
    return Promise.resolve(result);
  }

  var transparentGif =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  // Phaser does many getImageData readbacks — prefer the optimized path.
  try {
    var originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      if (type === "2d") {
        attrs = Object.assign({}, attrs || {}, { willReadFrequently: true });
      }
      return originalGetContext.call(this, type, attrs);
    };
  } catch (e) {
    /* ignore */
  }

  var storage = global.localStorage;
  var famobiStorage = {
    getItem: function (key) {
      try {
        return storage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem: function (key, value) {
      try {
        storage.setItem(key, value);
      } catch (e) {
        /* ignore */
      }
    },
    removeItem: function (key) {
      try {
        storage.removeItem(key);
      } catch (e) {
        /* ignore */
      }
    },
  };

  var famobi = {
    config: {},
    com: {},
    localStorage: famobiStorage,
    moreGamesLink: "#",
    getMoreGamesButtonImage: function () {
      return transparentGif;
    },
    hasFeature: function () {
      return false;
    },
    hasRewardedAd: function () {
      return false;
    },
    rewardedAd: function (cb) {
      if (typeof cb === "function") {
        try {
          cb();
        } catch (e) {
          /* ignore */
        }
      }
      return noopPromise(false);
    },
    showAd: function (cb) {
      if (typeof cb === "function") {
        try {
          cb();
        } catch (e) {
          /* ignore */
        }
      }
      return noopPromise();
    },
    gameReady: noop,
    playerReady: noop,
    onOrientationChange: function (cb) {
      if (typeof cb === "function") {
        global.addEventListener("resize", function () {
          cb(global.innerWidth > global.innerHeight ? "landscape" : "portrait");
        });
      }
    },
    __: function (key) {
      return key;
    },
  };

  global.famobi = famobi;
  global.fg_api = function () {};

  // Must include trackScreen / trackEvent + SCREEN_* / EVENT_* constants.
  global.famobi_analytics = {
    SCREEN_HOME: "SCREEN_HOME",
    SCREEN_LEVELLOADING: "SCREEN_LEVELLOADING",
    SCREEN_PAUSE: "SCREEN_PAUSE",
    SCREEN_SETTINGS: "SCREEN_SETTINGS",
    SCREEN_SHOP: "SCREEN_SHOP",
    SCREEN_GAMERESULT: "SCREEN_GAMERESULT",
    EVENT_LEVELSTART: "EVENT_LEVELSTART",
    EVENT_LEVELFAIL: "EVENT_LEVELFAIL",
    EVENT_LEVELRESTART: "EVENT_LEVELRESTART",
    EVENT_TOTALSCORE: "EVENT_TOTALSCORE",
    EVENT_VOLUMECHANGE: "EVENT_VOLUMECHANGE",
    trackScreen: function () {
      return noopPromise();
    },
    trackEvent: function () {
      return noopPromise();
    },
    trackStats: function () {
      return noopPromise();
    },
    trackAction: function () {
      return noopPromise();
    },
  };

  global.famobi_onPauseRequested = noop;
  global.famobi_onResumeRequested = noop;
})(window);
