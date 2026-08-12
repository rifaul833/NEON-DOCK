// ===== DRIFT BOSS - Main Game Engine =====
// Load order: cars.js, audio.js, obstacles.js, ui.js, lobby.js, game.js

// --- DOM refs ---
var canvas = document.getElementById("gameCanvas");
var scoreDisplay = document.querySelector(".score-display");
var coinCount = document.querySelector(".coin-count");

// --- Game Config (shared) ---
var CONFIG = {
    CAR_SPEED: 13,
    SNAP_SPEED: 4.0,
    VISUAL_SNAP: 22,
    ROAD_WIDTH: 6,
    SEGMENT_LENGTH: 14,
    SEGMENTS_AHEAD: 12,
    SEGMENTS_BEHIND: 4,
    TIRE_MARK_INTERVAL: 0.015,
    MAX_TIRE_MARKS: 800,
    RAMP_CHANCE: 0.25,
    RAMP_HEIGHT: 1.0,
    GRAVITY: 40,
    POWERUP_CHANCE: 0.30,
};

// --- Level Config Override ---
function applyLevelConfig(config) {
    if (!CONFIG._original) {
        CONFIG._original = {
            CAR_SPEED: CONFIG.CAR_SPEED,
            ROAD_WIDTH: CONFIG.ROAD_WIDTH,
            SEGMENT_LENGTH: CONFIG.SEGMENT_LENGTH,
            RAMP_CHANCE: CONFIG.RAMP_CHANCE,
            RAMP_HEIGHT: CONFIG.RAMP_HEIGHT,
            GRAVITY: CONFIG.GRAVITY,
            POWERUP_CHANCE: CONFIG.POWERUP_CHANCE,
            SNAP_SPEED: CONFIG.SNAP_SPEED,
        };
    }
    var carBonus = getSelectedCarConfig().speedBonus || 0;
    CONFIG.CAR_SPEED = config.carSpeed + carBonus;
    CONFIG.ROAD_WIDTH = config.roadWidth;
    CONFIG.SEGMENT_LENGTH = config.segmentLength || CONFIG._original.SEGMENT_LENGTH;
    CONFIG.RAMP_CHANCE = config.rampChance;
    CONFIG.RAMP_HEIGHT = config.rampHeight;
    CONFIG.POWERUP_CHANCE = 0.30;
    if (config.lowGravity) CONFIG.GRAVITY = 25;
    else CONFIG.GRAVITY = CONFIG._original.GRAVITY;
    if (config.slipperyPhysics) CONFIG.SNAP_SPEED = CONFIG._original.SNAP_SPEED * config.slipFactor;
    else CONFIG.SNAP_SPEED = CONFIG._original.SNAP_SPEED;
}

function restoreDefaultConfig() {
    if (CONFIG._original) {
        CONFIG.CAR_SPEED = CONFIG._original.CAR_SPEED;
        CONFIG.ROAD_WIDTH = CONFIG._original.ROAD_WIDTH;
        CONFIG.SEGMENT_LENGTH = CONFIG._original.SEGMENT_LENGTH;
        CONFIG.RAMP_CHANCE = CONFIG._original.RAMP_CHANCE;
        CONFIG.RAMP_HEIGHT = CONFIG._original.RAMP_HEIGHT;
        CONFIG.GRAVITY = CONFIG._original.GRAVITY;
        CONFIG.POWERUP_CHANCE = CONFIG._original.POWERUP_CHANCE;
        CONFIG.SNAP_SPEED = CONFIG._original.SNAP_SPEED;
    }
    // Apply selected car's speed bonus
    var carBonus = getSelectedCarConfig().speedBonus || 0;
    CONFIG.CAR_SPEED += carBonus;
}

// Finish line meshes
var finishLineMeshes = [];

function buildFinishLine(lastSegment) {
    // Build a checkered gate at the end of the last segment, oriented perpendicular to road
    var fx, fz, isZDir;
    if (lastSegment.dir === "z") {
        fx = lastSegment.startX;
        fz = lastSegment.startZ + lastSegment.length;
        isZDir = true;
    } else {
        fx = lastSegment.startX + lastSegment.length;
        fz = lastSegment.startZ;
        isZDir = false;
    }

    var finishElev = (lastSegment.endY !== undefined) ? lastSegment.endY : 0;
    var W = CONFIG.ROAD_WIDTH;
    var gateMat2 = new BABYLON.StandardMaterial("finishGateMat", scene);
    gateMat2.diffuseColor = new BABYLON.Color3(0.2, 0.85, 0.5);
    gateMat2.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    gateMat2.emissiveColor = new BABYLON.Color3(0.05, 0.3, 0.15);

    // Poles: perpendicular to road direction
    var poleL2 = BABYLON.MeshBuilder.CreateBox("finPoleL", { width: 0.3, height: 5, depth: 0.3 }, scene);
    var poleR2 = BABYLON.MeshBuilder.CreateBox("finPoleR", { width: 0.3, height: 5, depth: 0.3 }, scene);
    if (isZDir) {
        // Road goes in Z, gate spans X
        poleL2.position = new BABYLON.Vector3(fx - W / 2 + 0.2, finishElev + 2.5, fz);
        poleR2.position = new BABYLON.Vector3(fx + W / 2 - 0.2, finishElev + 2.5, fz);
    } else {
        // Road goes in X, gate spans Z
        poleL2.position = new BABYLON.Vector3(fx, finishElev + 2.5, fz - W / 2 + 0.2);
        poleR2.position = new BABYLON.Vector3(fx, finishElev + 2.5, fz + W / 2 - 0.2);
    }
    poleL2.material = gateMat2; shadowGen.addShadowCaster(poleL2);
    poleR2.material = gateMat2; shadowGen.addShadowCaster(poleR2);

    // Top bar: spans across road width
    var barW = isZDir ? W : 0.5;
    var barD = isZDir ? 0.5 : W;
    var topBar2 = BABYLON.MeshBuilder.CreateBox("finTopBar", { width: barW, height: 1.2, depth: barD }, scene);
    topBar2.position = new BABYLON.Vector3(fx, finishElev + 5.2, fz);

    // Checkered texture
    var checkerMat = new BABYLON.StandardMaterial("finCheckerMat", scene);
    var checkerTex = new BABYLON.DynamicTexture("finCheckerTex", 128, scene);
    var cctx = checkerTex.getContext();
    var cs = 16;
    for (var cy = 0; cy < 128; cy += cs) {
        for (var cx2 = 0; cx2 < 128; cx2 += cs) {
            cctx.fillStyle = ((cx2 / cs + cy / cs) % 2 === 0) ? "#111" : "#fff";
            cctx.fillRect(cx2, cy, cs, cs);
        }
    }
    checkerTex.update();
    checkerMat.diffuseTexture = checkerTex;
    checkerMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    topBar2.material = checkerMat;
    shadowGen.addShadowCaster(topBar2);

    // FINISH text plane - faces the car approach direction
    var textPlane2 = BABYLON.MeshBuilder.CreatePlane("finText", { width: 3.5, height: 0.9 }, scene);
    if (isZDir) {
        textPlane2.position = new BABYLON.Vector3(fx, finishElev + 5.25, fz - 0.27);
    } else {
        textPlane2.position = new BABYLON.Vector3(fx - 0.27, finishElev + 5.25, fz);
        textPlane2.rotation.y = Math.PI / 2;
    }
    var textMat2 = new BABYLON.StandardMaterial("finTextMat", scene);
    var textTex2 = new BABYLON.DynamicTexture("finTextTex", { width: 512, height: 128 }, scene);
    textTex2.hasAlpha = true;
    var tctx = textTex2.getContext();
    tctx.clearRect(0, 0, 512, 128);
    tctx.font = "bold 72px Arial"; tctx.fillStyle = "#4ecca3";
    tctx.textAlign = "center"; tctx.textBaseline = "middle";
    tctx.fillText(T("finish"), 256, 64);
    textTex2.update();
    textMat2.diffuseTexture = textTex2;
    textMat2.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.2);
    textMat2.useAlphaFromDiffuseTexture = true;
    textMat2.backFaceCulling = false;
    textPlane2.material = textMat2;

    finishLineMeshes = [poleL2, poleR2, topBar2, textPlane2];

    // Store finish position for detection
    window._finishX = fx;
    window._finishZ = fz;
}

function checkFinishLineReached(carX, carZ) {
    if (!window._finishX && window._finishX !== 0) return false;
    var dx = carX - window._finishX;
    var dz = carZ - window._finishZ;
    return (dx * dx + dz * dz) < 25; // within 5 units
}

function cleanupFinishLine() {
    for (var i = 0; i < finishLineMeshes.length; i++) {
        if (finishLineMeshes[i] && !finishLineMeshes[i].isDisposed()) finishLineMeshes[i].dispose();
    }
    finishLineMeshes = [];
    window._finishX = undefined;
    window._finishZ = undefined;
}

// --- State (shared) ---
var gameState = "loading";
var carMesh = null;
var lastTime = 0;

var score = 0;
var sessionCoins = 0;
var isTurning = false;
var firstInput = false;
var carHeading = 0;
var carVisualHeading = 0;
var targetHeading = 0;
var currentSegmentIndex = 0;
var highestSegment = 0;
var highScore = loadHighScore();

// Road data
var segments = [];
var nextSegStartX = 0;
var nextSegStartZ = 0;
var nextSegIndex = 0;

// Tire marks
var tireMarks = [];
var tireMarkTimer = 0;

// Smoke
var smokeSystem = null;
var smokeTexture = null;

// ===== POWER-UP SYSTEM =====
var POWERUP_TYPES = [
    { id: "shield", label: "SHIELD", color: "#4fc3f7", emissive: "#1565c0", duration: 8, icon: "S" },
    { id: "magnet", label: "MAGNET", color: "#ff7043", emissive: "#bf360c", duration: 7, icon: "M" },
    { id: "x2", label: "x2 COINS", color: "#ffd54f", emissive: "#f57f17", duration: 8, icon: "2x" },
];

var activePowerUps = [];
var MAGNET_RADIUS = 8;

// ===== ZONE STATE =====
var _darkActive = false;
var _darkTweening = false;
var _savedFogStart = 30;
var _savedFogEnd = 90;
var _savedHemiIntensity = 0.85;
var _rockSpawnTimer = 0;
var _activeRocks = [];
var _zoneWindParticles = []; // track wind particle systems for cleanup

// Shield
var shieldActive = false;
var shieldMesh = null;
var shieldUsed = false;
var shieldSlowMo = false;
var shieldSlowMoTimer = 0;
var SHIELD_SLOWMO_DURATION = 2.0;
var SHIELD_SLOWMO_SCALE = 0.3;
var shieldInvincible = false;
var shieldInvincibleTimer = 0;
var SHIELD_INVINCIBLE_DURATION = 1.2;

// ===== GLB MODEL SYSTEM =====
var carModelContainers = {};

function _getModelUrl(modelPath) {
    if (typeof CAR_MODEL_DATA !== "undefined" && CAR_MODEL_DATA[modelPath]) {
        var b64 = CAR_MODEL_DATA[modelPath];
        var bin = atob(b64);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        var blob = new Blob([arr], { type: "model/gltf-binary" });
        return URL.createObjectURL(blob);
    }
    return modelPath;
}

function preloadCarModels() {
    var promises = [];
    CARS.forEach(function(car) {
        if (car.model) {
            var url = _getModelUrl(car.model);
            var p = BABYLON.SceneLoader.LoadAssetContainerAsync("", url, scene, null, ".glb").then(function(container) {
                carModelContainers[car.id] = container;
                console.log("[preload] OK:", car.id, "← " + car.model, "| meshes:", container.meshes.length, "| totalVerts:", container.meshes.reduce(function(sum, m) { return sum + m.getTotalVertices(); }, 0));
            }).catch(function(e) {
                console.warn("[preload] FAIL:", car.id, "← " + car.model, e);
            });
            promises.push(p);
        }
    });
    return Promise.all(promises);
}

// ===== BABYLON SCENE =====
var engine = new BABYLON.Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true });
var scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.92, 0.72, 0.35, 1);
scene.ambientColor = new BABYLON.Color3(0.4, 0.4, 0.4);
scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
scene.fogColor = new BABYLON.Color3(0.92, 0.72, 0.35);
scene.fogStart = 30;
scene.fogEnd = 90;

var camera = new BABYLON.ArcRotateCamera("cam", -3 * Math.PI / 4, Math.PI / 3.2, 25, new BABYLON.Vector3(0, 0, 5), scene);
camera.lowerRadiusLimit = 25;
camera.upperRadiusLimit = 25;
camera.inputs.clear();

var hemiLight = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0.3, 1, 0.2), scene);
hemiLight.intensity = 0.85;
hemiLight.groundColor = new BABYLON.Color3(0.55, 0.45, 0.3);

var dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.5, -1, 0.5), scene);
dirLight.intensity = 0.6;
dirLight.position = new BABYLON.Vector3(10, 20, -10);

var shadowGen = new BABYLON.ShadowGenerator(1024, dirLight);
shadowGen.useBlurExponentialShadowMap = true;
shadowGen.blurKernel = 16;
shadowGen.darkness = 0.35;

// ===== MATERIALS =====
function makeCheckerMat(name, c1, c2, specR) {
    var mat = new BABYLON.StandardMaterial(name, scene);
    var tex = new BABYLON.DynamicTexture(name + "Tex", 128, scene);
    var ctx = tex.getContext();
    for (var y = 0; y < 128; y += 64)
        for (var x = 0; x < 128; x += 64) {
            ctx.fillStyle = ((x / 64) + (y / 64)) % 2 === 0 ? c1 : c2;
            ctx.fillRect(x, y, 64, 64);
        }
    tex.update();
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(specR, specR, specR);
    return mat;
}

function makeStripeMat(name, c1, c2, specR) {
    var mat = new BABYLON.StandardMaterial(name, scene);
    var tex = new BABYLON.DynamicTexture(name + "Tex", 128, scene);
    var ctx = tex.getContext();
    for (var i = 0; i < 128; i += 32) {
        ctx.fillStyle = (i / 32) % 2 === 0 ? c1 : c2;
        ctx.fillRect(0, i, 128, 32);
    }
    tex.update();
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(specR, specR, specR);
    return mat;
}

function makeSolidMat(name, hex, specR) {
    var mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString(hex);
    mat.specularColor = new BABYLON.Color3(specR, specR, specR);
    return mat;
}

var ROAD_THEMES = [
    { road: makeCheckerMat("road0", "#dceef8", "#ffffff", 0.15), under: makeSolidMat("under0", "#1a2a4a", 0) },
    { road: makeCheckerMat("road1", "#8bc34a", "#a5d66f", 0.1), under: makeSolidMat("under1", "#2e4a1a", 0) },
    { road: makeCheckerMat("road2", "#ce93d8", "#f3e5f5", 0.25), under: makeSolidMat("under2", "#4a1a5e", 0) },
    { road: makeStripeMat("road3", "#f5deb3", "#e8c97a", 0.1), under: makeSolidMat("under3", "#5a4020", 0) },
    { road: makeCheckerMat("road4", "#b3e5fc", "#e1f5fe", 0.35), under: makeSolidMat("under4", "#1a3a5a", 0) },
    { road: makeCheckerMat("road5", "#ff8a65", "#ffccbc", 0.2), under: makeSolidMat("under5", "#5a1a0a", 0) },
    { road: makeCheckerMat("road6", "#546e7a", "#37474f", 0.3), under: makeSolidMat("under6", "#1a1a2e", 0) },
    { road: makeStripeMat("road7", "#f48fb1", "#fce4ec", 0.15), under: makeSolidMat("under7", "#5a1a3a", 0) },
    { road: makeCheckerMat("road8", "#4db6ac", "#b2dfdb", 0.2), under: makeSolidMat("under8", "#1a3a3a", 0) },
    { road: makeCheckerMat("road9", "#ffd54f", "#fff8e1", 0.3), under: makeSolidMat("under9", "#4a3a0a", 0) },
];
var THEME_CHANGE_INTERVAL = 8;

// ===== WORLD VISUAL THEMES =====
var WORLD_THEMES = [
    { // 0 - Default (levels 1-10)
        sky: [0.55, 0.70, 0.85],
        fog: [0.55, 0.70, 0.85],
        ground: [0.45, 0.45, 0.50],
        road: makeCheckerMat("wroad0", "#dceef8", "#ffffff", 0.15),
        under: makeSolidMat("wunder0", "#1a2a4a", 0),
        hemiIntensity: 0.85
    },
    { // 1 - Purple (levels 11-13)
        sky: [0.35, 0.25, 0.55],
        fog: [0.35, 0.25, 0.55],
        ground: [0.30, 0.25, 0.40],
        road: makeCheckerMat("wroad1", "#d8c8f0", "#f0e8ff", 0.12),
        under: makeSolidMat("wunder1", "#1a0a3a", 0),
        hemiIntensity: 0.75
    },
    { // 2 - Orange (levels 14-16)
        sky: [0.75, 0.55, 0.30],
        fog: [0.75, 0.55, 0.30],
        ground: [0.50, 0.40, 0.30],
        road: makeCheckerMat("wroad2", "#f8e8c8", "#fff4e0", 0.12),
        under: makeSolidMat("wunder2", "#3a2a0a", 0),
        hemiIntensity: 0.90
    },
    { // 3 - Teal (levels 17-19)
        sky: [0.20, 0.55, 0.60],
        fog: [0.20, 0.55, 0.60],
        ground: [0.25, 0.40, 0.42],
        road: makeCheckerMat("wroad3", "#c8f0f0", "#e0ffff", 0.12),
        under: makeSolidMat("wunder3", "#0a2a3a", 0),
        hemiIntensity: 0.80
    },
    { // 4 - Gold (level 20)
        sky: [0.65, 0.58, 0.25],
        fog: [0.65, 0.58, 0.25],
        ground: [0.45, 0.42, 0.20],
        road: makeCheckerMat("wroad4", "#f8f0c0", "#fffae0", 0.15),
        under: makeSolidMat("wunder4", "#3a3a0a", 0),
        hemiIntensity: 0.95
    },
    { // 5 - Crimson (levels 21-23)
        sky: [0.45, 0.15, 0.15],
        fog: [0.45, 0.15, 0.15],
        ground: [0.35, 0.18, 0.18],
        road: makeCheckerMat("wroad5", "#f0c8c8", "#ffe0e0", 0.12),
        under: makeSolidMat("wunder5", "#2a0a0a", 0),
        hemiIntensity: 0.78
    },
    { // 6 - Emerald (levels 24-26)
        sky: [0.12, 0.42, 0.30],
        fog: [0.12, 0.42, 0.30],
        ground: [0.15, 0.35, 0.25],
        road: makeCheckerMat("wroad6", "#c8f0d8", "#e0ffe8", 0.12),
        under: makeSolidMat("wunder6", "#0a2a1a", 0),
        hemiIntensity: 0.80
    },
    { // 7 - Indigo (levels 27-29)
        sky: [0.18, 0.15, 0.48],
        fog: [0.18, 0.15, 0.48],
        ground: [0.20, 0.18, 0.38],
        road: makeCheckerMat("wroad7", "#d0c8f8", "#e4e0ff", 0.12),
        under: makeSolidMat("wunder7", "#0a0a2a", 0),
        hemiIntensity: 0.72
    },
    { // 8 - Platinum (level 30)
        sky: [0.78, 0.80, 0.85],
        fog: [0.78, 0.80, 0.85],
        ground: [0.55, 0.55, 0.58],
        road: makeCheckerMat("wroad8", "#f0f0f4", "#ffffff", 0.18),
        under: makeSolidMat("wunder8", "#2a2a30", 0),
        hemiIntensity: 0.95
    },
    { // 9 - Neon/Magenta (levels 31-35)
        sky: [0.28, 0.10, 0.30],
        fog: [0.28, 0.10, 0.30],
        ground: [0.25, 0.12, 0.28],
        road: makeCheckerMat("wroad9", "#f0c8f0", "#ffe0ff", 0.12),
        under: makeSolidMat("wunder9", "#2a0a2a", 0),
        hemiIntensity: 0.75
    },
    { // 10 - Electric Blue (levels 36-42)
        sky: [0.08, 0.15, 0.35],
        fog: [0.08, 0.15, 0.35],
        ground: [0.10, 0.18, 0.30],
        road: makeCheckerMat("wroad10", "#c0d8f8", "#d8eaff", 0.12),
        under: makeSolidMat("wunder10", "#04082a", 0),
        hemiIntensity: 0.72
    },
    { // 11 - Volcanic (levels 43-49)
        sky: [0.40, 0.12, 0.05],
        fog: [0.40, 0.12, 0.05],
        ground: [0.30, 0.12, 0.08],
        road: makeCheckerMat("wroad11", "#f0c8a0", "#f8d8b8", 0.12),
        under: makeSolidMat("wunder11", "#2a0a02", 0),
        hemiIntensity: 0.80
    },
    { // 12 - Desert (levels 50-56)
        sky: [0.75, 0.65, 0.45],
        fog: [0.75, 0.65, 0.45],
        ground: [0.55, 0.48, 0.35],
        road: makeCheckerMat("wroad12", "#f0e8d0", "#fff4e0", 0.12),
        under: makeSolidMat("wunder12", "#3a2a10", 0),
        hemiIntensity: 0.92
    },
    { // 13 - Steel (levels 57-63)
        sky: [0.30, 0.30, 0.32],
        fog: [0.30, 0.30, 0.32],
        ground: [0.28, 0.28, 0.30],
        road: makeCheckerMat("wroad13", "#d8d8e0", "#e8e8f0", 0.15),
        under: makeSolidMat("wunder13", "#1a1a20", 0),
        hemiIntensity: 0.78
    },
    { // 14 - Void (levels 64-70)
        sky: [0.10, 0.02, 0.18],
        fog: [0.10, 0.02, 0.18],
        ground: [0.12, 0.05, 0.18],
        road: makeCheckerMat("wroad14", "#d0b8f0", "#e0d0ff", 0.12),
        under: makeSolidMat("wunder14", "#08010a", 0),
        hemiIntensity: 0.68
    }
];

var currentWorldIndex = 0;

function applyWorldTheme(worldIndex) {
    if (worldIndex < 0 || worldIndex >= WORLD_THEMES.length) worldIndex = 0;
    currentWorldIndex = worldIndex;
    var theme = WORLD_THEMES[worldIndex];
    scene.clearColor = new BABYLON.Color4(theme.sky[0], theme.sky[1], theme.sky[2], 1);
    scene.fogColor = new BABYLON.Color3(theme.fog[0], theme.fog[1], theme.fog[2]);
    var gnd = scene.getMeshByName("ground");
    // Hide ground in level mode to see silhouettes below
    if (gnd) {
        gnd.isVisible = false;
        if (gnd.material) {
            gnd.material.diffuseColor = new BABYLON.Color3(theme.ground[0], theme.ground[1], theme.ground[2]);
        }
    }
    hemiLight.intensity = theme.hemiIntensity;
    // Save fog values for dark zone restore
    _savedFogStart = scene.fogStart;
    _savedFogEnd = scene.fogEnd;
    _savedHemiIntensity = theme.hemiIntensity;
}

// ===== WORLD DECORATIONS =====
var worldDecorations = [];

function cleanupWorldDecorations() {
    for (var i = 0; i < worldDecorations.length; i++) {
        var deco = worldDecorations[i];
        if (!deco) continue;
        // Dispose child meshes first (for TransformNode parents)
        if (deco.getChildMeshes) {
            deco.getChildMeshes().forEach(function(cm) {
                if (cm.material) cm.material.dispose();
                if (!cm.isDisposed()) cm.dispose();
            });
        }
        if (deco.material) deco.material.dispose();
        if (!deco.isDisposed()) deco.dispose();
    }
    worldDecorations = [];
}

// Silhouette configs per world: [r, g, b, emissiveScale]
// Colors are darker than fog for contrast — silhouettes emerge from mist
var WORLD_SILHOUETTES = [
    /* 0 Default */ { c1: [0.18, 0.22, 0.32], c2: [0.25, 0.30, 0.42], em: 0.55 },
    /* 1 Purple */ { c1: [0.20, 0.12, 0.35], c2: [0.28, 0.18, 0.45], em: 0.50 },
    /* 2 Orange */ { c1: [0.38, 0.25, 0.12], c2: [0.48, 0.32, 0.18], em: 0.55 },
    /* 3 Teal   */ { c1: [0.10, 0.28, 0.32], c2: [0.15, 0.36, 0.40], em: 0.50 },
    /* 4 Gold   */ { c1: [0.35, 0.32, 0.12], c2: [0.45, 0.40, 0.18], em: 0.60 },
    /* 5 Crimson*/ { c1: [0.28, 0.08, 0.08], c2: [0.38, 0.12, 0.12], em: 0.50 },
    /* 6 Emerald*/ { c1: [0.06, 0.22, 0.14], c2: [0.10, 0.30, 0.20], em: 0.50 },
    /* 7 Indigo */ { c1: [0.10, 0.08, 0.30], c2: [0.15, 0.12, 0.40], em: 0.48 },
    /* 8 Platinum*/{ c1: [0.40, 0.40, 0.44], c2: [0.52, 0.52, 0.56], em: 0.60 },
    /* 9 Magenta */{ c1: [0.28, 0.08, 0.28], c2: [0.38, 0.12, 0.38], em: 0.52 },
    /* 10 Elec Blue */{ c1: [0.04, 0.08, 0.22], c2: [0.08, 0.14, 0.30], em: 0.50 },
    /* 11 Volcanic */{ c1: [0.25, 0.06, 0.02], c2: [0.35, 0.10, 0.04], em: 0.55 },
    /* 12 Desert  */{ c1: [0.40, 0.35, 0.22], c2: [0.50, 0.44, 0.30], em: 0.58 },
    /* 13 Steel   */{ c1: [0.18, 0.18, 0.20], c2: [0.26, 0.26, 0.28], em: 0.52 },
    /* 14 Void    */{ c1: [0.08, 0.01, 0.14], c2: [0.14, 0.04, 0.22], em: 0.48 }
];

