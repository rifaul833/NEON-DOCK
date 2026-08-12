// ===== LOBBY SYSTEM =====
// Depends on: cars.js, audio.js, game.js (for buildCarWithConfig, scene globals)

let lobbyCarIndex = 0;
let lobbyRotating = false;
let lobbyPedestalMesh = null;
let buyConfirmState = false;
let buyConfirmTimer = null;

function initLobby() {
    lobbyCarIndex = CARS.findIndex(c => c.id === loadSelectedCar());
    if (lobbyCarIndex < 0) lobbyCarIndex = 0;

    document.getElementById("carLeft").addEventListener("click", (e) => {
        e.stopPropagation();
        initAudio();
        playCarSwitchSound();
        switchLobbyCar(-1);
    });
    document.getElementById("carRight").addEventListener("click", (e) => {
        e.stopPropagation();
        initAudio();
        playCarSwitchSound();
        switchLobbyCar(1);
    });
    document.getElementById("buyBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        initAudio();
        handleBuy();
    });
    document.getElementById("selectBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        initAudio();
        handleSelect();
    });
    document.getElementById("lobbyPlayBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        initAudio();
        playStartGameSound();
        startGameFromLobby();
    });
    document.getElementById("lobbySettingsBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        initAudio();
        if (typeof playButtonClickSound === "function") playButtonClickSound();
        showSettings();
    });
}

function setWorldMeshesVisible(visible) {
    // Hide/show road segments, gate, ground
    segments.forEach(seg => seg.meshes.forEach(m => { if (!m.isDisposed()) m.isVisible = visible; }));
    gateMeshes.forEach(m => { if (m && !m.isDisposed()) m.isVisible = visible; });
    // In level mode: hide old city buildings, show world decorations
    // In endless/lobby: show city buildings, no world decorations
    var showCity = visible && !levelMode;
    cityBuildings.forEach(m => { if (m && !m.isDisposed()) m.isVisible = showCity; });
    worldDecorations.forEach(m => {
        if (m && !m.isDisposed()) {
            if (m.getChildMeshes) {
                m.getChildMeshes().forEach(function(cm) { cm.isVisible = visible; });
            }
            if (m.isVisible !== undefined) m.isVisible = visible;
        }
    });
    var gnd = scene.getMeshByName("ground");
    if (gnd) {
        if (levelMode) gnd.isVisible = false;
        else gnd.isVisible = visible;
    }
}

function showLobby() {
    gameState = "lobby";
    const lobby = document.getElementById("lobbyScreen");
    lobby.classList.remove("hidden");
    lobby.style.opacity = "0";

    // Hide all world meshes for clean lobby
    setWorldMeshesVisible(false);

    // Lobby scene color (dark gradient feel)
    scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.15, 1);
    scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.15);

    // Update stats
    updateLobbyStats();

    // Setup 3D car preview
    lobbyCarIndex = CARS.findIndex(c => c.id === loadSelectedCar());
    if (lobbyCarIndex < 0) lobbyCarIndex = 0;
    setupLobbyPreview();
    updateCarActionUI();

    // Spawn floating ambient particles
    spawnLobbyParticles();

    // Welcome chime (only if audio is initialized)
    if (audioCtx) playLobbyEnterSound();

    // Start lobby music
    if (audioCtx) startLobbyMusic();

    // Animate in - dramatic entrance
    gsap.to(lobby, { opacity: 1, duration: 0.5 });

    // Title: DRIFT slams from top with elastic bounce
    gsap.fromTo(".title-drift",
        { y: -150, opacity: 0, scale: 1.8, rotation: -8 },
        { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)", delay: 0.15 }
    );
    // Title: BOSS smashes from bottom
    gsap.fromTo(".title-boss",
        { y: 120, opacity: 0, scale: 1.8, rotation: 5 },
        { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.4)", delay: 0.3 }
    );

    // Car area scales up with bounce
    gsap.fromTo(".lobby-car-area",
        { scale: 0, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)", delay: 0.5 }
    );

    // Pedestal glow fades in
    gsap.fromTo(".lobby-pedestal-glow",
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", delay: 0.7 }
    );

    // Arrows fly in from sides with overshoot
    gsap.fromTo(".carousel-left",
        { x: -80, opacity: 0, scale: 0.3 },
        { x: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(2)", delay: 0.65 }
    );
    gsap.fromTo(".carousel-right",
        { x: 80, opacity: 0, scale: 0.3 },
        { x: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(2)", delay: 0.65 }
    );

    // Car name/desc fade up
    gsap.fromTo(".carousel-info",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.4)", delay: 0.75 }
    );

    // Action area
    gsap.fromTo(".lobby-car-action",
        { y: 30, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)", delay: 0.8 }
    );

    // Stats bar slides up with glass reveal
    gsap.fromTo(".lobby-stats",
        { y: 40, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)", delay: 0.9 }
    );

    // Play button: dramatic bounce in + continuous breathing
    gsap.fromTo(".lobby-play-btn",
        { y: 60, opacity: 0, scale: 0.3, rotation: -5 },
        { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.4)", delay: 1.0 }
    );
    gsap.to(".lobby-play-btn", {
        scale: 1.06, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8,
    });

    // Hint text
    gsap.fromTo(".start-hint",
        { opacity: 0, y: 15, letterSpacing: "0.2em" },
        { opacity: 0.55, y: 0, letterSpacing: "0.05em", duration: 0.6, delay: 1.1 }
    );
}

