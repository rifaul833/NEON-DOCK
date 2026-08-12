// ============ LEVEL SELECT SCREEN ============
// Depends on: levels.js, audio.js, ui.js

var LOCK_SVG = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" fill="currentColor"/></svg>';

function initLevelSelect() {
    var grid = document.getElementById("lsScroller");
    if (!grid) return;
    grid.innerHTML = "";

    // Find current level: first unlocked with 0 stars
    var currentLevel = -1;
    for (var c = 1; c <= WORLDS.length; c++) {
        if (isLevelUnlocked(c) && getLevelStars(c) === 0) {
            currentLevel = c;
            break;
        }
    }

    for (var i = 0; i < WORLDS.length; i++) {
        var levelNum = i + 1;
        var stars = getLevelStars(levelNum);
        var unlocked = isLevelUnlocked(levelNum);

        var btn = document.createElement("button");
        btn.className = "ls-btn";

        // 3 states: locked, current, done
        if (!unlocked) {
            btn.classList.add("locked");
        } else if (levelNum === currentLevel) {
            btn.classList.add("current");
        } else if (stars > 0) {
            btn.classList.add("done");
        }

        // Number (always shown)
        var numEl = document.createElement("span");
        numEl.className = "ls-num";
        numEl.textContent = levelNum;
        btn.appendChild(numEl);

        // Lock icon for locked
        if (!unlocked) {
            var lockEl = document.createElement("div");
            lockEl.className = "ls-lock";
            lockEl.innerHTML = LOCK_SVG;
            btn.appendChild(lockEl);
        }

        // Click handler
        if (unlocked) {
            btn.addEventListener("click", (function(ln) {
                return function(e) {
                    e.stopPropagation();
                    initAudio();
                    playButtonClickSound();
                    startLevel(ln);
                };
            })(levelNum));
        }

        grid.appendChild(btn);
    }

    updateLevelSelectStars();
}

function updateLevelSelectStars() {
    var totalEl = document.getElementById("lsTotalStars");
    if (totalEl) totalEl.textContent = getTotalStars() + "/" + (WORLDS.length * 3);
}

function refreshLevelSelectUI() {
    initLevelSelect();
}

function areAllLevelsComplete() {
    for (var i = 1; i <= WORLDS.length; i++) {
        if (getLevelStars(i) < 1) return false;
    }
    return true;
}

function showLevelSelect() {
    if (areAllLevelsComplete()) {
        showAllCompleteScreen();
    } else {
        showLevelSelectDirect();
    }
}

function showLevelSelectDirect() {
    refreshLevelSelectUI();
    var ls = document.getElementById("levelSelectScreen");
    ls.classList.remove("hidden");
    ls.style.opacity = "0";
    gsap.to(ls, { opacity: 1, duration: 0.3 });

    // Quick staggered entrance — cap delay for many levels
    var btns = document.querySelectorAll(".ls-btn");
    btns.forEach(function(b, i) {
        gsap.fromTo(b,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.25, ease: "power2.out", delay: Math.min(0.04 + i * 0.02, 0.8) }
        );
    });
}

// ============ ALL COMPLETE CELEBRATION ============

var acResetState = false;
var acResetTimer = null;

function showAllCompleteScreen() {
    var screen = document.getElementById("allCompleteScreen");
    if (!screen) return;

    // Update star count
    var countEl = document.getElementById("acStarCount");
    if (countEl) countEl.textContent = getTotalStars() + "/" + (WORLDS.length * 3);

    // Apply translations
    applyTranslations();

    screen.classList.remove("hidden");
    screen.style.opacity = "0";

    // Reset button state
    resetAcResetBtn();

    // Animate in
    gsap.to(screen, { opacity: 1, duration: 0.4 });

    gsap.fromTo(".ac-trophy",
        { scale: 0, rotation: -20 },
        { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)", delay: 0.15 }
    );

    gsap.fromTo(".ac-title",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.35 }
    );

    gsap.fromTo(".ac-msg",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", delay: 0.45 }
    );

    gsap.fromTo(".ac-star-card",
        { y: 25, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", delay: 0.55 }
    );

    var btns = screen.querySelectorAll(".ac-btn");
    btns.forEach(function(btn, i) {
        gsap.fromTo(btn,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, ease: "power2.out", delay: 0.65 + i * 0.1 }
        );
    });
}