function _silMat(name, col, em) {
    var m = new BABYLON.StandardMaterial(name, scene);
    m.diffuseColor = new BABYLON.Color3(col[0], col[1], col[2]);
    m.specularColor = BABYLON.Color3.Black();
    m.disableLighting = true;
    m.emissiveColor = m.diffuseColor.scale(em);
    return m;
}

function buildWorldDecorations(worldIndex) {
    cleanupWorldDecorations();
    if (worldIndex < 0 || worldIndex >= WORLD_SILHOUETTES.length) worldIndex = 0;
    var sil = WORLD_SILHOUETTES[worldIndex];
    var mat1 = _silMat("silA_" + worldIndex, sil.c1, sil.em);
    var mat2 = _silMat("silB_" + worldIndex, sil.c2, sil.em);

    // Silhouettes are placed BELOW the road (negative Y) — we're on a sky highway looking down
    // Camera is ~14 units above road, road is at Y≈0
    // City gets more buildings for dense skyline, other worlds get fewer
    var count = (worldIndex === 0) ? 70 : 50;

    for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        var dist = 15 + Math.random() * 40;
        var mat = i % 2 === 0 ? mat1 : mat2;
        var mesh, h, w, d;
        var baseY; // how far below road

        // Building silhouettes below the road
        mesh = new BABYLON.TransformNode("sil_" + i, scene);
        w = 3 + Math.random() * 7;
        h = 15 + Math.random() * 45;
        d = 3 + Math.random() * 7;
        var mainB = BABYLON.MeshBuilder.CreateBox("sb_" + i, { width: w, height: h, depth: d }, scene);
        mainB.parent = mesh; mainB.material = mat;
        if (Math.random() > 0.3) {
            var rw = w * (0.3 + Math.random() * 0.3);
            var rh = 2 + Math.random() * 5;
            var rooftop = BABYLON.MeshBuilder.CreateBox("sr_" + i, { width: rw, height: rh, depth: rw }, scene);
            rooftop.parent = mesh; rooftop.position.y = h / 2 + rh / 2; rooftop.material = mat2;
        }
        if (h > 35 && Math.random() > 0.4) {
            var ah = 3 + Math.random() * 6;
            var antenna = BABYLON.MeshBuilder.CreateCylinder("sa_" + i, { diameterTop: 0.05, diameterBottom: 0.2, height: ah, tessellation: 4 }, scene);
            antenna.parent = mesh; antenna.position.y = h / 2 + ah / 2 + 1; antenna.material = mat2;
        }
        if (Math.random() > 0.4) {
            var nw = 2 + Math.random() * 4;
            var nh = 8 + Math.random() * 20;
            var nd = 2 + Math.random() * 4;
            var neighbor = BABYLON.MeshBuilder.CreateBox("sn_" + i, { width: nw, height: nh, depth: nd }, scene);
            neighbor.parent = mesh;
            neighbor.position.x = (Math.random() > 0.5 ? 1 : -1) * (w / 2 + nw / 2 + 0.5);
            neighbor.position.y = (nh - h) / 2;
            neighbor.material = i % 3 === 0 ? mat1 : mat2;
        }
        baseY = -8 - Math.random() * 15 - h / 2;

        mesh._decoAngle = angle;
        mesh._decoDist = dist;
        mesh._decoBaseY = baseY;
        worldDecorations.push(mesh);
    }
    updateDecorationPositions(0, 0);
}

function updateDecorationPositions(cx, cz) {
    for (var i = 0; i < worldDecorations.length; i++) {
        var m = worldDecorations[i];
        if (!m || m.isDisposed()) continue;
        m.position.x = cx + Math.cos(m._decoAngle) * m._decoDist;
        m.position.z = cz + Math.sin(m._decoAngle) * m._decoDist;
        // Place silhouettes BELOW the road — they're a city/landscape far below
        m.position.y = m._decoBaseY || -25;
    }
}

var tireMarkMat = new BABYLON.StandardMaterial("tireMarkMat", scene);
tireMarkMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
tireMarkMat.specularColor = new BABYLON.Color3(0, 0, 0);

var goldMat = new BABYLON.StandardMaterial("goldMat", scene);
goldMat.diffuseColor = new BABYLON.Color3(1, 0.84, 0);
goldMat.specularColor = new BABYLON.Color3(1, 0.9, 0.5);
goldMat.emissiveColor = new BABYLON.Color3(0.4, 0.28, 0);

var powerUpMats = {};
POWERUP_TYPES.forEach(function(p) {
    var mat = new BABYLON.StandardMaterial("puMat_" + p.id, scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString(p.color);
    mat.emissiveColor = BABYLON.Color3.FromHexString(p.emissive);
    mat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    mat.alpha = 0.85;
    powerUpMats[p.id] = mat;
});

// ===== TERRAIN HEIGHT =====
function getElevationAtSegment(elevation, segIndex) {
    if (!elevation || elevation.length === 0) return 0;
    if (segIndex <= elevation[0][0]) return elevation[0][1];
    if (segIndex >= elevation[elevation.length - 1][0]) return elevation[elevation.length - 1][1];
    for (var i = 0; i < elevation.length - 1; i++) {
        if (segIndex >= elevation[i][0] && segIndex <= elevation[i + 1][0]) {
            var t = (segIndex - elevation[i][0]) / (elevation[i + 1][0] - elevation[i][0]);
            return elevation[i][1] + (elevation[i + 1][1] - elevation[i][1]) * t;
        }
    }
    return 0;
}

var _lastRoadElevation = 0;

function getSegmentRampHeight(seg, x, z) {
    if (!seg) return 0;
    var progress;
    if (seg.dir === "z") progress = (z - seg.startZ) / seg.length;
    else progress = (x - seg.startX) / seg.length;
    progress = Math.max(0, Math.min(1, progress));
    // Elevation
    var el = 0;
    if (seg.baseY !== undefined) {
        el = seg.baseY + ((seg.endY || 0) - seg.baseY) * progress;
    }
    // Ramp
    if (!seg.ramp) return el;
    if (progress < seg.ramp.start || progress > seg.ramp.end) return el;
    var t = (progress - seg.ramp.start) / (seg.ramp.end - seg.ramp.start);
    return el + Math.sin(t * Math.PI) * seg.ramp.height;
}

function getWorldHeight(x, z) {
    for (var i = 0; i < segments.length; i++) {
        var b = segments[i].bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
            return getSegmentRampHeight(segments[i], x, z);
        }
    }
    return 0;
}

// ===== ROAD SYSTEM =====
var CHECKER_TILE = 1.25;

function createTerrainGround(name, w, h, cx, cz, subdivs, worldUV, heightFn) {
    var mesh = BABYLON.MeshBuilder.CreateGround(name, { width: w, height: h, subdivisions: subdivs }, scene);
    mesh.position = new BABYLON.Vector3(cx, 0, cz);
    var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var uvs = worldUV ? mesh.getVerticesData(BABYLON.VertexBuffer.UVKind) : null;
    for (var i = 0; i < positions.length; i += 3) {
        var worldX = positions[i] + cx;
        var worldZ = positions[i + 2] + cz;
        positions[i + 1] = heightFn ? heightFn(worldX, worldZ) : 0;
        if (uvs) {
            var uvIdx = (i / 3) * 2;
            uvs[uvIdx] = worldX / CHECKER_TILE;
            uvs[uvIdx + 1] = worldZ / CHECKER_TILE;
        }
    }
    mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    if (uvs) mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
    var indices = mesh.getIndices();
    var normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    return mesh;
}

function createPowerUpMesh(type, x, y, z) {
    var sphere = BABYLON.MeshBuilder.CreateSphere("pu_" + type.id + "_" + Math.random(), { diameter: 1.2, segments: 12 }, scene);
    sphere.position = new BABYLON.Vector3(x, y + 1.0, z);
    sphere.material = powerUpMats[type.id];
    var ring = BABYLON.MeshBuilder.CreateTorus("puRing_" + Math.random(), { diameter: 1.6, thickness: 0.08, tessellation: 24 }, scene);
    ring.parent = sphere;
    ring.position.y = 0;
    var ringMat = new BABYLON.StandardMaterial("ringMat_" + Math.random(), scene);
    ringMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    ringMat.emissiveColor = BABYLON.Color3.FromHexString(type.color);
    ringMat.alpha = 0.6;
    ring.material = ringMat;
    sphere._puType = type;
    sphere._collected = false;
    sphere._baseY = y + 1.0;
    sphere._phase = Math.random() * Math.PI * 2;
    sphere._ring = ring;
    shadowGen.addShadowCaster(sphere);
    return sphere;
}