function spawnLobbyParticles() {
    const container = document.getElementById("lobbyParticles");
    if (!container) return;
    container.innerHTML = ""; // clear old

    const colors = ["rgba(78,204,163,0.3)", "rgba(255,190,11,0.2)", "rgba(69,183,209,0.25)", "rgba(255,255,255,0.15)"];

    for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        p.className = "lobby-particle";
        const size = 3 + Math.random() * 6;
        p.style.width = size + "px";
        p.style.height = size + "px";
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = Math.random() * 100 + "%";
        p.style.top = Math.random() * 100 + "%";
        p.style.filter = "blur(" + (1 + Math.random() * 2) + "px)";
        container.appendChild(p);

        // Floating animation - random direction
        const dur = 4 + Math.random() * 6;
        const xDrift = (Math.random() - 0.5) * 80;
        const yDrift = -(20 + Math.random() * 60);

        gsap.to(p, {
            opacity: 0.4 + Math.random() * 0.4,
            duration: 1 + Math.random(),
            delay: Math.random() * 2,
        });

        gsap.to(p, {
            x: xDrift, y: yDrift,
            duration: dur,
            ease: "none",
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 2,
        });

        gsap.to(p, {
            opacity: 0, duration: dur * 0.3,
            repeat: -1, yoyo: true,
            ease: "sine.inOut",
            delay: 1 + Math.random() * 3,
        });
    }
}

function hideLobby(callback) {
    gsap.killTweensOf(".lobby-play-btn");
    gsap.to("#lobbyScreen", {
        opacity: 0, duration: 0.4, ease: "power3.in",
        onComplete: () => {
            document.getElementById("lobbyScreen").classList.add("hidden");
            if (callback) callback();
        }
    });
}

function updateLobbyStats() {
    document.getElementById("lobbyCoins").textContent = loadTotalCoins();
    document.getElementById("lobbyBest").textContent = loadHighScore();
}

function setupLobbyPreview() {
    const car = CARS[lobbyCarIndex];
    document.getElementById("carName").textContent = car.nameKey ? T(car.nameKey) : car.name;
    document.getElementById("carDesc").textContent = car.descKey ? T(car.descKey) : car.desc;

    // Build car in scene with lobby camera
    destroyCurrentCar();
    buildCarWithConfig(car);
    positionCarForLobby();
    lobbyRotating = true;
}

