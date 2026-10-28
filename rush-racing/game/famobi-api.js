/* Minimal Famobi API stub for offline / local NEON DOCK play (Speed Master WASM) */
(function (global) {
  function noop() {}
  function noopPromise(result) {
    return Promise.resolve(result);
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

  global.RushGutterWidth = function () {
    var w = global.innerWidth || 1280;
    if (w < 640) return Math.round(Math.max(56, w * 0.09));
    return Math.round(Math.min(300, Math.max(110, w * 0.15)));
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
      var side = global.RushGutterWidth();
      return { top: 0, right: side, bottom: 0, left: side };
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
          cb({ rewardGranted: true });
        } catch (e) {
          /* ignore */
        }
      }
      return noopPromise({ rewardGranted: true });
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
    _requests: {},
    onRequest: function (event, cb) {
      if (typeof event === "string" && typeof cb === "function") {
        this._requests[event] = cb;
      }
    },
    setPreloadProgress: noop,
    gameReady: noop,
    playerReady: noop,
    __: function (key) {
      return key;
    },
  };

  function tapCanvas(nx, ny) {
    var canvas = global.document && global.document.getElementById("cnv");
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var x = rect.left + rect.width * nx;
    var y = rect.top + rect.height * ny;
    ["mousedown", "mouseup"].forEach(function (type) {
      canvas.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          button: 0,
          view: global,
        }),
      );
    });
  }

  global.RushDismissOffer = function () {
    tapCanvas(0.64, 0.19);
    tapCanvas(0.67, 0.22);
    tapCanvas(0.5, 0.73);
    try {
      if (global.famobi._requests.resumeGameplay) global.famobi._requests.resumeGameplay();
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof global.famobi_onResumeRequested === "function") global.famobi_onResumeRequested();
    } catch (e) {
      /* ignore */
    }
  };

  global.famobi_analytics = {
    trackEvent: function (name) {
      if (name === "EVENT_PAUSE") {
        global.setTimeout(global.RushDismissOffer, 40);
        global.setTimeout(global.RushDismissOffer, 180);
      }
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