function createSegment(index, startX, startZ) {
    var dir = index % 2 === 0 ? "z" : "x";
    var W = CONFIG.ROAD_WIDTH;
    var L;
    if (index === 0) L = CONFIG.SEGMENT_LENGTH * 1.5;
    else {
        var r = gameRandom();
        if (r < 0.2) L = CONFIG.SEGMENT_LENGTH * 0.6;
        else if (r < 0.7) L = CONFIG.SEGMENT_LENGTH;
        else if (r < 0.9) L = CONFIG.SEGMENT_LENGTH * 1.5;
        else L = CONFIG.SEGMENT_LENGTH * 2.0;
    }

    var meshes = [];
    var theme;
    if (levelMode && currentLevelConfig) {
        var wi = currentLevelConfig.worldIndex;
        if (wi >= 0 && wi < WORLD_THEMES.length) theme = WORLD_THEMES[wi];
        else theme = ROAD_THEMES[0];
    } else {
        var themeIdx = Math.floor(index / THEME_CHANGE_INTERVAL) % ROAD_THEMES.length;
        theme = ROAD_THEMES[themeIdx];
    }

    var gndW, gndH, cx, cz, bounds;
    if (dir === "z") {
        gndW = W; gndH = L; cx = startX; cz = startZ + L / 2;
        bounds = { minX: startX - W / 2, maxX: startX + W / 2, minZ: startZ - W / 2, maxZ: startZ + L + W / 2 };
    } else {
        gndW = L; gndH = W; cx = startX + L / 2; cz = startZ;
        bounds = { minX: startX - W / 2, maxX: startX + L + W / 2, minZ: startZ - W / 2, maxZ: startZ + W / 2 };
    }

    var ramp = null;
    if (index > 2 && gameRandom() < CONFIG.RAMP_CHANCE) {
        var rStart = 0.2 + gameRandom() * 0.2;
        var rLen = 0.25 + gameRandom() * 0.15;
        ramp = { start: rStart, end: Math.min(rStart + rLen, 0.75), height: CONFIG.RAMP_HEIGHT * (0.7 + gameRandom() * 0.3) };
    }

    // Elevation
    var elev = (levelMode && currentLevelConfig) ? currentLevelConfig.elevation : null;
    var segBaseY = getElevationAtSegment(elev, index);
    var segEndY = getElevationAtSegment(elev, index + 1);

    var segHeightFn = (ramp || segBaseY !== 0 || segEndY !== 0) ? function(wx, wz) {
        var progress;
        if (dir === "z") progress = (wz - startZ) / L; else progress = (wx - startX) / L;
        progress = Math.max(0, Math.min(1, progress));
        var el = segBaseY + (segEndY - segBaseY) * progress;
        if (!ramp) return el;
        if (progress < ramp.start || progress > ramp.end) return el;
        var t = (progress - ramp.start) / (ramp.end - ramp.start);
        return el + Math.sin(t * Math.PI) * ramp.height;
    } : null;

    // Junction
    if (index > 0) {
        var junc = createTerrainGround("junc_" + index, W, W, startX, startZ, 4, true, null);
        junc.position.y = segBaseY + 0.005;
        junc.material = theme.road;
        junc.receiveShadows = true;
        meshes.push(junc);
        var juncSlab = BABYLON.MeshBuilder.CreateBox("juncSlab_" + index, { width: W + 0.02, height: 0.5, depth: W + 0.02 }, scene);
        juncSlab.position = new BABYLON.Vector3(startX, segBaseY - 0.3, startZ);
        juncSlab.material = theme.under;
        meshes.push(juncSlab);
    }

    // Road surface
    var road = createTerrainGround("road_" + index, gndW, gndH, cx, cz, 20, true, segHeightFn);
    road.material = theme.road;
    road.receiveShadows = true;
    meshes.push(road);

    // Slab
    var segMidY = (segBaseY + segEndY) / 2;
    var slab = BABYLON.MeshBuilder.CreateBox("slab_" + index, { width: gndW + 0.02, height: 0.5, depth: gndH + 0.02 }, scene);
    slab.position = new BABYLON.Vector3(cx, segMidY - 0.3, cz);
    slab.material = theme.under;
    meshes.push(slab);

    // Coins
    var segCoins = [];
    var coinChance = levelMode && currentLevelConfig ? currentLevelConfig.coinDensity : 0.5;
    if (index > 0 && gameRandom() < coinChance) {
        var cnt = 1 + Math.floor(gameRandom() * 3);
        for (var c = 0; c < cnt; c++) {
            var frac = 0.15 + (c / Math.max(cnt, 1)) * 0.65;
            var ccx, ccz;
            if (dir === "z") { ccx = startX + (gameRandom() - 0.5) * W * 0.4; ccz = startZ + L * frac; }
            else { ccx = startX + L * frac; ccz = startZ + (gameRandom() - 0.5) * W * 0.4; }
            var coinY = segHeightFn ? segHeightFn(ccx, ccz) : 0;
            var coinMesh = BABYLON.MeshBuilder.CreateCylinder("coin_" + index + "_" + c, { diameter: 0.7, height: 0.1, tessellation: 20 }, scene);
            coinMesh.position = new BABYLON.Vector3(ccx, 0.8 + coinY, ccz);
            coinMesh.rotation.z = Math.PI / 2;
            coinMesh.material = goldMat;
            coinMesh._collected = false;
            coinMesh._baseY = 0.8 + coinY;
            coinMesh._phase = gameRandom() * Math.PI * 2;
            shadowGen.addShadowCaster(coinMesh);
            meshes.push(coinMesh);
            segCoins.push(coinMesh);
        }
    }

    // Power-ups
    var segPowerUps = [];
    var puChance = (levelMode && currentLevelConfig) ? currentLevelConfig.powerUpChance : 0.15;
    if (index > 3 && gameRandom() < puChance) {
        var type = POWERUP_TYPES[Math.floor(gameRandom() * POWERUP_TYPES.length)];
        var pfrac = 0.3 + gameRandom() * 0.4;
        var px, pz;
        if (dir === "z") { px = startX + (gameRandom() - 0.5) * W * 0.3; pz = startZ + L * pfrac; }
        else { px = startX + L * pfrac; pz = startZ + (gameRandom() - 0.5) * W * 0.3; }
        var py = segHeightFn ? segHeightFn(px, pz) : 0;
        var puMesh = createPowerUpMesh(type, px, py, pz);
        meshes.push(puMesh);
        segPowerUps.push(puMesh);
    }

    var seg = { dir: dir, startX: startX, startZ: startZ, index: index, meshes: meshes, bounds: bounds, length: L, coins: segCoins, powerUps: segPowerUps, ramp: ramp, obstacles: [], baseY: segBaseY, endY: segEndY };

    // Spawn obstacles
    var obsMeshes = spawnObstacleForSegment(seg);
    if (obsMeshes.length > 0) {
        seg.obstacles = obsMeshes;
        for (var oi = 0; oi < obsMeshes.length; oi++) {
            seg.meshes.push(obsMeshes[oi]);
        }
    }

    // Offset obstacle Y for elevation
    if (segBaseY !== 0 || segEndY !== 0) {
        seg.obstacles.forEach(function(obs) {
            obs.position.y += segBaseY;
        });
    }

    // Zone overlays
    if (levelMode && currentLevelConfig && currentLevelConfig.zones) {
        var zones = currentLevelConfig.zones;
        for (var zi = 0; zi < zones.length; zi++) {
            var zone = zones[zi];
            if (index >= zone.from && index < zone.to) {
                seg._zoneType = zone.type;
                if (zone.type === "ice") {
                    var iceOv = createIceOverlay(seg, W);
                    seg._iceOverlay = iceOv;
                    seg.meshes.push(iceOv);
                } else if (zone.type === "crumble") {
                    var crOv = createCrumbleOverlay(seg, W);
                    seg._crumbleOverlay = crOv;
                    seg.meshes.push(crOv);
                    seg._crumbleActive = true;
                    seg._crumbleTriggered = false;
                    seg._crumbleFalling = false;
                    seg._crumbleTimer = 1.5;
                } else if (zone.type === "wind") {
                    var windPS = createWindParticles(seg, W, zone.dir || "left");
                    seg._windParticles = windPS;
                    _zoneWindParticles.push(windPS);
                }
                // dark and rocks have no per-segment overlay — they're runtime effects
            }
        }
    }

    segments.push(seg);
    return seg;
}

function removeSegment(seg) {
    // Dispose particle systems on obstacles (keep shared textures alive)
    if (seg.obstacles) {
        seg.obstacles.forEach(function(obs) {
            if (obs._sparks) { obs._sparks.stop(); obs._sparks.dispose(false); obs._sparks = null; }
            if (obs._flames) { obs._flames.stop(); obs._flames.dispose(false); obs._flames = null; }
            if (obs._dust) { obs._dust.stop(); obs._dust.dispose(false); obs._dust = null; }
            if (obs._impact) { obs._impact.stop(); obs._impact.dispose(false); obs._impact = null; }
        });
    }
    // Dispose zone overlays
    if (seg._iceOverlay && seg._iceOverlay._iceSparkles) {
        seg._iceOverlay._iceSparkles.stop(); seg._iceOverlay._iceSparkles.dispose(false);
    }
    if (seg._windParticles) {
        seg._windParticles.stop(); seg._windParticles.dispose(false);
        var wpIdx = _zoneWindParticles.indexOf(seg._windParticles);
        if (wpIdx !== -1) _zoneWindParticles.splice(wpIdx, 1);
        seg._windParticles = null;
    }
    seg.meshes.forEach(function(m) {
        if (m._sparks) { m._sparks.stop(); m._sparks.dispose(false); m._sparks = null; }
        if (m._flames) { m._flames.stop(); m._flames.dispose(false); m._flames = null; }
        if (m._dust) { m._dust.stop(); m._dust.dispose(false); m._dust = null; }
        if (m._impact) { m._impact.stop(); m._impact.dispose(false); m._impact = null; }
        if (m.getChildMeshes) {
            m.getChildMeshes().forEach(function(c) {
                if (c.material) c.material.dispose();
                if (!c.isDisposed()) c.dispose();
            });
        }
        if (!m.isDisposed()) m.dispose();
    });
    var idx = segments.indexOf(seg);
    if (idx !== -1) segments.splice(idx, 1);
}

function generateInitialRoad() {
    nextSegStartX = 0; nextSegStartZ = 0; nextSegIndex = 0;
    if (levelMode && currentLevelConfig) {
        // Init seeded RNG
        levelRandom = seededRNG(currentLevelConfig.seed);
        levelCoinsTotal = 0;
        // Generate ALL segments upfront
        for (var i = 0; i < currentLevelConfig.segmentCount; i++) {
            var seg = addNextSegment();
            // Count coins
            levelCoinsTotal += seg.coins.length;
        }
        // Build finish line at last segment
        var lastSeg = segments[segments.length - 1];
        if (lastSeg) buildFinishLine(lastSeg);
    } else {
        levelRandom = null;
        for (var j = 0; j < CONFIG.SEGMENTS_AHEAD; j++) addNextSegment();
    }
}

function addNextSegment() {
    var seg = createSegment(nextSegIndex, nextSegStartX, nextSegStartZ);
    if (seg.dir === "z") nextSegStartZ += seg.length; else nextSegStartX += seg.length;
    nextSegIndex++;
    return seg;
}

function updateRoad() {
    if (levelMode) {
        // In level mode, don't generate new segments (all created upfront)
        // Only clean up far behind
        var removeThreshold = currentSegmentIndex - CONFIG.SEGMENTS_BEHIND;
        for (var i = segments.length - 1; i >= 0; i--) {
            if (segments[i].index < removeThreshold) removeSegment(segments[i]);
        }
    } else {
        while (nextSegIndex < currentSegmentIndex + CONFIG.SEGMENTS_AHEAD) addNextSegment();
        var removeThreshold2 = currentSegmentIndex - CONFIG.SEGMENTS_BEHIND;
        for (var j = segments.length - 1; j >= 0; j--) {
            if (segments[j].index < removeThreshold2) removeSegment(segments[j]);
        }
    }
}

// ===== START GATE =====
var gateMeshes = [];
function buildStartGate() {
    var gateMat = new BABYLON.StandardMaterial("gateMat", scene);
    gateMat.diffuseColor = new BABYLON.Color3(0.6, 0.85, 0.95);
    gateMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    var poleL = BABYLON.MeshBuilder.CreateBox("poleL", { width: 0.3, height: 5, depth: 0.3 }, scene);
    poleL.position = new BABYLON.Vector3(-CONFIG.ROAD_WIDTH / 2 + 0.2, 2.5, 1);
    poleL.material = gateMat; shadowGen.addShadowCaster(poleL);
    var poleR = BABYLON.MeshBuilder.CreateBox("poleR", { width: 0.3, height: 5, depth: 0.3 }, scene);
    poleR.position = new BABYLON.Vector3(CONFIG.ROAD_WIDTH / 2 - 0.2, 2.5, 1);
    poleR.material = gateMat; shadowGen.addShadowCaster(poleR);
    var topBar = BABYLON.MeshBuilder.CreateBox("topBar", { width: CONFIG.ROAD_WIDTH, height: 1.2, depth: 0.5 }, scene);
    topBar.position = new BABYLON.Vector3(0, 5.2, 1);
    topBar.material = gateMat; shadowGen.addShadowCaster(topBar);
    var textPlane = BABYLON.MeshBuilder.CreatePlane("startText", { width: 3.5, height: 0.9 }, scene);
    textPlane.position = new BABYLON.Vector3(0, 5.25, 0.73);
    var textMat = new BABYLON.StandardMaterial("textMat", scene);
    var textTex = new BABYLON.DynamicTexture("textTex", { width: 512, height: 128 }, scene);
    textTex.hasAlpha = true;
    var ctx = textTex.getContext();
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "bold 80px Arial"; ctx.fillStyle = "#c0392b";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(T("start_text"), 256, 64);
    textTex.update();
    textMat.diffuseTexture = textTex;
    textMat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
    textMat.useAlphaFromDiffuseTexture = true;
    textMat.backFaceCulling = false;
    textPlane.material = textMat;
    gateMeshes = [poleL, poleR, topBar, textPlane];
}

// ===== CAR BUILDER (shared) =====
function destroyCurrentCar() {
    if (carMesh) {
        carMesh.getChildMeshes().forEach(function(m) { if (!m.isDisposed()) m.dispose(); });
        carMesh.getChildTransformNodes().forEach(function(t) { if (!t.isDisposed()) t.dispose(); });
        carMesh.dispose();
        carMesh = null;
    }
}

function buildCarWithConfig(carConfig) {
    console.log("[buildCar]", carConfig.id, "| model:", carConfig.model, "| hasContainer:", !!carModelContainers[carConfig.id]);
    if (carConfig.model && carModelContainers[carConfig.id]) {
        buildCarFromGLB(carConfig);
    } else {
        console.warn("[buildCar] FALLBACK to boxes for:", carConfig.id);
        buildCarFromBoxes(carConfig);
    }
}

function buildCarFromGLB(carConfig) {
    var container = carModelContainers[carConfig.id];
    console.log("[GLB] Building:", carConfig.id, "← " + carConfig.model, "| container meshes:", container.meshes.length, "| totalVerts:", container.meshes.reduce(function(s, m) { return s + m.getTotalVertices(); }, 0));
    var instanceId = Date.now();
    var result = container.instantiateModelsToScene(function(name) { return name + "_i" + instanceId; });

    var car = new BABYLON.TransformNode("car", scene);

    // Inner node for model adjustments (scale, rotation)
    var modelRoot = new BABYLON.TransformNode("modelRoot", scene);
    modelRoot.parent = car;

    var s = carConfig.modelScale || 1;
    modelRoot.scaling = new BABYLON.Vector3(s, s, s);
    if (carConfig.modelRotY) modelRoot.rotation.y = carConfig.modelRotY;

    result.rootNodes.forEach(function(node) {
        node.parent = modelRoot;
    });

    // Auto-align: place model so wheels touch ground
    // Force world matrix update for entire hierarchy
    car.position = new BABYLON.Vector3(0, 0, 0);
    scene.updateTransformMatrix(true);
    car.getChildMeshes().forEach(function(m) { m.refreshBoundingInfo(); m.computeWorldMatrix(true); });
    var bounds = car.getHierarchyBoundingVectors(true);
    console.log("[GLB] bounds minY:", bounds.min.y, "maxY:", bounds.max.y);
    car.getChildMeshes().forEach(function(m) { console.log("[GLB] mesh:", m.name, "vertices:", m.getTotalVertices()); });

    // Shift model so wheels touch road (push slightly into surface for visual contact)
    modelRoot.position.y -= bounds.min.y + 0.55;

    // Convert PBR materials to bright cartoon/toon style
    car.getChildMeshes().forEach(function(m) {
        shadowGen.addShadowCaster(m);
        if (m.material && m.material.getClassName() === "PBRMaterial") {
            var pbr = m.material;
            var std = new BABYLON.StandardMaterial(pbr.name + "_toon", scene);
            // Transfer texture
            if (pbr.albedoTexture) std.diffuseTexture = pbr.albedoTexture;
            // Transfer base color
            var col = pbr.albedoColor ? pbr.albedoColor.clone() : new BABYLON.Color3(0.8, 0.8, 0.8);
            std.diffuseColor = col;
            // Emissive fill - eliminates dark areas for cartoon look
            std.emissiveColor = col.scale(0.3);
            // Matte cartoon finish
            std.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
            std.specularPower = 16;
            m.material = std;
        }
    });

    car.position = new BABYLON.Vector3(0, 0.5, 2);
    car.rotation.y = 0;
    carMesh = car;
}