function positionCarForLobby() {
    if (!carMesh) return;
    carMesh.rotation = new BABYLON.Vector3(0, 0, 0);
    carMesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
    carMesh.position = new BABYLON.Vector3(0, 0, 0);

    // Auto-position on pedestal using bounding box
    scene.updateTransformMatrix(true);
    carMesh.getChildMeshes().forEach(function(m) { m.refreshBoundingInfo(); m.computeWorldMatrix(true); });
    var lobbyBounds = carMesh.getHierarchyBoundingVectors(true);
    console.log("[Lobby] bounds minY:", lobbyBounds.min.y);

    // Pedestal top = 0.375, sit car just above it
    carMesh.position.y = 0.45 - lobbyBounds.min.y;
    carMesh._lobbyBaseY = carMesh.position.y;

    // Create pedestal
    if (!lobbyPedestalMesh) {
        lobbyPedestalMesh = BABYLON.MeshBuilder.CreateCylinder("pedestal", {
            diameter: 5, height: 0.15, tessellation: 32
        }, scene);
        const pedMat = new BABYLON.StandardMaterial("pedMat", scene);
        pedMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.2);
        pedMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        pedMat.emissiveColor = new BABYLON.Color3(0.04, 0.06, 0.08);
        lobbyPedestalMesh.material = pedMat;
        lobbyPedestalMesh.receiveShadows = true;
    }
    lobbyPedestalMesh.position = new BABYLON.Vector3(0, 0.3, 0);
    lobbyPedestalMesh.isVisible = true;

    // Camera for lobby - kill any ongoing tweens and fully reset
    // IMPORTANT: set target directly (not setTarget which recomputes alpha/beta)
    gsap.killTweensOf(camera);
    camera.target.x = 0;
    camera.target.y = 0.5;
    camera.target.z = 0;
    camera.alpha = -3 * Math.PI / 4;
    camera.beta = Math.PI / 3.2;
    camera.radius = 25;
}

function switchLobbyCar(dir) {
    lobbyCarIndex = (lobbyCarIndex + dir + CARS.length) % CARS.length;
    const car = CARS[lobbyCarIndex];

    // Reset buy confirm
    cancelBuyConfirm();

    // Animate car name/desc crossfade
    const nameEl = document.getElementById("carName");
    const descEl = document.getElementById("carDesc");

    gsap.to(nameEl, {
        opacity: 0, x: dir * -20, duration: 0.15,
        onComplete: () => {
            nameEl.textContent = car.nameKey ? T(car.nameKey) : car.name;
            gsap.fromTo(nameEl, { opacity: 0, x: dir * 20 }, { opacity: 1, x: 0, duration: 0.2 });
        }
    });
    gsap.to(descEl, {
        opacity: 0, duration: 0.15,
        onComplete: () => {
            descEl.textContent = car.descKey ? T(car.descKey) : car.desc;
            gsap.to(descEl, { opacity: 1, duration: 0.2 });
        }
    });

    // Swap 3D car
    if (carMesh) {
        gsap.to(carMesh.scaling, {
            x: 0, y: 0, z: 0, duration: 0.2, ease: "back.in(2)",
            onComplete: () => {
                destroyCurrentCar();
                buildCarWithConfig(car);
                positionCarForLobby();
                carMesh.scaling = new BABYLON.Vector3(0, 0, 0);
                gsap.to(carMesh.scaling, { x: 1.5, y: 1.5, z: 1.5, duration: 0.35, ease: "back.out(1.7)" });
            }
        });
    }

    // Arrow bounce
    const arrowEl = dir > 0 ? ".carousel-right" : ".carousel-left";
    gsap.fromTo(arrowEl, { scale: 0.7 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });

    updateCarActionUI();
}

function updateCarActionUI() {
    const car = CARS[lobbyCarIndex];
    const unlocked = isCarUnlocked(car.id);
    const selected = loadSelectedCar() === car.id;

    const priceTag = document.getElementById("carPriceTag");
    const buyBtn = document.getElementById("buyBtn");
    const selectBtn = document.getElementById("selectBtn");
    const selectedBadge = document.getElementById("selectedBadge");

    // Hide all first
    priceTag.classList.add("hidden");
    buyBtn.classList.add("hidden");
    selectBtn.classList.add("hidden");
    selectedBadge.classList.add("hidden");

    if (!unlocked) {
        // Locked - show price + buy
        priceTag.classList.remove("hidden");
        document.getElementById("carPriceValue").textContent = car.price;
        buyBtn.classList.remove("hidden");
        document.getElementById("buyBtnText").textContent = T("buy");
        buyBtn.classList.remove("confirm", "not-enough");
    } else if (selected) {
        // Selected
        selectedBadge.classList.remove("hidden");
        gsap.fromTo(selectedBadge, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.4)" });
    } else {
        // Owned but not selected
        selectBtn.classList.remove("hidden");
        gsap.fromTo(selectBtn, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.4)" });
    }
}

