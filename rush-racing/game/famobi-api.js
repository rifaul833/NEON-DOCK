/* Minimal Famobi API stub for offline / local NEON DOCK play (Speed Master WASM) */
(function (global) {
  function noop() {}
  function noopPromise(result) {
    return Promise.resolve(result);
  }

  var transparentGif =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

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

  global.famobi = {
    config: {},
    com: {},
    localStorage: famobiStorage,
    moreGamesLink: "#",
    log: function (msg) {
      if (global.console && console.log) console.log(msg);
    },
    getBrandingButtonImage: function () {
      return "tex/famobi_branding_button.png";
    },
    getCurrentLanguage: function () {
      return "en";
    },
    getOffsets: function () {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    },
    getVolume: function () {
      return 1;
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
    showInterstitialAd: function (cb) {
      if (typeof cb === "function") {
        try {
          cb();
        } catch (e) {
          /* ignore */
        }
      }
      return noopPromise();
    },
    openBrandingLink: noop,
    onRequest: function (event, cb) {
      if (typeof cb === "function") {
        try {
          cb();
        } catch (e) {
          /* ignore */
        }
      }
    },
    setPreloadProgress: noop,
    gameReady: noop,
    playerReady: noop,
    __: function (key) {
      return key;
    },
  };

  global.famobi_analytics = {
    trackEvent: function () {
      return noopPromise();
    },
    trackScreen: function () {
      return noopPromise();
    },
  };

  global.famobi_tracking = {
    EVENTS: {},
    init: noop,
    trackEvent: noop,
  };

  global.famobi_onPauseRequested = noop;
  global.famobi_onResumeRequested = noop;
  global.fg_api = function () {};
})(window);