function buildCarFromBoxes(carConfig) {
    var bodyColor = BABYLON.Color3.FromHexString(carConfig.bodyColor);
    var cabinColor = BABYLON.Color3.FromHexString(carConfig.cabinColor);

    var body = BABYLON.MeshBuilder.CreateBox("carBody", { width: 1.8, height: 0.6, depth: 2.8 }, scene);
    var bodyMat = new BABYLON.StandardMaterial("bodyMat", scene);
    bodyMat.diffuseColor = bodyColor;
    bodyMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    body.material = bodyMat;

    var cabin = BABYLON.MeshBuilder.CreateBox("carCabin", { width: 1.5, height: 0.55, depth: 1.6 }, scene);
    cabin.position.y = 0.55; cabin.position.z = -0.15;
    var cabinMat = new BABYLON.StandardMaterial("cabinMat", scene);
    cabinMat.diffuseColor = cabinColor;
    cabinMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    cabin.material = cabinMat;

    var glassMat = new BABYLON.StandardMaterial("glassMat", scene);
    glassMat.diffuseColor = new BABYLON.Color3(0.7, 0.85, 0.95);
    glassMat.alpha = 0.5;
    glassMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    var windshield = BABYLON.MeshBuilder.CreateBox("windshield", { width: 1.3, height: 0.4, depth: 0.05 }, scene);
    windshield.position = new BABYLON.Vector3(0, 0.55, 0.6);
    windshield.material = glassMat;

    var rearWindow = BABYLON.MeshBuilder.CreateBox("rearWin", { width: 1.3, height: 0.35, depth: 0.05 }, scene);
    rearWindow.position = new BABYLON.Vector3(0, 0.55, -0.8);
    rearWindow.material = glassMat;

    var hlMat = new BABYLON.StandardMaterial("hlMat", scene);
    hlMat.diffuseColor = new BABYLON.Color3(1, 1, 0.85);
    hlMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.2);
    var hlL = BABYLON.MeshBuilder.CreateBox("hlL", { width: 0.3, height: 0.2, depth: 0.1 }, scene);
    hlL.position = new BABYLON.Vector3(-0.55, 0, 1.45); hlL.material = hlMat;
    var hlR = BABYLON.MeshBuilder.CreateBox("hlR", { width: 0.3, height: 0.2, depth: 0.1 }, scene);
    hlR.position = new BABYLON.Vector3(0.55, 0, 1.45); hlR.material = hlMat;

    var tlMat = new BABYLON.StandardMaterial("tlMat", scene);
    tlMat.diffuseColor = new BABYLON.Color3(0.9, 0.15, 0.1);
    tlMat.emissiveColor = new BABYLON.Color3(0.3, 0.02, 0.02);
    var tlL = BABYLON.MeshBuilder.CreateBox("tlL", { width: 0.25, height: 0.15, depth: 0.1 }, scene);
    tlL.position = new BABYLON.Vector3(-0.6, 0, -1.4); tlL.material = tlMat;
    var tlR = BABYLON.MeshBuilder.CreateBox("tlR", { width: 0.25, height: 0.15, depth: 0.1 }, scene);
    tlR.position = new BABYLON.Vector3(0.6, 0, -1.4); tlR.material = tlMat;

    var wheelMat = new BABYLON.StandardMaterial("wheelMat", scene);
    wheelMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    var wheelPositions = [[-0.9, -0.2, 0.85], [0.9, -0.2, 0.85], [-0.9, -0.2, -0.85], [0.9, -0.2, -0.85]];
    var wheels = wheelPositions.map(function(pos, i) {
        var wheel = BABYLON.MeshBuilder.CreateCylinder("wheel_" + i, { diameter: 0.5, height: 0.25 }, scene);
        wheel.rotation.z = Math.PI / 2;
        wheel.position = new BABYLON.Vector3(pos[0], pos[1], pos[2]);
        wheel.material = wheelMat;
        return wheel;
    });

    var whiteMat = new BABYLON.StandardMaterial("whiteMat", scene);
    whiteMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    whiteMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    var rs1 = BABYLON.MeshBuilder.CreateBox("rs1", { width: 1.3, height: 0.02, depth: 0.15 }, scene);
    rs1.position = new BABYLON.Vector3(0, 0.84, 0); rs1.material = whiteMat;
    var rs2 = rs1.clone("rs2"); rs2.position.z = 0.25;
    var rs3 = rs1.clone("rs3"); rs3.position.z = -0.25;

    var car = new BABYLON.TransformNode("car", scene);
    [body, cabin, windshield, rearWindow, hlL, hlR, tlL, tlR, rs1, rs2, rs3].concat(wheels).forEach(function(m) {
        m.parent = car;
        shadowGen.addShadowCaster(m);
    });

    car.position = new BABYLON.Vector3(0, 0.5, 2);
    car.rotation.y = 0;
    carMesh = car;
}

// ===== SHIELD VISUAL =====
function createShieldBubble() {
    if (shieldMesh) { shieldMesh.dispose(); shieldMesh = null; }
    shieldMesh = BABYLON.MeshBuilder.CreateSphere("shieldBubble", { diameter: 4.0, segments: 16 }, scene);
    shieldMesh.parent = carMesh;
    shieldMesh.position.y = 0.3;
    var mat = new BABYLON.StandardMaterial("shieldBubbleMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.3, 0.75, 1);
    mat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
    mat.alpha = 0.2;
    mat.specularColor = new BABYLON.Color3(1, 1, 1);
    mat.backFaceCulling = false;
    shieldMesh.material = mat;
}

function removeShieldBubble() {
    if (shieldMesh) {
        gsap.to(shieldMesh.material, {
            alpha: 0, duration: 0.3,
            onComplete: function() { if (shieldMesh) { shieldMesh.dispose(); shieldMesh = null; } }
        });
    }
}

// ===== GROUND =====
function buildGround() {
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 300, height: 300 }, scene);
    ground.position.y = -1.1;
    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.88, 0.68, 0.32);
    groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    ground.material = groundMat;
}

// ===== CITY =====
var cityBuildings = [];
function buildCitySkyline() {
    var silFar = new BABYLON.StandardMaterial("silFar", scene);
    silFar.diffuseColor = new BABYLON.Color3(0.45, 0.3, 0.15);
    silFar.specularColor = new BABYLON.Color3(0, 0, 0);
    silFar.emissiveColor = new BABYLON.Color3(0.18, 0.12, 0.06);
    silFar.disableLighting = true;
    var silMid = new BABYLON.StandardMaterial("silMid", scene);
    silMid.diffuseColor = new BABYLON.Color3(0.52, 0.36, 0.18);
    silMid.specularColor = new BABYLON.Color3(0, 0, 0);
    silMid.emissiveColor = new BABYLON.Color3(0.22, 0.15, 0.08);
    silMid.disableLighting = true;

    for (var i = 0; i < 40; i++) {
        var w = 3 + Math.random() * 6;
        var h = 8 + Math.random() * 30;
        var d = 3 + Math.random() * 6;
        var building = BABYLON.MeshBuilder.CreateBox("bld_" + i, { width: w, height: h, depth: d }, scene);
        building.material = i % 3 === 0 ? silMid : silFar;
        building._bldHeight = h;
        building._bldAngle = (i / 40) * Math.PI * 2;
        building._bldDist = 55 + Math.random() * 25;
        cityBuildings.push(building);
    }
    updateCityPositions(0, 0);
}

function updateCityPositions(cx, cz) {
    for (var i = 0; i < cityBuildings.length; i++) {
        var b = cityBuildings[i];
        b.position.x = cx + Math.cos(b._bldAngle) * b._bldDist;
        b.position.z = cz + Math.sin(b._bldAngle) * b._bldDist;
        b.position.y = b._bldHeight / 2 - 1.1;
    }
}

// ===== SMOKE =====
function setupSmoke() {
    smokeSystem = new BABYLON.ParticleSystem("smoke", 300, scene);
    if (!smokeTexture) {
        smokeTexture = new BABYLON.DynamicTexture("smokeTex", 64, scene);
        var sctx = smokeTexture.getContext();
        var grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.4, "rgba(255,255,255,0.5)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 64, 64);
        smokeTexture.update();
    }
    smokeSystem.particleTexture = smokeTexture;
    smokeSystem.emitter = new BABYLON.Vector3(0, 0.2, 0);
    smokeSystem.minSize = 0.3; smokeSystem.maxSize = 0.8;
    smokeSystem.minLifeTime = 0.2; smokeSystem.maxLifeTime = 0.6;
    smokeSystem.emitRate = 0;
    smokeSystem.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
    smokeSystem.direction2 = new BABYLON.Vector3(0.5, 2.0, 0.5);
    smokeSystem.minEmitPower = 0.5; smokeSystem.maxEmitPower = 1.5;
    smokeSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.6);
    smokeSystem.color2 = new BABYLON.Color4(0.9, 0.9, 0.9, 0.35);
    smokeSystem.colorDead = new BABYLON.Color4(0.85, 0.85, 0.85, 0);
    smokeSystem.gravity = new BABYLON.Vector3(0, 1.5, 0);
    smokeSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    smokeSystem.start();
}

// ===== TIRE MARKS =====
var tireMarkTemplate = BABYLON.MeshBuilder.CreateBox("tmTemplate", { width: 0.28, height: 0.01, depth: 0.5 }, scene);
tireMarkTemplate.material = tireMarkMat;
tireMarkTemplate.isVisible = false;

function isOnRoadForMarks(x, z) {
    for (var i = 0; i < segments.length; i++) {
        var b = segments[i].bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return true;
    }
    return false;
}

function addTireMark(x, z, heading) {
    if (!isOnRoadForMarks(x, z)) return;
    var mark = tireMarkTemplate.createInstance("tm_" + tireMarks.length);
    mark.position = new BABYLON.Vector3(x, getWorldHeight(x, z) + 0.03, z);
    mark.rotation.y = heading;
    mark._birthTime = performance.now() / 1000;
    tireMarks.push(mark);
    while (tireMarks.length > CONFIG.MAX_TIRE_MARKS) { tireMarks.shift().dispose(); }
}

function updateTireMarks() {
    var now = performance.now() / 1000;
    for (var i = tireMarks.length - 1; i >= 0; i--) {
        var age = now - tireMarks[i]._birthTime;
        if (age > 5.5) { tireMarks[i].dispose(); tireMarks.splice(i, 1); }
        else if (age > 4.0) { var s = 1 - (age - 4.0) / 1.5; tireMarks[i].scaling.x = s; tireMarks[i].scaling.z = s; }
    }
}

// ===== COIN SYSTEM =====
function collectCoin(mesh) {
    if (mesh._collected) return;
    mesh._collected = true;
    var val = hasPowerUp("x2") ? 2 : 1;
    sessionCoins += val;
    if (levelMode) levelCoinsCollected++;
    coinCount.textContent = sessionCoins;
    console.log("[coin] collected! sessionCoins:", sessionCoins);
    playCoinSound();
    var sy = mesh.position.y;
    gsap.to(mesh.scaling, { x: 1.25, y: 1.25, z: 1.25, duration: 0.1, ease: "power2.out", onComplete: function() {
        gsap.to(mesh.scaling, { x: 0, y: 0, z: 0, duration: 0.2, ease: "back.in(3)", onComplete: function() { mesh.isVisible = false; } });
    }});
    gsap.to(mesh.position, { y: sy + 1.5, duration: 0.32, ease: "power2.out" });
    gsap.fromTo(".coin-display", { scale: 1.25 }, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.3)" });
    if (val > 1) showFloatingText("+2", "#ffd54f");
}

// ===== POWER-UPS =====
function hasPowerUp(id) { return activePowerUps.some(function(p) { return p.id === id; }); }