function handleBuy() {
    const car = CARS[lobbyCarIndex];
    const totalCoins = loadTotalCoins();
    const buyBtn = document.getElementById("buyBtn");

    if (!buyConfirmState) {
        // First tap - confirm?
        if (totalCoins < car.price) {
            // Not enough
            buyBtn.classList.add("not-enough");
            document.getElementById("buyBtnText").textContent = T("not_enough");
            playErrorSound();
            gsap.fromTo(buyBtn, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
            setTimeout(() => {
                buyBtn.classList.remove("not-enough");
                document.getElementById("buyBtnText").textContent = T("buy");
            }, 1200);
            return;
        }
        buyConfirmState = true;
        buyBtn.classList.add("confirm");
        document.getElementById("buyBtnText").textContent = T("confirm");
        gsap.fromTo(buyBtn, { scale: 1.1 }, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.3)" });
        buyConfirmTimer = setTimeout(cancelBuyConfirm, 3000);
        return;
    }

    // Second tap - purchase!
    cancelBuyConfirm();

    // Deduct coins
    const newCoins = totalCoins - car.price;
    saveTotalCoins(newCoins);

    // Animate coin counter
    const coinEl = document.getElementById("lobbyCoins");
    gsap.to({ val: totalCoins }, {
        val: newCoins, duration: 0.8, snap: { val: 1 },
        onUpdate: function () { coinEl.textContent = Math.round(this.targets()[0].val); }
    });
    gsap.fromTo(coinEl, { scale: 1.3, color: "#ff6b6b" }, { scale: 1, color: "#ffbe0b", duration: 0.5, ease: "back.out(1.4)" });

    // Unlock car
    unlockCar(car.id);
    saveSelectedCar(car.id);

    // Sound
    playPurchaseSound();

    // Confetti!
    spawnConfetti();

    // Car glow effect
    if (carMesh) {
        gsap.to(carMesh.scaling, {
            x: 1.8, y: 1.8, z: 1.8, duration: 0.2,
            onComplete: () => {
                gsap.to(carMesh.scaling, { x: 1.5, y: 1.5, z: 1.5, duration: 0.4, ease: "elastic.out(1, 0.3)" });
            }
        });
    }

    // Update UI with delay for celebration
    setTimeout(() => updateCarActionUI(), 600);
}

function cancelBuyConfirm() {
    buyConfirmState = false;
    if (buyConfirmTimer) { clearTimeout(buyConfirmTimer); buyConfirmTimer = null; }
    const buyBtn = document.getElementById("buyBtn");
    if (buyBtn) {
        buyBtn.classList.remove("confirm", "not-enough");
        document.getElementById("buyBtnText").textContent = T("buy");
    }
}

function handleSelect() {
    const car = CARS[lobbyCarIndex];
    saveSelectedCar(car.id);
    playSelectSound();

    updateCarActionUI();

    // Stats refresh
    updateLobbyStats();
}

function spawnConfetti() {
    const container = document.getElementById("confettiContainer");
    if (!container) return;
    const colors = ["#ff6b6b", "#ffd54f", "#4ecca3", "#4fc3f7", "#ff9800", "#e040fb", "#fff", "#ffeb3b"];
    const shapes = ["circle", "rect", "rect"];

    for (let i = 0; i < 80; i++) {
        const p = document.createElement("div");
        p.className = "confetti-piece";
        const size = 6 + Math.random() * 12;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        p.style.width = size + "px";
        p.style.height = (shape === "rect" ? size * (0.4 + Math.random() * 0.3) : size) + "px";
        p.style.background = color;
        p.style.borderRadius = shape === "circle" ? "50%" : "2px";
        p.style.left = "50%";
        p.style.top = "45%";
        p.style.boxShadow = "0 0 6px " + color;

        container.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 300;
        const fallExtra = 100 + Math.random() * 200;

        gsap.fromTo(p,
            { x: 0, y: 0, opacity: 1, scale: 1.5, rotation: 0 },
            {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist + fallExtra,
                opacity: 0,
                scale: 0.3,
                rotation: Math.random() * 1080 - 540,
                duration: 1.2 + Math.random() * 1.0,
                delay: Math.random() * 0.15,
                ease: "power2.out",
                onComplete: () => p.remove(),
            }
        );
    }
}

function startGameFromLobby() {
    hideLobby(function() {
        if (carMesh) carMesh.getChildMeshes().forEach(function(m) { m.isVisible = false; });
        if (lobbyPedestalMesh) lobbyPedestalMesh.isVisible = false;
        lobbyRotating = false;
        showLevelSelect();
    });
}
