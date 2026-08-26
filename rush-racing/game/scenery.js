/* Side-gutter forest (left) and sea (right) themes for Rush Racing */
(function () {
  var CACHE = "?v=5";
  var THEME_INTERVAL = 15;

  var THEMES = [
    { name: "Sunny Coast", forest: "forest-0.jpg", sea: "sea-0.jpg", bg: "#4a7a9a" },
    { name: "Deep Forest", forest: "forest-1.jpg", sea: "sea-0.jpg", bg: "#3d5f4a" },
    { name: "Autumn Drive", forest: "forest-2.jpg", sea: "sea-1.jpg", bg: "#6a5a3a" },
    { name: "Winter Shore", forest: "forest-3.jpg", sea: "sea-1.jpg", bg: "#4a6078" },
  ];

  var left, right, label;
  var theme = 0;
  var elapsed = 0;
  var parallax = 0;
  var lastTs = 0;
  var labelTimer = null;
  var started = false;
  var racing = false;

  function asset(file) {
    return "assets/scenery/" + file + CACHE;
  }

  function gutterWidth() {
    return window.RushGutterWidth ? window.RushGutterWidth() : 140;
  }

  function layout() {
    var w = gutterWidth() + "px";
    if (left) left.style.width = w;
    if (right) right.style.width = w;
  }

  function preload() {
    THEMES.forEach(function (t) {
      ["forest", "sea"].forEach(function (key) {
        var img = new Image();
        img.src = asset(t[key]);
      });
    });
  }

  function showLabel(text) {
    if (!label) return;
    label.textContent = text;
    label.classList.add("visible");
    clearTimeout(labelTimer);
    labelTimer = setTimeout(function () {
      label.classList.remove("visible");
    }, 2000);
  }

  function applyTheme(index, announce) {
    index = ((index % THEMES.length) + THEMES.length) % THEMES.length;
    var t = THEMES[index];
    theme = index;

    if (left) {
      left.style.backgroundImage = 'url("' + asset(t.forest) + '")';
      left.style.backgroundColor = t.bg;
    }
    if (right) {
      right.style.backgroundImage = 'url("' + asset(t.sea) + '")';
      right.style.backgroundColor = t.bg;
    }
    document.body.style.backgroundColor = t.bg;

    if (announce) showLabel(t.name);
  }

  function onFrame(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    if (racing) {
      elapsed += dt;
      parallax += dt * 100;
      var offset = Math.round(parallax % 540);
      var pos = "center " + (-offset) + "px";
      if (left) left.style.backgroundPosition = pos;
      if (right) right.style.backgroundPosition = pos;

      if (elapsed >= THEME_INTERVAL) {
        elapsed = 0;
        applyTheme(theme + 1, true);
      }
    }

    requestAnimationFrame(onFrame);
  }

  function setRacing(on) {
    racing = !!on;
    if (!on) elapsed = 0;
  }

  function hookTracking() {
    var tracking = window.famobi_tracking;
    if (!tracking || tracking.__rushHooked) return;
    tracking.__rushHooked = true;
    var track = tracking.trackEvent;
    if (typeof track !== "function") track = function () {};
    tracking.trackEvent = function (event) {
      if (event === "LEVEL_START") {
        setRacing(true);
        applyTheme(0, false);
      } else if (event === "LEVEL_END") {
        setRacing(false);
      }
      return track.apply(this, arguments);
    };
  }

  function bindInput() {
    var canvas = document.getElementById("cnv");
    if (!canvas) return;
    canvas.addEventListener("pointerdown", function () { setRacing(true); }, { passive: true });
    window.addEventListener("keydown", function (e) {
      if (e.code === "Space" || e.code.indexOf("Arrow") === 0) setRacing(true);
    });
  }

  function hookCanvasResize() {
    var orig = window.eso_upd_cnv;
    if (!orig || orig.__rushHooked) return;
    window.eso_upd_cnv = function () {
      orig();
      layout();
    };
    window.eso_upd_cnv.__rushHooked = true;
    window.addEventListener("resize", function () {
      if (window.eso_upd_cnv) window.eso_upd_cnv();
    });
  }

  function init() {
    if (started) return;
    started = true;

    left = document.getElementById("scenery-left");
    right = document.getElementById("scenery-right");
    label = document.getElementById("scenery-label");
    if (!left || !right) return;

    preload();
    layout();
    applyTheme(0, false);
    hookCanvasResize();
    hookTracking();
    bindInput();
    requestAnimationFrame(onFrame);
  }

  window.RushScenery = { init: init, layout: layout, setRacing: setRacing };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