function collectPowerUp(puMesh) {
    if (puMesh._collected) return;
    puMesh._collected = true;
    playPowerUpSound();
    gsap.to(puMesh.scaling, { x: 2.5, y: 2.5, z: 2.5, duration: 0.3, ease: "power2.out" });
    gsap.to(puMesh.material, { alpha: 0, duration: 0.3, onComplete: function() { puMesh.isVisible = false; if (puMesh._ring) puMesh._ring.isVisible = false; } });
    activatePowerUp(puMesh._puType);
}

function activatePowerUp(type) {
    var existIdx = activePowerUps.findIndex(function(p) { return p.id === type.id; });
    if (existIdx !== -1) { removePowerUpHUD(activePowerUps[existIdx]); activePowerUps.splice(existIdx, 1); }
    var puData = { id: type.id, label: type.label, icon: type.icon, color: type.color, remaining: type.duration, total: type.duration };
    activePowerUps.push(puData);
    if (type.id === "shield") { shieldActive = true; shieldUsed = false; createShieldBubble(); }
    addPowerUpHUD(puData);
    showFloatingText(type.label, type.color);
}

function updatePowerUps(dt) {
    for (var i = activePowerUps.length - 1; i >= 0; i--) {
        var pu = activePowerUps[i];
        pu.remaining -= dt;
        updatePowerUpHUDBar(pu);
        if (pu.remaining <= 2 && pu.remaining > 0) {
            var el = document.getElementById("pu-hud-" + pu.id);
            if (el && !el.classList.contains("pu-warning")) el.classList.add("pu-warning");
        }
        if (pu.remaining <= 0) {
            if (pu.id === "shield") { shieldActive = false; removeShieldBubble(); }
            removePowerUpHUD(pu);
            activePowerUps.splice(i, 1);
        }
    }
}