function hideAllCompleteScreen(callback) {
    var screen = document.getElementById("allCompleteScreen");
    if (!screen) { if (callback) callback(); return; }
    gsap.to(screen, {
        opacity: 0, duration: 0.25, ease: "power2.in",
        onComplete: function() {
            screen.classList.add("hidden");
            if (callback) callback();
        }
    });
}

function handleAcReset() {
    var btn = document.getElementById("acResetBtn");
    if (!btn) return;

    if (!acResetState) {
        acResetState = true;
        btn.textContent = T("reset_confirm");
        btn.classList.add("confirming");
        acResetTimer = setTimeout(resetAcResetBtn, 3000);
        return;
    }

    // Second press — reset
    localStorage.clear();
    location.reload();
}

function resetAcResetBtn() {
    acResetState = false;
    if (acResetTimer) { clearTimeout(acResetTimer); acResetTimer = null; }
    var btn = document.getElementById("acResetBtn");
    if (btn) {
        btn.textContent = T("reset_storage");
        btn.classList.remove("confirming");
    }
}

function hideLevelSelect(callback) {
    var ls = document.getElementById("levelSelectScreen");
    gsap.to(ls, {
        opacity: 0, duration: 0.25, ease: "power2.in",
        onComplete: function() { ls.classList.add("hidden"); if (callback) callback(); }
    });
}

function startLevel(levelNum) {
    var config = generateLevelConfig(levelNum);
    currentLevelConfig = config;
    levelMode = true;
    levelCoinsCollected = 0;
    levelHadCrash = false;

    var doStart = function() {
        if (carMesh) carMesh.getChildMeshes().forEach(function(m) { m.isVisible = true; });
        if (lobbyPedestalMesh) lobbyPedestalMesh.isVisible = false;
        lobbyRotating = false;

        applyLevelConfig(config);
        resetGame();
        applyWorldTheme(config.worldIndex);
        buildWorldDecorations(config.worldIndex);
        setWorldMeshesVisible(true);

        var progContainer = document.getElementById("levelProgressContainer");
        if (progContainer) progContainer.classList.remove("hidden");
        var progBar = document.getElementById("levelProgressBar");
        if (progBar) progBar.style.width = "0%";

        gameState = "playing";
        showHUD();
        lastTime = performance.now() / 1000;
        showLevelStartBanner(config);
        startGameMusic();
    };

    var ls = document.getElementById("levelSelectScreen");
    if (ls && !ls.classList.contains("hidden")) {
        hideLevelSelect(doStart);
    } else {
        doStart();
    }
}

// Back button + All Complete event listeners
document.addEventListener("DOMContentLoaded", function() {
    var backBtn = document.getElementById("lsBackBtn");
    if (backBtn) {
        backBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            initAudio();
            playButtonClickSound();
            hideLevelSelect(function() {
                showLobby();
            });
        });
    }

    // All Complete — Lobby button
    var acLobbyBtn = document.getElementById("acLobbyBtn");
    if (acLobbyBtn) {
        acLobbyBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            initAudio();
            playButtonClickSound();
            hideAllCompleteScreen(function() {
                showLobby();
            });
        });
    }

    // All Complete — View Levels button
    var acViewBtn = document.getElementById("acViewLevelsBtn");
    if (acViewBtn) {
        acViewBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            initAudio();
            playButtonClickSound();
            hideAllCompleteScreen(function() {
                showLevelSelectDirect();
            });
        });
    }

    // All Complete — Reset button
    var acResetBtn = document.getElementById("acResetBtn");
    if (acResetBtn) {
        acResetBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            handleAcReset();
        });
    }
});
