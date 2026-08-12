// ===== UI SYSTEM - Screen transitions, HUD, Combo, Animations =====
// Depends on: audio.js, cars.js, game.js globals

// --- Combo ---
let comboCount = 0;
let comboMultiplier = 1;

function resetCombo() {
    comboCount = 0;
    comboMultiplier = 1;
    const el = document.getElementById("comboDisplay");
    if (el) el.classList.add("hidden");
}

function incrementCombo() {
    comboCount++;
    comboMultiplier = Math.min(10, Math.floor(comboCount / 5) + 1);
    if (comboMultiplier <= 1) return;

    const el = document.getElementById("comboDisplay");
    const val = el.querySelector(".combo-value");
    if (!el || !val) return;

    el.classList.remove("hidden");
    val.textContent = "x" + comboMultiplier;

    // Pop animation
    gsap.fromTo(val, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });

    // Color class
    val.className = "combo-value";
    if (comboMultiplier >= 8) {
        val.classList.add("combo-red", "combo-max");
    } else if (comboMultiplier >= 5) {
        val.classList.add("combo-orange");
    } else if (comboMultiplier >= 3) {
        val.classList.add("combo-yellow");
    }
}

function getComboMultiplier() {
    return comboMultiplier;
}

// --- HUD ---
function showHUD() {
    const hud = document.getElementById("hud");
    hud.classList.remove("hidden");
    gsap.fromTo(".coin-display", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.4)" });
    gsap.fromTo(".score-display", { y: -30, opacity: 0 }, { y: 0, opacity: 0.9, duration: 0.5, ease: "back.out(1.4)", delay: 0.1 });
    gsap.fromTo(".pause-btn", { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.4)", delay: 0.15 });
}

function hideHUD(callback) {
    const hud = document.getElementById("hud");
    gsap.to(hud, {
        opacity: 0, duration: 0.3,
        onComplete: () => { hud.classList.add("hidden"); hud.style.opacity = ""; if (callback) callback(); }
    });
}

// --- Pause Screen ---
function showPauseScreen() {
    gameState = "paused";
    const ps = document.getElementById("pauseScreen");
    ps.classList.remove("hidden");
    ps.style.opacity = "0";
    gsap.to(ps, { opacity: 1, duration: 0.3 });
    gsap.fromTo(".pause-title", { y: -30, scale: 0.8, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", delay: 0.1 });
    gsap.fromTo(".resume-btn", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.4)", delay: 0.2 });
    gsap.fromTo(".restart-btn", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.4)", delay: 0.3 });
}

function hidePauseScreen(callback) {
    const ps = document.getElementById("pauseScreen");
    gsap.to(ps, { opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => { ps.classList.add("hidden"); if (callback) callback(); } });
}

// --- Game Over Screen ---
function showGameOverScreen(finalScore, finalCoins, isNewHigh) {
    const go = document.getElementById("gameOverScreen");
    go.classList.remove("hidden");
    go.style.opacity = "0";
    document.querySelector(".final-score-value").textContent = finalScore;
    document.querySelector(".final-coin-count").textContent = finalCoins;

    // Show replay button only in level mode, change lobby text
    var replayBtn = document.getElementById("goReplayBtn");
    if (replayBtn) replayBtn.style.display = levelMode ? "" : "none";
    var lobbyBtn = document.getElementById("playAgainBtn");
    if (lobbyBtn) lobbyBtn.querySelector("span").textContent = levelMode ? T("levels") : T("lobby");

    const goHighEl = document.getElementById("goHighScore");
    if (goHighEl) goHighEl.textContent = loadHighScore();

    gsap.to(go, { opacity: 1, duration: 0.5 });

    // "GAME" slams down
    gsap.fromTo(".go-line-game",
        { y: -120, opacity: 0, scale: 2.5 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, delay: 0.1, ease: "back.out(1.2)" }
    );

    // "OVER" smashes up
    gsap.fromTo(".go-line-over",
        { y: 120, opacity: 0, scale: 2.5 },
        {
            y: 0, opacity: 1, scale: 1, duration: 0.5, delay: 0.25, ease: "back.out(1.2)",
            onComplete: () => {
                spawnDeathParticles();
                gsap.fromTo(".gameover-title", { scale: 1.06 }, { scale: 1, duration: 0.2, ease: "power2.out" });
            }
        }
    );

    // Card slides up
    gsap.fromTo(".go-card", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.4)", delay: 0.65 });

    // Score count-up
    const scoreEl = document.querySelector(".final-score-value");
    gsap.from(scoreEl, { textContent: 0, duration: 1.2, delay: 0.85, snap: { textContent: 1 }, ease: "power2.out" });

    // NEW HIGH SCORE
    if (isNewHigh && finalScore > 0) {
        setTimeout(() => {
            playNewHighScoreSound();
            const badge = document.getElementById("newHighBadge");
            if (badge) {
                badge.classList.remove("hidden");
                gsap.fromTo(badge, { scale: 0, rotation: -15, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: "elastic.out(1, 0.3)" });
                gsap.to(badge, { rotation: 2, duration: 0.4, yoyo: true, repeat: 5, ease: "sine.inOut", delay: 0.7 });
            }
        }, 1300);
    } else {
        const badge = document.getElementById("newHighBadge");
        if (badge) badge.classList.add("hidden");
    }

    // Buttons bounce in
    gsap.fromTo("#goReplayBtn", { y: 50, opacity: 0, scale: 0.5 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", delay: 1.2 });
    gsap.fromTo("#playAgainBtn", { y: 50, opacity: 0, scale: 0.5 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", delay: 1.35 });
}

function hideGameOverScreen(callback) {
    gsap.killTweensOf("#playAgainBtn");
    gsap.killTweensOf("#goReplayBtn");
    const go = document.getElementById("gameOverScreen");
    gsap.to(go, { opacity: 0, duration: 0.3, ease: "power2.in", onComplete: () => { go.classList.add("hidden"); if (callback) callback(); } });
}

function spawnDeathParticles() {
    const container = document.getElementById("gameOverScreen");
    if (!container) return;
    const colors = ["#ff6b6b", "#ff8e8e", "#ffbe0b", "#ff4757", "#ffa502", "#fff"];
    for (let i = 0; i < 18; i++) {
        const p = document.createElement("div");
        p.className = "death-particle";
        const size = 5 + Math.random() * 12;
        const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 120 + Math.random() * 250;
        p.style.cssText = "width:" + size + "px;height:" + size + "px;background:" + colors[i % colors.length] + ";border-radius:50%";
        container.appendChild(p);

        gsap.fromTo(p,
            { x: 0, y: 0, opacity: 1, scale: 1.5 },
            {
                x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0,
                duration: 0.8 + Math.random() * 0.5,
                delay: Math.random() * 0.15, ease: "power2.out",
                onComplete: () => p.remove(),
            }
        );
    }
}

// --- Floating Text ---
function showFloatingText(text, color) {
    const el = document.createElement("div");
    el.className = "floating-text";
    el.textContent = text;
    el.style.color = color || "#fff";
    document.body.appendChild(el);

    gsap.fromTo(el,
        { y: 0, opacity: 1, scale: 0.5 },
        { y: -80, opacity: 0, scale: 1.3, duration: 1.0, ease: "power2.out", onComplete: () => el.remove() }
    );
}

// --- Level Complete Screen ---
function showLevelCompleteScreen(config, stars, coinsEarned, coinsCollected, coinsTotal) {
    var lc = document.getElementById("levelCompleteScreen");
    lc.classList.remove("hidden");
    lc.style.opacity = "0";

    // Set info
    document.getElementById("lcInfo").textContent = config.worldName + " — " + T("level_x") + " " + config.levelInWorld;
    document.getElementById("lcCoinsText").textContent = coinsCollected + " / " + coinsTotal;

    // Hide next button if at level 100
    var nextBtn = document.getElementById("lcNextBtn");
    if (config.levelNum >= WORLDS.length) {
        nextBtn.classList.add("hidden");
    } else {
        nextBtn.classList.remove("hidden");
    }

    gsap.to(lc, { opacity: 1, duration: 0.5 });

    // === FIREWORKS === Single wave only
    spawnLevelFireworks(lc, 0);
    if (stars >= 3) {
        setTimeout(function() { spawnLevelFireworks(lc, 1); }, 600);
    }

    // === CONFETTI RAIN ===
    spawnLevelConfetti(lc);

    // Title animation
    gsap.fromTo(".lc-title",
        { y: -60, opacity: 0, scale: 1.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)", delay: 0.1 }
    );

    // Stars one by one
    var starEls = document.querySelectorAll(".lc-star");
    starEls.forEach(function(s, i) {
        s.classList.remove("earned");
        s.querySelector("path").setAttribute("fill", "#555");
        gsap.set(s, { scale: 0, opacity: 0 });

        var earned = i < stars;
        gsap.to(s, {
            scale: 1, opacity: 1,
            duration: 0.5, ease: "back.out(1.7)",
            delay: 0.4 + i * 0.2,
            onComplete: function() {
                if (earned) {
                    s.classList.add("earned");
                    s.querySelector("path").setAttribute("fill", "#ffd54f");
                    playStarEarnedSound();
                    gsap.fromTo(s, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "back.out(1.4)" });
                    spawnStarSparkles(s);
                }
            }
        });
    });

    // Info + coins fade up
    gsap.fromTo(".lc-info", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 1.0 });
    gsap.fromTo(".lc-coin-stats", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 1.2 });

    // Buttons slide in
    gsap.fromTo("#lcNextBtn", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.4)", delay: 1.4 });
    gsap.fromTo("#lcReplayBtn", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.4)", delay: 1.5 });
    gsap.fromTo("#lcLevelsBtn", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.4)", delay: 1.6 });

    // Next button breathing
    gsap.to("#lcNextBtn", { scale: 1.05, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.0 });
}

// Fireworks — burst of particles from a random point
function spawnLevelFireworks(container, wave) {
    var colors = [
        ["#ff6b6b", "#ff8e8e", "#ffcc00"],
        ["#4ecca3", "#45b7d1", "#a8e6cf"],
        ["#ffd54f", "#ffab40", "#ff6d00"],
        ["#e040fb", "#7c4dff", "#448aff"],
        ["#ff4081", "#f50057", "#ff80ab"],
        ["#69f0ae", "#00e676", "#b9f6ca"]
    ];
    var palette = colors[wave % colors.length];
    // Random origin
    var ox = 15 + Math.random() * 70; // % from left
    var oy = 10 + Math.random() * 40; // % from top
    var count = 12 + Math.floor(Math.random() * 6);

    for (var i = 0; i < count; i++) {
        var p = document.createElement("div");
        p.className = "lc-firework-particle";
        var size = 3 + Math.random() * 5;
        var color = palette[Math.floor(Math.random() * palette.length)];
        p.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;border-radius:50%;background:" + color + ";left:" + ox + "%;top:" + oy + "%;pointer-events:none;z-index:0;";
        container.appendChild(p);

        var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        var dist = 60 + Math.random() * 180;
        var dur = 0.8 + Math.random() * 0.8;

        gsap.fromTo(p,
            { x: 0, y: 0, opacity: 1, scale: 1.5 },
            { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 40, opacity: 0, scale: 0,
              duration: dur, ease: "power2.out", delay: Math.random() * 0.15,
              onComplete: function() { p.remove(); }
            }
        );
    }

    // Central flash (lightweight)
    var flash = document.createElement("div");
    flash.style.cssText = "position:absolute;width:16px;height:16px;border-radius:50%;background:white;left:" + ox + "%;top:" + oy + "%;pointer-events:none;z-index:0;transform:translate(-50%,-50%);";
    container.appendChild(flash);
    gsap.fromTo(flash, { scale: 0.5, opacity: 1 }, { scale: 3, opacity: 0, duration: 0.5, ease: "power2.out", onComplete: function() { flash.remove(); } });
}

// Confetti rain from top
function spawnLevelConfetti(container) {
    var colors = ["#ff6b6b", "#ffd54f", "#4ecca3", "#4fc3f7", "#ff9800", "#e040fb", "#fff", "#ffeb3b", "#76ff03", "#f50057"];
    for (var i = 0; i < 25; i++) {
        var p = document.createElement("div");
        var size = 5 + Math.random() * 8;
        var color = colors[Math.floor(Math.random() * colors.length)];
        var isRect = Math.random() > 0.4;
        var w = isRect ? size : size * (0.3 + Math.random() * 0.4);
        p.style.cssText = "position:absolute;width:" + w + "px;height:" + size + "px;background:" + color + ";left:" + (Math.random() * 100) + "%;top:-10px;pointer-events:none;z-index:0;border-radius:" + (isRect ? "2px" : "50%") + ";opacity:0.9;";
        container.appendChild(p);

        var xDrift = (Math.random() - 0.5) * 200;
        var dur = 2.0 + Math.random() * 2.0;

        gsap.to(p, {
            y: window.innerHeight + 50, x: xDrift, rotation: Math.random() * 720 - 360,
            opacity: 0, duration: dur, delay: Math.random() * 1.5,
            ease: "power1.in",
            onComplete: function() { p.remove(); }
        });
    }
}

// Sparkles around a star element
function spawnStarSparkles(starEl) {
    var rect = starEl.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var sparkColors = ["#ffd54f", "#fff", "#ffab40", "#ffe082"];

    for (var i = 0; i < 6; i++) {
        var sp = document.createElement("div");
        var size = 3 + Math.random() * 4;
        var color = sparkColors[Math.floor(Math.random() * sparkColors.length)];
        sp.style.cssText = "position:fixed;width:" + size + "px;height:" + size + "px;border-radius:50%;background:" + color + ";left:" + cx + "px;top:" + cy + "px;pointer-events:none;z-index:300;";
        document.body.appendChild(sp);

        var angle = (i / 6) * Math.PI * 2;
        var dist = 20 + Math.random() * 25;
        gsap.fromTo(sp,
            { x: 0, y: 0, opacity: 1, scale: 1.5 },
            { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0,
              duration: 0.6 + Math.random() * 0.3, ease: "power2.out",
              onComplete: function() { sp.remove(); }
            }
        );
    }
}

function hideLevelCompleteScreen(callback) {
    gsap.killTweensOf("#lcNextBtn");
    var lc = document.getElementById("levelCompleteScreen");
    // Clean up any remaining particles
    var particles = lc.querySelectorAll(".lc-firework-particle");
    particles.forEach(function(p) { p.remove(); });
    gsap.to(lc, {
        opacity: 0, duration: 0.3, ease: "power2.in",
        onComplete: function() { lc.classList.add("hidden"); if (callback) callback(); }
    });
}

// --- Level Start Banner ---
function showLevelStartBanner(config) {
    var banner = document.getElementById("levelStartBanner");
    if (!banner) return;
    document.getElementById("lsbLevel").textContent = T("level_x") + " " + config.levelNum;
    banner.classList.remove("hidden");

    gsap.fromTo(banner,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );

    gsap.to(banner, {
        opacity: 0, duration: 0.3, delay: 1.5, ease: "power2.in",
        onComplete: function() { banner.classList.add("hidden"); }
    });
}

// --- Level Progress HUD ---
function updateLevelProgressHUD() {
    if (!levelMode || !currentLevelConfig) return;
    var bar = document.getElementById("levelProgressBar");
    if (!bar) return;
    var pct = Math.min(100, (currentSegmentIndex / currentLevelConfig.segmentCount) * 100);
    bar.style.width = pct + "%";
}

// --- Loading ---
function simulateLoading(callback) {
    const loadingBar = document.getElementById("loadingBar");
    const progressArea = document.getElementById("loadingProgress");
    const tapBtn = document.getElementById("tapToStartBtn");
    let loadProgress = 0;

    const interval = setInterval(() => {
        loadProgress += Math.random() * 15 + 5;
        if (loadProgress >= 100) {
            loadProgress = 100;
            loadingBar.style.width = "100%";
            clearInterval(interval);
            setTimeout(() => {
                // Hide loading bar, show tap-to-start button
                gsap.to(progressArea, { opacity: 0, y: -10, duration: 0.3, onComplete: function() { progressArea.classList.add("hidden"); } });
                tapBtn.classList.remove("hidden");
                gsap.fromTo(tapBtn, { scale: 0.5, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" });
                // Breathing animation
                gsap.to(tapBtn, { scale: 1.06, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.8 });

                // Tap handler
                function onTap(e) {
                    e.stopPropagation();
                    tapBtn.removeEventListener("click", onTap);
                    tapBtn.removeEventListener("touchend", onTap);
                    // Init audio on user gesture
                    initAudio();
                    gsap.killTweensOf(tapBtn);
                    // Animate out
                    const ls = document.getElementById("loadingScreen");
                    gsap.to(ls, {
                        opacity: 0, duration: 0.6, ease: "power2.inOut",
                        onComplete: () => { ls.classList.add("hidden"); if (callback) callback(); }
                    });
                }
                tapBtn.addEventListener("click", onTap);
                tapBtn.addEventListener("touchend", onTap);
            }, 400);
        } else {
            loadingBar.style.width = loadProgress + "%";
        }
    }, 120);
}