function addPowerUpHUD(pu) {
    var container = document.getElementById("powerUpHud");
    if (!container) return;
    var el = document.createElement("div");
    el.id = "pu-hud-" + pu.id;
    el.className = "pu-indicator";
    el.innerHTML = '<span class="pu-icon" style="color:' + pu.color + ';font-weight:bold;font-size:0.8rem">' + pu.icon + '</span><div class="pu-bar-bg"><div class="pu-bar-fill" style="background:' + pu.color + ';width:100%"></div></div>';
    container.appendChild(el);
    gsap.fromTo(el, { x: -40, opacity: 0, scale: 0.7 }, { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" });
}

function updatePowerUpHUDBar(pu) {
    var el = document.getElementById("pu-hud-" + pu.id);
    if (!el) return;
    var fill = el.querySelector(".pu-bar-fill");
    if (fill) fill.style.width = Math.max(0, (pu.remaining / pu.total) * 100) + "%";
}

function removePowerUpHUD(pu) {
    var el = document.getElementById("pu-hud-" + pu.id);
    if (!el) return;
    gsap.to(el, { x: -40, opacity: 0, scale: 0.5, duration: 0.3, ease: "power2.in", onComplete: function() { el.remove(); } });
}

function clearAllPowerUps() {
    activePowerUps.length = 0;
    shieldActive = false; shieldUsed = false; shieldSlowMo = false; shieldSlowMoTimer = 0;
    shieldInvincible = false; shieldInvincibleTimer = 0;
    if (shieldMesh) { shieldMesh.dispose(); shieldMesh = null; }
    var container = document.getElementById("powerUpHud");
    if (container) container.innerHTML = "";
}

// ===== COLLISION =====
function findCurrentSegment(x, z) {
    var best = null;
    for (var i = 0; i < segments.length; i++) {
        var b = segments[i].bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
            if (!best || segments[i].index > best.index) best = segments[i];
        }
    }
    return best;
}

// ===== GAME UPDATE =====
var fallVelocity = 0;
var carFalling = false;
var carVelY = 0;
var carAirborne = false;
var carTilt = 0;
var wasAirborne = false;

function gameUpdate(dt) {
    if (gameState !== "playing" || carFalling) return;

    // Shield invincibility countdown
    if (shieldInvincible) {
        shieldInvincibleTimer -= dt;
        if (shieldInvincibleTimer <= 0) { shieldInvincible = false; }
    }

    var timeScale = 1.0;
    if (shieldSlowMo) {
        shieldSlowMoTimer -= dt;
        if (shieldSlowMoTimer <= 0) shieldSlowMo = false;
        else {
            var fadeOut = shieldSlowMoTimer < 0.5 ? shieldSlowMoTimer / 0.5 : 1.0;
            timeScale = SHIELD_SLOWMO_SCALE + (1.0 - SHIELD_SLOWMO_SCALE) * (1.0 - fadeOut);
        }
    }
    var eDt = dt * timeScale;

    // Steering
    if (firstInput) {
        var diff = targetHeading - carHeading;
        var turnProgress = 1 - Math.min(Math.abs(diff) / (Math.PI / 2), 1);
        carHeading += diff * Math.min(1, CONFIG.SNAP_SPEED * (0.15 + turnProgress * 2.0) * eDt);
        var vdiff = targetHeading - carVisualHeading;
        carVisualHeading += vdiff * Math.min(1, CONFIG.VISUAL_SNAP * eDt);
    }

    // Move
    carMesh.position.x += Math.sin(carHeading) * CONFIG.CAR_SPEED * eDt;
    carMesh.position.z += Math.cos(carHeading) * CONFIG.CAR_SPEED * eDt;
    carMesh.rotation.y = carVisualHeading;

    // Drift tilt
    var driftAngle = carVisualHeading - carHeading;
    var tt = driftAngle * 0.4;
    carTilt += (tt - carTilt) * Math.min(1, (Math.abs(tt) > Math.abs(carTilt) ? 14 : 2.5) * eDt);
    if (!carAirborne) carMesh.rotation.z = carTilt;

    updateEngineSound(CONFIG.CAR_SPEED, Math.abs(targetHeading - carHeading));

    var seg = findCurrentSegment(carMesh.position.x, carMesh.position.z);

    // ===== ZONE EFFECTS =====
    var _iceActive = false;
    var _windPush = 0;
    var _windDir = null;
    if (levelMode && currentLevelConfig && currentLevelConfig.zones) {
        var zones = currentLevelConfig.zones;
        var inDark = false;
        var inRocks = false;

        for (var zzi = 0; zzi < zones.length; zzi++) {
            var zz = zones[zzi];
            if (currentSegmentIndex >= zz.from && currentSegmentIndex < zz.to) {
                if (zz.type === "ice") _iceActive = true;
                if (zz.type === "wind") { _windPush = 2.0; _windDir = zz.dir || "left"; }
                if (zz.type === "dark") inDark = true;
                if (zz.type === "rocks") inRocks = true;

                // Crumble: trigger segments behind the car
                if (zz.type === "crumble") {
                    for (var csi = 0; csi < segments.length; csi++) {
                        var cSeg = segments[csi];
                        if (cSeg._crumbleActive && !cSeg._crumbleTriggered && cSeg.index < currentSegmentIndex) {
                            cSeg._crumbleTriggered = true;
                        }
                    }
                }
            }
        }

        // Ice effect: override SNAP_SPEED temporarily
        if (_iceActive && CONFIG._original) {
            CONFIG.SNAP_SPEED = CONFIG._original.SNAP_SPEED * 0.55;
        } else if (CONFIG._original && !currentLevelConfig.slipperyPhysics) {
            CONFIG.SNAP_SPEED = CONFIG._original.SNAP_SPEED;
        }

        // Wind effect: push car laterally
        if (_windPush > 0 && seg) {
            var windSign = _windDir === "left" ? -1 : 1;
            if (seg.dir === "z") {
                carMesh.position.x += windSign * _windPush * eDt;
            } else {
                carMesh.position.z += windSign * _windPush * eDt;
            }
        }

        // Dark zone: tween fog
        if (inDark && !_darkActive && !_darkTweening) {
            _darkActive = true; _darkTweening = true;
            _savedFogStart = scene.fogStart;
            _savedFogEnd = scene.fogEnd;
            _savedHemiIntensity = hemiLight.intensity;
            gsap.to(scene, { fogStart: 8, fogEnd: 20, duration: 0.8, ease: "power2.inOut", onComplete: function() { _darkTweening = false; } });
            gsap.to(hemiLight, { intensity: 0.35, duration: 0.8, ease: "power2.inOut" });
        } else if (!inDark && _darkActive && !_darkTweening) {
            _darkActive = false; _darkTweening = true;
            gsap.to(scene, { fogStart: _savedFogStart, fogEnd: _savedFogEnd, duration: 0.8, ease: "power2.inOut", onComplete: function() { _darkTweening = false; } });
            gsap.to(hemiLight, { intensity: _savedHemiIntensity, duration: 0.8, ease: "power2.inOut" });
        }

        // Rocks zone: spawn falling rocks periodically
        if (inRocks) {
            _rockSpawnTimer -= eDt;
            if (_rockSpawnTimer <= 0) {
                _rockSpawnTimer = 2.0 + Math.random() * 1.0;
                // Spawn rock near car position
                var rockOffX = (Math.random() - 0.5) * CONFIG.ROAD_WIDTH * 0.7;
                var rockOffZ = Math.random() * 8 + 3; // ahead of car
                var rockX = carMesh.position.x + rockOffX;
                var rockZ = carMesh.position.z + Math.cos(carHeading) * rockOffZ;
                if (seg && seg.dir === "x") {
                    rockX = carMesh.position.x + Math.sin(carHeading) * rockOffZ;
                    rockZ = carMesh.position.z + rockOffX;
                }
                var fRock = createFallingRock(rockX, rockZ, CONFIG.ROAD_WIDTH);
                _activeRocks.push(fRock);
            }
        }

        // Update zone effects (crumble timers, rock animations)
        updateZoneEffects(eDt, currentSegmentIndex, zones, segments, _activeRocks);

        // Check active rock collisions
        for (var ari = 0; ari < _activeRocks.length; ari++) {
            var aRock = _activeRocks[ari];
            if (aRock._isObstacle && !aRock.isDisposed()) {
                var rb = aRock._obstacleBounds;
                if (carMesh.position.x >= rb.minX && carMesh.position.x <= rb.maxX &&
                    carMesh.position.z >= rb.minZ && carMesh.position.z <= rb.maxZ) {
                    if (!shieldInvincible && !(shieldActive && !shieldUsed)) {
                        if (levelMode) levelHadCrash = true;
                        resetCombo(); triggerFall(); return;
                    }
                }
            }
        }
    }

    if (seg) {
        var roadH = getSegmentRampHeight(seg, carMesh.position.x, carMesh.position.z);
        _lastRoadElevation = roadH;
        var targetY = 0.5 + roadH;

        if (carAirborne) {
            carVelY -= CONFIG.GRAVITY * eDt;
            carMesh.position.y += carVelY * eDt;
            carMesh.rotation.x = Math.max(-0.15, Math.min(0.15, -carVelY * 0.02));
            if (carMesh.position.y <= targetY) {
                carMesh.position.y = targetY; carVelY = 0; carAirborne = false; carMesh.rotation.x = 0;
                if (wasAirborne) { playLandSound(); wasAirborne = false; }
            }
        } else {
            var pl = 1.5;
            var hA = getSegmentRampHeight(seg, carMesh.position.x + Math.sin(carHeading) * pl, carMesh.position.z + Math.cos(carHeading) * pl);
            var hB = getSegmentRampHeight(seg, carMesh.position.x - Math.sin(carHeading) * pl, carMesh.position.z - Math.cos(carHeading) * pl);
            carMesh.rotation.x = -Math.atan2(hA - hB, pl * 2);
            var prevY = carMesh.position.y;
            if (targetY > carMesh.position.y) carMesh.position.y = targetY;
            else carMesh.position.y += (targetY - carMesh.position.y) * Math.min(1, 15 * eDt);
            carVelY = (carMesh.position.y - prevY) / eDt;
            if (carVelY > 1.5 && roadH > 0.5) { carAirborne = true; wasAirborne = true; carVelY = Math.min(carVelY, 4); }
        }

        // Score + combo
        if (seg.index > highestSegment) {
            var gained = seg.index - highestSegment;
            highestSegment = seg.index;
            for (var g = 0; g < gained; g++) incrementCombo();
            score += gained * getComboMultiplier();
            scoreDisplay.textContent = score;
            gsap.fromTo(scoreDisplay, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        }
        currentSegmentIndex = seg.index;
        updateRoad();

        // Level mode: check finish line
        if (levelMode && checkFinishLineReached(carMesh.position.x, carMesh.position.z)) {
            triggerLevelComplete();
            return;
        }

        // Level progress bar
        if (levelMode) updateLevelProgressHUD();

        // Obstacle collision check
        for (var osi = 0; osi < segments.length; osi++) {
            var oSeg = segments[osi];
            if (!oSeg.obstacles || oSeg.obstacles.length === 0) continue;
            if (checkObstacleCollision(carMesh.position.x, carMesh.position.z, oSeg.obstacles)) {
                if (shieldInvincible) {
                    // Still invincible from shield break — ignore collision
                } else if (shieldActive && !shieldUsed) {
                    // Shield saves from obstacle — blink + invincibility
                    shieldUsed = true; shieldActive = false;
                    shieldInvincible = true; shieldInvincibleTimer = SHIELD_INVINCIBLE_DURATION;
                    var shIdx3 = activePowerUps.findIndex(function(p) { return p.id === "shield"; });
                    if (shIdx3 !== -1) { removePowerUpHUD(activePowerUps[shIdx3]); activePowerUps.splice(shIdx3, 1); }
                    playShieldBreakSound(); removeShieldBubble();
                    showFloatingText("SHIELD!", "#4fc3f7");
                    // DEV: infinite shield — re-activate after break
                    if (window._devInfiniteShield) {
                        setTimeout(function() { shieldActive = true; shieldUsed = false; createShieldBubble(); }, 1300);
                    }
                    // Blue flash overlay
                    var flashEl = document.getElementById("deathFlash");
                    if (flashEl) {
                        flashEl.style.background = "radial-gradient(ellipse at center, rgba(79,195,247,0.5) 0%, rgba(21,101,192,0.3) 100%)";
                        flashEl.classList.remove("hidden");
                        gsap.fromTo(flashEl, { opacity: 0.7 }, { opacity: 0, duration: 0.8, ease: "power2.out", onComplete: function() { flashEl.classList.add("hidden"); flashEl.style.background = ""; } });
                    }
                    // Car blink animation
                    gsap.to(carMesh, { _: 0, duration: SHIELD_INVINCIBLE_DURATION,
                        onUpdate: function() { var v = Math.floor(this.progress() * 14) % 2 === 0; carMesh.getChildMeshes().forEach(function(m) { m.isVisible = v; }); },
                        onComplete: function() { carMesh.getChildMeshes().forEach(function(m) { m.isVisible = true; }); }
                    });
                } else {
                    if (levelMode) levelHadCrash = true;
                    resetCombo();
                    triggerFall();
                    return;
                }
            }
            // Speed zone check
            var boost = checkSpeedZone(carMesh.position.x, carMesh.position.z, oSeg.obstacles);
            if (boost > 1.0) {
                carMesh.position.x += Math.sin(carHeading) * CONFIG.CAR_SPEED * (boost - 1.0) * eDt;
                carMesh.position.z += Math.cos(carHeading) * CONFIG.CAR_SPEED * (boost - 1.0) * eDt;
            }
        }

        // Update dynamic obstacles
        updateDynamicObstacles(eDt);

    } else {
        // Off road - shield save
        if (shieldActive && !shieldUsed) {
            shieldUsed = true; shieldActive = false;
            var shIdx2 = activePowerUps.findIndex(function(p) { return p.id === "shield"; });
            if (shIdx2 !== -1) { removePowerUpHUD(activePowerUps[shIdx2]); activePowerUps.splice(shIdx2, 1); }
            playShieldBreakSound(); removeShieldBubble();
            showFloatingText("SHIELD!", "#4fc3f7");
            // DEV: infinite shield — re-activate after break
            if (window._devInfiniteShield) {
                setTimeout(function() { shieldActive = true; shieldUsed = false; createShieldBubble(); }, 1300);
            }
            // Always find a Z-direction segment for consistent controls after save
            var safeSeg = null;
            for (var si3 = segments.length - 1; si3 >= 0; si3--) {
                if (segments[si3].index <= currentSegmentIndex && segments[si3].dir === "z") {
                    safeSeg = segments[si3]; break;
                }
            }
            if (!safeSeg) safeSeg = segments[0];
            if (safeSeg) {
                var safeX = safeSeg.startX;
                var safeZ = safeSeg.startZ + safeSeg.length * 0.5;
                carMesh.position.x = safeX; carMesh.position.z = safeZ; carMesh.position.y = 0.5;
                carVelY = 0; carAirborne = false;
                carHeading = 0; carVisualHeading = 0; targetHeading = 0; isTurning = false;
                // No slow-mo — full speed with 1.5s invincibility
                shieldInvincible = true; shieldInvincibleTimer = 1.5;
                var flashEl = document.getElementById("deathFlash");
                if (flashEl) {
                    flashEl.style.background = "radial-gradient(ellipse at center, rgba(79,195,247,0.5) 0%, rgba(21,101,192,0.3) 100%)";
                    flashEl.classList.remove("hidden");
                    gsap.fromTo(flashEl, { opacity: 0.7 }, { opacity: 0, duration: 0.8, ease: "power2.out", onComplete: function() { flashEl.classList.add("hidden"); flashEl.style.background = ""; } });
                }
                gsap.to(carMesh, { _: 0, duration: 1.5,
                    onUpdate: function() { var v = Math.floor(this.progress() * 14) % 2 === 0; carMesh.getChildMeshes().forEach(function(m) { m.isVisible = v; }); },
                    onComplete: function() { carMesh.getChildMeshes().forEach(function(m) { m.isVisible = true; }); }
                });
            }
        } else {
            resetCombo(); triggerFall();
        }
    }

    // Tire marks
    tireMarkTimer += eDt;
    if (!carAirborne && tireMarkTimer >= CONFIG.TIRE_MARK_INTERVAL) {
        tireMarkTimer = 0;
        var cosV = Math.cos(carVisualHeading), sinV = Math.sin(carVisualHeading);
        var rx = carMesh.position.x + sinV * -1.0, rz = carMesh.position.z + cosV * -1.0;
        addTireMark(rx - cosV * 0.6, rz + sinV * 0.6, carHeading);
        addTireMark(rx + cosV * 0.6, rz - sinV * 0.6, carHeading);
    }

    // Coins + power-ups
    var magnetOn = hasPowerUp("magnet");
    for (var si2 = 0; si2 < segments.length; si2++) {
        var s2 = segments[si2];
        for (var ci = 0; ci < s2.coins.length; ci++) {
            var c = s2.coins[ci];
            if (c._collected || !c.isVisible) continue;
            var cdx = carMesh.position.x - c.position.x, cdz = carMesh.position.z - c.position.z;
            var d2 = cdx * cdx + cdz * cdz;
            if (magnetOn && d2 < MAGNET_RADIUS * MAGNET_RADIUS) {
                var dist = Math.sqrt(d2);
                var pull = 15 * eDt / Math.max(dist, 0.5);
                c.position.x += cdx * pull; c.position.z += cdz * pull;
            }
            if (d2 < 2.25) collectCoin(c);
        }
        for (var pi = 0; pi < s2.powerUps.length; pi++) {
            var pu = s2.powerUps[pi];
            if (pu._collected || !pu.isVisible) continue;
            var pdx = carMesh.position.x - pu.position.x, pdz = carMesh.position.z - pu.position.z;
            if (pdx * pdx + pdz * pdz < 3.0) collectPowerUp(pu);
        }
    }

    updatePowerUps(eDt);

    // Smoke
    if (smokeSystem) {
        var hd = Math.abs(targetHeading - carHeading);
        var da = Math.min(hd / 0.8, 1);
        if (hd > 0.05 && !carAirborne) { smokeSystem.emitRate = 30 + da * 60; smokeSystem.minSize = 0.3 + da * 0.4; smokeSystem.maxSize = 0.7 + da * 0.8; }
        else smokeSystem.emitRate = 0;
        var srx = carMesh.position.x - Math.sin(carVisualHeading) * 1.8;
        var srz = carMesh.position.z - Math.cos(carVisualHeading) * 1.8;
        smokeSystem.emitter.x = srx; smokeSystem.emitter.y = getWorldHeight(srx, srz) + 0.1; smokeSystem.emitter.z = srz;
    }

    // Shield pulse
    if (shieldMesh && shieldActive) {
        shieldMesh.scaling.setAll(1.0 + Math.sin(performance.now() * 0.005) * 0.05);
        shieldMesh.material.alpha = 0.15 + Math.sin(performance.now() * 0.003) * 0.05;
    }

    // Camera
    var cl = 1 - Math.pow(0.01, eDt);
    camera.target.x += (carMesh.position.x - camera.target.x) * cl;
    camera.target.y += (carMesh.position.y - camera.target.y) * cl;
    camera.target.z += (carMesh.position.z - camera.target.z) * cl;
    var gnd = scene.getMeshByName("ground");
    if (gnd) { gnd.position.x = camera.target.x; gnd.position.z = camera.target.z; }
    dirLight.position.x = carMesh.position.x + 10;
    dirLight.position.z = carMesh.position.z - 10;
    updateCityPositions(camera.target.x, camera.target.z);
    updateDecorationPositions(camera.target.x, camera.target.z);
}

// ===== FALL / DEATH =====
var fallAnimFn = null;

function triggerFall() {
    carFalling = true; fallVelocity = 0;
    playFallSound(); muteEngine();
    if (smokeSystem) smokeSystem.emitRate = 0;

    var oa = camera.alpha, ob = camera.beta;
    gsap.to(camera, { alpha: oa + 0.03, duration: 0.05, yoyo: true, repeat: 7, ease: "none", onComplete: function() { camera.alpha = oa; } });
    gsap.to(camera, { beta: ob + 0.02, duration: 0.06, yoyo: true, repeat: 5, ease: "none", onComplete: function() { camera.beta = ob; } });

    var fl = document.getElementById("deathFlash");
    if (fl) { fl.style.background = ""; fl.classList.remove("hidden"); gsap.fromTo(fl, { opacity: 0.6 }, { opacity: 0, duration: 0.6, ease: "power2.out", onComplete: function() { fl.classList.add("hidden"); } }); }

    gsap.to(carMesh.rotation, { x: Math.PI * 1.5, z: Math.PI * 0.8, duration: 1.2, ease: "power2.in" });
    gsap.to(carMesh.scaling, { x: 0.3, y: 0.3, z: 0.3, duration: 1.0, delay: 0.3, ease: "power2.in" });

    fallAnimFn = function() {
        fallVelocity += 0.018;
        carMesh.position.y -= fallVelocity;
        if (carMesh.position.y < _lastRoadElevation - 8) { scene.unregisterBeforeRender(fallAnimFn); fallAnimFn = null; gameOver(); }
    };
    scene.registerBeforeRender(fallAnimFn);
}

function triggerLevelComplete() {
    gameState = "levelComplete";
    fadeOutMusic(0.5);
    hideHUD();
    var progContainer = document.getElementById("levelProgressContainer");
    if (progContainer) progContainer.classList.add("hidden");

    var stars = calculateStars(currentLevelConfig, true, levelCoinsCollected, levelCoinsTotal, levelHadCrash);
    saveLevelProgress(currentLevelConfig.levelNum, stars, levelCoinsCollected);

    // Award coins
    var coinsEarned = levelCoinsCollected + stars * 5;
    var prevCoins = loadTotalCoins();
    saveTotalCoins(prevCoins + coinsEarned);

    playLevelCompleteSound();
    showLevelCompleteScreen(currentLevelConfig, stars, coinsEarned, levelCoinsCollected, levelCoinsTotal);
}

function gameOver() {
    gameState = "gameover";
    fadeOutMusic(0.5);
    hideHUD();
    var progContainer = document.getElementById("levelProgressContainer");
    if (progContainer) progContainer.classList.add("hidden");

    if (levelMode) {
        levelHadCrash = true;
    }

    console.log("[gameOver] sessionCoins:", sessionCoins, "score:", score);
    var prevCoins = loadTotalCoins();
    var totalCoins = prevCoins + sessionCoins;
    saveTotalCoins(totalCoins);
    console.log("[gameOver] saved coins:", prevCoins, "->", totalCoins, "verify:", loadTotalCoins());
    highScore = loadHighScore();
    var isNewHigh = score > highScore;
    if (isNewHigh) { highScore = score; saveHighScore(highScore); }
    console.log("[gameOver] highScore:", highScore, "isNewHigh:", isNewHigh);
    showGameOverScreen(score, sessionCoins, isNewHigh);
}

// ===== INPUT =====
window.addEventListener("keydown", function(e) {
    if (e.code === "Space") {
        e.preventDefault(); initAudio();
        if (gameState === "playing" && !isTurning) { isTurning = true; if (!firstInput) firstInput = true; targetHeading += Math.PI / 2; }
    }
    if (e.code === "Escape") {
        if (gameState === "playing") pauseGame();
        else if (gameState === "paused") resumeGame();
    }
    // DEV: P key — unlock all levels
    if (e.code === "KeyP") {
        var progress = loadLevelProgress();
        for (var li = 1; li <= WORLDS.length; li++) {
            progress["l" + li] = { stars: 3, coins: 99 };
        }
        try { localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(progress)); } catch(ex) {}
        console.log("[DEV] All levels unlocked with 3 stars");
        if (typeof refreshLevelSelectUI === "function") refreshLevelSelectUI();
        if (typeof updateLevelSelectStars === "function") updateLevelSelectStars();
    }
    // DEV: V key — toggle infinite shield for current level
    if (e.code === "KeyV" && gameState === "playing") {
        if (!shieldActive) {
            shieldActive = true; shieldUsed = false;
            createShieldBubble();
            showFloatingText("DEV SHIELD ON", "#4fc3f7");
        }
        window._devInfiniteShield = !window._devInfiniteShield;
        console.log("[DEV] Infinite shield: " + (window._devInfiniteShield ? "ON" : "OFF"));
    }
    // DEV: S key — reset all level progress
    if (e.code === "KeyS" && gameState !== "playing") {
        try { localStorage.removeItem(LEVEL_PROGRESS_KEY); } catch(ex) {}
        console.log("[DEV] All level progress reset");
        if (typeof refreshLevelSelectUI === "function") refreshLevelSelectUI();
        if (typeof updateLevelSelectStars === "function") updateLevelSelectStars();
    }
});

window.addEventListener("keyup", function(e) {
    if (e.code === "Space") { e.preventDefault(); if (isTurning) { isTurning = false; targetHeading -= Math.PI / 2; } }
});

canvas.addEventListener("pointerdown", function() {
    initAudio();
    if (gameState === "playing" && !isTurning) { isTurning = true; if (!firstInput) firstInput = true; targetHeading += Math.PI / 2; }
});

canvas.addEventListener("pointerup", function() { if (isTurning) { isTurning = false; targetHeading -= Math.PI / 2; } });
canvas.addEventListener("pointerleave", function() { if (isTurning) { isTurning = false; targetHeading -= Math.PI / 2; } });

// ===== INIT =====
buildGround();
generateInitialRoad();
buildStartGate();
buildCarWithConfig(getSelectedCarConfig());
buildCitySkyline();
setupSmoke();
camera.target.x = 0; camera.target.y = 0; camera.target.z = 2;

// Start with dark lobby scene - hide everything until lobby shows
scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.15, 1);
scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.15);
setWorldMeshesVisible(false);
if (carMesh) carMesh.getChildMeshes().forEach(function(m) { m.isVisible = false; });

// ===== GAME LOOP =====
scene.registerBeforeRender(function() {
    var now = performance.now() / 1000;
    var dt = Math.min(now - lastTime, 0.05);
    lastTime = now;

    if (gameState === "lobby" && carMesh && lobbyRotating) {
        carMesh.rotation.y += dt * 0.6;
        // Gentle hover using stored lobby Y (set by positionCarForLobby)
        var baseY = carMesh._lobbyBaseY || 0.8;
        carMesh.position.y = baseY + Math.sin(Date.now() * 0.002) * 0.05;
    }

    if (gameState === "playing") {
        gameUpdate(dt);
        updateTireMarks();
        var ns = performance.now() / 1000;
        for (var i = 0; i < segments.length; i++) {
            var seg = segments[i];
            for (var ci = 0; ci < seg.coins.length; ci++) {
                var c = seg.coins[ci];
                if (!c._collected) { c.rotation.y += dt * 3; c.position.y = c._baseY + Math.sin(ns * 3 + c._phase) * 0.12; }
            }
            for (var pi = 0; pi < seg.powerUps.length; pi++) {
                var pu = seg.powerUps[pi];
                if (!pu._collected && pu.isVisible) {
                    pu.rotation.y += dt * 2;
                    pu.position.y = pu._baseY + Math.sin(ns * 2.5 + pu._phase) * 0.2;
                    if (pu._ring) pu._ring.rotation.x += dt * 1.5;
                }
            }
        }
    }
});

// ===== GAME FLOW =====
function resetGame() {
    if (fallAnimFn) { scene.unregisterBeforeRender(fallAnimFn); fallAnimFn = null; }
    if (carMesh) { gsap.killTweensOf(carMesh.rotation); gsap.killTweensOf(carMesh.scaling); }
    gsap.killTweensOf(camera);
    while (segments.length > 0) removeSegment(segments[0]);
    if (typeof _resetCrusherSparkTex === "function") _resetCrusherSparkTex();
    if (typeof _resetFlameParticleTex === "function") _resetFlameParticleTex();
    if (typeof _resetDustParticleTex === "function") _resetDustParticleTex();
    if (typeof _resetDebrisParticleTex === "function") _resetDebrisParticleTex();
    if (typeof _resetIceParticleTex === "function") _resetIceParticleTex();
    if (typeof _resetWindParticleTex === "function") _resetWindParticleTex();
    if (typeof _resetRockImpactTex === "function") _resetRockImpactTex();

    // Reset zone state
    gsap.killTweensOf(scene);
    gsap.killTweensOf(hemiLight);
    _darkActive = false;
    _darkTweening = false;
    _rockSpawnTimer = 0;
    // Clean up active falling rocks
    for (var ri = 0; ri < _activeRocks.length; ri++) {
        var ar = _activeRocks[ri];
        if (ar._shadow && !ar._shadow.isDisposed()) { if (ar._shadow.material) ar._shadow.material.dispose(); ar._shadow.dispose(); }
        if (!ar.isDisposed()) { if (ar.material) ar.material.dispose(); ar.dispose(); }
    }
    _activeRocks = [];
    // Clean up wind particles
    for (var wi = 0; wi < _zoneWindParticles.length; wi++) {
        var wp = _zoneWindParticles[wi];
        if (wp) { wp.stop(); wp.dispose(false); }
    }
    _zoneWindParticles = [];
    // Restore fog/light to defaults
    scene.fogStart = 30;
    scene.fogEnd = 90;
    hemiLight.intensity = 0.85;
    tireMarks.forEach(function(m) { m.dispose(); });
    tireMarks.length = 0;
    clearAllPowerUps();
    resetCombo();
    cleanupFinishLine();

    score = 0; sessionCoins = 0; highestSegment = 0; currentSegmentIndex = 0;
    carHeading = 0; carVisualHeading = 0; targetHeading = 0;
    isTurning = false; firstInput = false; carFalling = false;
    fallVelocity = 0; carVelY = 0; carAirborne = false; wasAirborne = false;
    carTilt = 0; tireMarkTimer = 0; _lastRoadElevation = 0;
    nextSegStartX = 0; nextSegStartZ = 0; nextSegIndex = 0;
    scoreDisplay.textContent = "0"; coinCount.textContent = "0";

    // Reset level state
    levelCoinsCollected = 0;
    levelHadCrash = false;

    generateInitialRoad();
    destroyCurrentCar();
    buildCarWithConfig(getSelectedCarConfig());
    carMesh.position = new BABYLON.Vector3(0, 0.5, 2);
    carMesh.rotation = new BABYLON.Vector3(0, 0, 0);
    carMesh.scaling = new BABYLON.Vector3(1, 1, 1);
    // Reset camera to original position (direct target, NOT setTarget)
    gsap.killTweensOf(camera);
    camera.target.x = 0;
    camera.target.y = 0;
    camera.target.z = 2;
    camera.alpha = -3 * Math.PI / 4;
    camera.beta = Math.PI / 3.2;
    camera.radius = 25;
    if (smokeSystem) smokeSystem.emitRate = 0;
    if (lobbyPedestalMesh) lobbyPedestalMesh.isVisible = false;
}

function pauseGame() {
    if (gameState !== "playing") return;
    showPauseScreen(); muteEngineFast();
    if (_bgMusic && !_bgMusic.paused) { _bgMusic.volume = _realVol(musicVolume) * 0.3; }
}

function resumeGame() {
    if (gameState !== "paused") return;
    hidePauseScreen(function() {
        gameState = "playing"; lastTime = performance.now() / 1000;
        if (_bgMusic && !_bgMusic.paused) { _bgMusic.volume = _realVol(musicVolume); }
    });
}

function restartFromPause() {
    hidePauseScreen(function() {
        if (levelMode && currentLevelConfig) {
            startLevel(currentLevelConfig.levelNum);
        } else {
            resetGame(); gameState = "playing"; lastTime = performance.now() / 1000;
            startGameMusic();
        }
    });
}

function goToLobby() {
    stopMusic();
    // Kill camera tweens immediately (don't wait for fade)
    gsap.killTweensOf(camera);
    camera.alpha = -3 * Math.PI / 4;
    camera.beta = Math.PI / 3.2;
    camera.radius = 25;

    var hideScreenFn = function(cb) {
        var go = document.getElementById("gameOverScreen");
        var lc = document.getElementById("levelCompleteScreen");
        if (lc && !lc.classList.contains("hidden")) {
            hideLevelCompleteScreen(cb);
        } else if (go && !go.classList.contains("hidden")) {
            hideGameOverScreen(cb);
        } else if (cb) cb();
    };
    hideScreenFn(function() {
        // Set dark colors before reset to avoid warm-scene flash
        scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.15, 1);
        scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.15);
        // Restore ground visibility
        var gnd = scene.getMeshByName("ground");
        if (gnd) gnd.isVisible = true;
        cleanupWorldDecorations();
        var wasLevelMode = levelMode;
        levelMode = false;
        currentLevelConfig = null;
        restoreDefaultConfig();
        levelRandom = null;
        var progContainer = document.getElementById("levelProgressContainer");
        if (progContainer) progContainer.classList.add("hidden");
        resetGame();
        if (wasLevelMode) {
            showLevelSelect();
        } else {
            showLobby();
        }
    });
}

function goToLevelSelect() {
    stopMusic();
    startLobbyMusic();
    gsap.killTweensOf(camera);
    camera.alpha = -3 * Math.PI / 4;
    camera.beta = Math.PI / 3.2;
    camera.radius = 25;

    var hideScreenFn = function(cb) {
        // Hide whichever screen is visible
        var go = document.getElementById("gameOverScreen");
        var lc = document.getElementById("levelCompleteScreen");
        if (go && !go.classList.contains("hidden")) {
            hideGameOverScreen(cb);
        } else if (lc && !lc.classList.contains("hidden")) {
            hideLevelCompleteScreen(cb);
        } else if (cb) cb();
    };

    hideScreenFn(function() {
        scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.15, 1);
        scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.15);
        // Restore ground visibility
        var gnd = scene.getMeshByName("ground");
        if (gnd) gnd.isVisible = true;
        cleanupWorldDecorations();
        levelMode = false;
        currentLevelConfig = null;
        restoreDefaultConfig();
        levelRandom = null;
        var progContainer = document.getElementById("levelProgressContainer");
        if (progContainer) progContainer.classList.add("hidden");
        resetGame();
        setWorldMeshesVisible(false);
        showLevelSelect();
    });
}

// ===== EVENT LISTENERS =====
document.getElementById("pauseBtn").addEventListener("click", function(e) { e.stopPropagation(); playPauseSound(); pauseGame(); });
document.getElementById("resumeBtn").addEventListener("click", function(e) { e.stopPropagation(); playResumeSound(); resumeGame(); });
document.getElementById("restartBtn").addEventListener("click", function(e) { e.stopPropagation(); playButtonClickSound(); restartFromPause(); });
document.getElementById("playAgainBtn").addEventListener("click", function(e) {
    e.stopPropagation(); playButtonClickSound();
    if (levelMode) {
        goToLevelSelect();
    } else {
        goToLobby();
    }
});

// Game Over replay button (level mode only)
document.getElementById("goReplayBtn").addEventListener("click", function(e) {
    e.stopPropagation(); playButtonClickSound();
    var replayLevel = currentLevelConfig ? currentLevelConfig.levelNum : 1;
    hideGameOverScreen(function() {
        startLevel(replayLevel);
    });
});

// Level Complete buttons
document.getElementById("lcNextBtn").addEventListener("click", function(e) {
    e.stopPropagation(); playButtonClickSound();
    var nextLevel = currentLevelConfig ? currentLevelConfig.levelNum + 1 : 1;
    if (nextLevel > WORLDS.length) nextLevel = WORLDS.length;
    hideLevelCompleteScreen(function() {
        startLevel(nextLevel);
    });
});
document.getElementById("lcReplayBtn").addEventListener("click", function(e) {
    e.stopPropagation(); playButtonClickSound();
    var replayLevel = currentLevelConfig ? currentLevelConfig.levelNum : 1;
    hideLevelCompleteScreen(function() {
        startLevel(replayLevel);
    });
});
document.getElementById("lcLevelsBtn").addEventListener("click", function(e) {
    e.stopPropagation(); playButtonClickSound();
    goToLevelSelect();
});

// ===== RENDER =====
engine.runRenderLoop(function() { scene.render(); });
window.addEventListener("resize", function() { engine.resize(); });

// ===== START =====
lastTime = performance.now() / 1000;
scene.executeWhenReady(function() {
    preloadCarModels().then(function() {
        simulateLoading(function() { initLobby(); showLobby(); });
    });
});
