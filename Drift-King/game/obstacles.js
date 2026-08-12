// ===== OBSTACLE SYSTEM =====
// Depends on: game.js scene & shadowGen, levels.js (gameRandom)

const OBSTACLE_TYPES = [
    { id: "barrier", width: 3.5, height: 1.2, depth: 0.5, color: "#e74c3c", stripe: "#fff" },
    { id: "cone", radius: 0.3, height: 0.8, color: "#ff9800" },
];

function createBarrierMesh(x, z, segDir, roadWidth) {
    const type = OBSTACLE_TYPES[0];
    const offsetRange = roadWidth * 0.2;
    const lateralOffset = (gameRandom() - 0.5) * offsetRange;

    const barrier = BABYLON.MeshBuilder.CreateBox("barrier_" + gameRandom(), {
        width: segDir === "z" ? type.width : type.depth,
        height: type.height,
        depth: segDir === "z" ? type.depth : type.width,
    }, scene);

    if (segDir === "z") {
        barrier.position = new BABYLON.Vector3(x + lateralOffset, type.height / 2, z);
    } else {
        barrier.position = new BABYLON.Vector3(x, type.height / 2, z + lateralOffset);
    }

    const mat = new BABYLON.StandardMaterial("barrierMat_" + gameRandom(), scene);
    const tex = new BABYLON.DynamicTexture("barrierTex_" + gameRandom(), 128, scene);
    const ctx = tex.getContext();
    const stripeW = 32;
    for (let i = 0; i < 128; i += stripeW) {
        ctx.fillStyle = (i / stripeW) % 2 === 0 ? type.color : type.stripe;
        ctx.fillRect(0, i, 128, stripeW);
    }
    tex.update();
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    barrier.material = mat;

    shadowGen.addShadowCaster(barrier);

    const hw = (segDir === "z" ? type.width : type.depth) / 2;
    const hd = (segDir === "z" ? type.depth : type.width) / 2;
    barrier._obstacleBounds = {
        minX: barrier.position.x - hw - 0.3,
        maxX: barrier.position.x + hw + 0.3,
        minZ: barrier.position.z - hd - 0.3,
        maxZ: barrier.position.z + hd + 0.3,
    };
    barrier._isObstacle = true;

    return barrier;
}

function createSideBarrier(x, z, segDir, roadWidth, side) {
    const type = OBSTACLE_TYPES[0];
    const lateralOffset = side === "left" ? -roadWidth * 0.2 : roadWidth * 0.2;

    const barrier = BABYLON.MeshBuilder.CreateBox("sidebarrier_" + gameRandom(), {
        width: segDir === "z" ? type.width : type.depth,
        height: type.height,
        depth: segDir === "z" ? type.depth : type.width,
    }, scene);

    if (segDir === "z") {
        barrier.position = new BABYLON.Vector3(x + lateralOffset, type.height / 2, z);
    } else {
        barrier.position = new BABYLON.Vector3(x, type.height / 2, z + lateralOffset);
    }

    const mat = new BABYLON.StandardMaterial("sideBarrierMat_" + gameRandom(), scene);
    const tex = new BABYLON.DynamicTexture("sideBarrierTex_" + gameRandom(), 128, scene);
    const ctx = tex.getContext();
    const stripeW = 32;
    for (let i = 0; i < 128; i += stripeW) {
        ctx.fillStyle = (i / stripeW) % 2 === 0 ? type.color : type.stripe;
        ctx.fillRect(0, i, 128, stripeW);
    }
    tex.update();
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    barrier.material = mat;

    shadowGen.addShadowCaster(barrier);

    const hw = (segDir === "z" ? type.width : type.depth) / 2;
    const hd = (segDir === "z" ? type.depth : type.width) / 2;
    barrier._obstacleBounds = {
        minX: barrier.position.x - hw - 0.3,
        maxX: barrier.position.x + hw + 0.3,
        minZ: barrier.position.z - hd - 0.3,
        maxZ: barrier.position.z + hd + 0.3,
    };
    barrier._isObstacle = true;

    return barrier;
}

function createMovingSideBarrier(x, z, segDir, roadWidth, side) {
    var barrier = createSideBarrier(x, z, segDir, roadWidth, side);
    barrier._movingObstacle = true;
    barrier._segDir = segDir;
    barrier._moveAxis = segDir === "z" ? "x" : "z";
    barrier._moveCenter = barrier._moveAxis === "x" ? barrier.position.x : barrier.position.z;
    barrier._moveRange = roadWidth * 0.15;
    barrier._moveSpeed = 2.0 + gameRandom() * 1.5;
    barrier._movePhase = side === "right" ? 0 : Math.PI;
    return barrier;
}

function createConeMeshes(x, z, segDir, roadWidth) {
    const type = OBSTACLE_TYPES[1];
    const meshes = [];
    const count = 2 + Math.floor(gameRandom() * 2);
    const spacing = 1.2;

    for (let i = 0; i < count; i++) {
        const cone = BABYLON.MeshBuilder.CreateCylinder("cone_" + gameRandom(), {
            diameterTop: 0.05,
            diameterBottom: type.radius * 2,
            height: type.height,
            tessellation: 12,
        }, scene);

        const mat = new BABYLON.StandardMaterial("coneMat_" + gameRandom(), scene);
        mat.diffuseColor = BABYLON.Color3.FromHexString(type.color);
        mat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        cone.material = mat;

        let cx, cz;
        const lateralOffset = (gameRandom() - 0.5) * roadWidth * 0.5;
        if (segDir === "z") {
            cx = x + lateralOffset;
            cz = z + (i - count / 2) * spacing;
        } else {
            cx = x + (i - count / 2) * spacing;
            cz = z + lateralOffset;
        }

        cone.position = new BABYLON.Vector3(cx, type.height / 2, cz);
        shadowGen.addShadowCaster(cone);

        cone._obstacleBounds = {
            minX: cx - type.radius - 0.4,
            maxX: cx + type.radius + 0.4,
            minZ: cz - type.radius - 0.4,
            maxZ: cz + type.radius + 0.4,
        };
        cone._isObstacle = true;

        meshes.push(cone);
    }

    return meshes;
}

// --- Swinging Axe (Pendulum) ---
function createSwingingAxe(x, z, segDir, roadWidth, side) {
    var armLen = 3.0;
    var bladeW = 2.8, bladeH = 1.0, bladeD = 0.3;
    var lateralOffset = side === "left" ? -roadWidth * 0.05 : roadWidth * 0.05;

    // Pivot node at top (above road)
    var pivot = new BABYLON.TransformNode("axePivot_" + gameRandom(), scene);
    if (segDir === "z") {
        pivot.position = new BABYLON.Vector3(x + lateralOffset, 4.0, z);
    } else {
        pivot.position = new BABYLON.Vector3(x, 4.0, z + lateralOffset);
    }

    // Arm (thin rod)
    var arm = BABYLON.MeshBuilder.CreateBox("axeArm_" + gameRandom(), {
        width: 0.15, height: armLen, depth: 0.15
    }, scene);
    arm.parent = pivot;
    arm.position.y = -armLen / 2;
    var armMat = new BABYLON.StandardMaterial("axeArmMat_" + gameRandom(), scene);
    armMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    armMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    arm.material = armMat;
    shadowGen.addShadowCaster(arm);

    // Blade (wide block at bottom of arm) — red/yellow striped
    var blade = BABYLON.MeshBuilder.CreateBox("axeBlade_" + gameRandom(), {
        width: segDir === "z" ? bladeW : bladeD,
        height: bladeH,
        depth: segDir === "z" ? bladeD : bladeW
    }, scene);
    blade.parent = pivot;
    blade.position.y = -armLen - bladeH / 2;
    var bladeMat = new BABYLON.StandardMaterial("axeBladeMat_" + gameRandom(), scene);
    var bladeTex = new BABYLON.DynamicTexture("axeBladeTex_" + gameRandom(), 128, scene);
    var ctx = bladeTex.getContext();
    var stripeW = 32;
    for (var i = 0; i < 128; i += stripeW) {
        ctx.fillStyle = (i / stripeW) % 2 === 0 ? "#e74c3c" : "#f1c40f";
        ctx.fillRect(0, i, 128, stripeW);
    }
    bladeTex.update();
    bladeTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    bladeTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    bladeMat.diffuseTexture = bladeTex;
    bladeMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    blade.material = bladeMat;
    shadowGen.addShadowCaster(blade);

    // Properties on pivot for animation
    pivot._swingingAxe = true;
    pivot._isObstacle = true;
    pivot._segDir = segDir;
    pivot._pivotX = pivot.position.x;
    pivot._pivotZ = pivot.position.z;
    pivot._armLength = armLen + bladeH / 2;
    pivot._bladeHalfW = bladeW / 2;
    pivot._bladeHalfD = bladeD / 2;
    pivot._swingSpeed = 1.8 + gameRandom() * 1.0;
    pivot._swingRange = Math.PI / 3;
    pivot._swingPhase = side === "right" ? 0 : Math.PI;
    pivot._obstacleBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

    return pivot;
}

// --- Crusher (Smasher) ---
// Shared spark texture for all crushers (created once)
var _crusherSparkTex = null;
function _getCrusherSparkTex() {
    // Recreate if null or disposed
    if (_crusherSparkTex && !_crusherSparkTex.isDisposed) {
        return _crusherSparkTex;
    }
    _crusherSparkTex = new BABYLON.DynamicTexture("crushSparkTex", 64, scene);
    var ctx = _crusherSparkTex.getContext();
    var grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, "rgba(255,240,180,1)");
    grad.addColorStop(0.3, "rgba(255,160,40,0.9)");
    grad.addColorStop(0.7, "rgba(255,80,10,0.4)");
    grad.addColorStop(1, "rgba(255,40,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    _crusherSparkTex.update();
    return _crusherSparkTex;
}
function _resetCrusherSparkTex() { _crusherSparkTex = null; }

// --- Shared Flame Particle Texture ---
var _flameParticleTex = null;
function _getFlameParticleTex() {
    if (_flameParticleTex && !_flameParticleTex.isDisposed) return _flameParticleTex;
    _flameParticleTex = new BABYLON.DynamicTexture("flamePTex", 64, scene);
    var ctx = _flameParticleTex.getContext();
    var grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, "rgba(255,220,100,1)");
    grad.addColorStop(0.3, "rgba(255,120,20,0.9)");
    grad.addColorStop(0.7, "rgba(200,40,0,0.4)");
    grad.addColorStop(1, "rgba(100,10,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    _flameParticleTex.update();
    return _flameParticleTex;
}
function _resetFlameParticleTex() { _flameParticleTex = null; }

// --- Shared Dust Particle Texture ---
var _dustParticleTex = null;
function _getDustParticleTex() {
    if (_dustParticleTex && !_dustParticleTex.isDisposed) return _dustParticleTex;
    _dustParticleTex = new BABYLON.DynamicTexture("dustPTex", 64, scene);
    var ctx = _dustParticleTex.getContext();
    var grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, "rgba(180,160,120,0.8)");
    grad.addColorStop(0.5, "rgba(160,140,100,0.4)");
    grad.addColorStop(1, "rgba(140,120,80,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    _dustParticleTex.update();
    return _dustParticleTex;
}
function _resetDustParticleTex() { _dustParticleTex = null; }

// --- Shared Debris Particle Texture ---
var _debrisParticleTex = null;
function _getDebrisParticleTex() {
    if (_debrisParticleTex && !_debrisParticleTex.isDisposed) return _debrisParticleTex;
    _debrisParticleTex = new BABYLON.DynamicTexture("debrisPTex", 64, scene);
    var ctx = _debrisParticleTex.getContext();
    var grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, "rgba(200,200,200,1)");
    grad.addColorStop(0.4, "rgba(150,150,140,0.7)");
    grad.addColorStop(0.8, "rgba(100,100,90,0.3)");
    grad.addColorStop(1, "rgba(60,60,50,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    _debrisParticleTex.update();
    return _debrisParticleTex;
}
function _resetDebrisParticleTex() { _debrisParticleTex = null; }

function createCrusher(x, z, segDir, roadWidth) {
    var wallW = roadWidth * 0.35;
    var wallH = 1.4;
    var wallD = 1.0;
    var openOffset = roadWidth * 0.42;

    var parent = new BABYLON.TransformNode("crusher_" + gameRandom(), scene);
    parent.position = new BABYLON.Vector3(x, 0, z);

    // Create wall material with dark metallic + orange hazard stripes
    function makeCrusherWallMat(id) {
        var mat = new BABYLON.StandardMaterial("crusherMat_" + id, scene);
        var tex = new BABYLON.DynamicTexture("crusherTex_" + id, 128, scene);
        var ctx = tex.getContext();
        var sw = 32;
        for (var i = 0; i < 128; i += sw) {
            ctx.fillStyle = (i / sw) % 2 === 0 ? "#333340" : "#e67e22";
            ctx.fillRect(0, i, 128, sw);
        }
        tex.update();
        tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        mat.diffuseTexture = tex;
        mat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        mat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        return mat;
    }

    // Left wall
    var leftWall = BABYLON.MeshBuilder.CreateBox("crusherL_" + gameRandom(), {
        width: segDir === "z" ? wallW : wallD,
        height: wallH,
        depth: segDir === "z" ? wallD : wallW
    }, scene);
    leftWall.parent = parent;
    leftWall.position.y = wallH / 2;
    if (segDir === "z") {
        leftWall.position.x = -openOffset;
    } else {
        leftWall.position.z = -openOffset;
    }
    leftWall.material = makeCrusherWallMat(gameRandom());
    shadowGen.addShadowCaster(leftWall);

    // Right wall
    var rightWall = BABYLON.MeshBuilder.CreateBox("crusherR_" + gameRandom(), {
        width: segDir === "z" ? wallW : wallD,
        height: wallH,
        depth: segDir === "z" ? wallD : wallW
    }, scene);
    rightWall.parent = parent;
    rightWall.position.y = wallH / 2;
    if (segDir === "z") {
        rightWall.position.x = openOffset;
    } else {
        rightWall.position.z = openOffset;
    }
    rightWall.material = makeCrusherWallMat(gameRandom());
    shadowGen.addShadowCaster(rightWall);

    // Spark particle system — emits on impact
    var sparks = new BABYLON.ParticleSystem("crushSparks_" + gameRandom(), 80, scene);
    sparks.particleTexture = _getCrusherSparkTex();
    sparks.emitter = new BABYLON.Vector3(x, wallH * 0.5, z);
    sparks.minSize = 0.08; sparks.maxSize = 0.25;
    sparks.minLifeTime = 0.15; sparks.maxLifeTime = 0.45;
    sparks.emitRate = 0;
    sparks.minEmitPower = 2.0; sparks.maxEmitPower = 5.0;
    sparks.gravity = new BABYLON.Vector3(0, -6, 0);
    // Sparks fly outward along road direction
    if (segDir === "z") {
        sparks.direction1 = new BABYLON.Vector3(-0.3, 1.5, -2.5);
        sparks.direction2 = new BABYLON.Vector3(0.3, 3.0, 2.5);
    } else {
        sparks.direction1 = new BABYLON.Vector3(-2.5, 1.5, -0.3);
        sparks.direction2 = new BABYLON.Vector3(2.5, 3.0, 0.3);
    }
    sparks.color1 = new BABYLON.Color4(1.0, 0.9, 0.4, 1.0);
    sparks.color2 = new BABYLON.Color4(1.0, 0.5, 0.1, 0.9);
    sparks.colorDead = new BABYLON.Color4(0.6, 0.2, 0.0, 0.0);
    sparks.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    sparks.start();

    // Properties for animation
    parent._crusher = true;
    parent._isObstacle = false;
    parent._segDir = segDir;
    parent._centerX = x;
    parent._centerZ = z;
    parent._wallLeft = leftWall;
    parent._wallRight = rightWall;
    parent._sparks = sparks;
    parent._openOffset = openOffset;
    parent._closedOffset = wallW / 2 + 0.02; // inner edges just barely touch
    parent._bounceOffset = 0.45; // how far walls bounce back after slam
    parent._crushPeriod = 2.0 + gameRandom() * 0.8;
    parent._crushPhase = gameRandom() * parent._crushPeriod;
    parent._wallHalfW = wallW / 2;
    parent._wallH = wallH;
    parent._wallD = wallD;
    parent._lastImpact = false; // track impact edge for particles
    parent._obstacleBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

    return parent;
}

// --- Moving Obstacle ---
function createMovingObstacle(x, z, segDir, roadWidth) {
    var barrier = createBarrierMesh(x, z, segDir, roadWidth);
    barrier._movingObstacle = true;
    barrier._segDir = segDir;
    barrier._moveAxis = segDir === "z" ? "x" : "z";
    barrier._moveCenter = barrier._moveAxis === "x" ? barrier.position.x : barrier.position.z;
    barrier._moveRange = roadWidth * 0.3;
    barrier._moveSpeed = 1.5 + gameRandom() * 1.5;
    barrier._movePhase = gameRandom() * Math.PI * 2;
    return barrier;
}

// --- Timed Barrier ---
function createTimedBarrier(x, z, segDir, roadWidth) {
    var barrier = createBarrierMesh(x, z, segDir, roadWidth);
    barrier._timedObstacle = true;
    barrier._timedPeriod = 2.0 + gameRandom() * 2.0;
    barrier._timedPhase = gameRandom() * barrier._timedPeriod;
    barrier._timedOpen = false;
    barrier._baseY = barrier.position.y;
    return barrier;
}

// --- Spinner (Dönen Bıçak) ---
function createSpinner(x, z, segDir, roadWidth, side) {
    var armLen = roadWidth * 0.38;
    var armW = 0.2, armH = 0.8;

    // Offset to one side so players can pass on the other edge
    var sideSign = (side === "left") ? -1 : 1;
    var lateralShift = roadWidth * 0.28 * sideSign;
    if (segDir === "z") { x += lateralShift; }
    else { z += lateralShift; }

    var parent = new BABYLON.TransformNode("spinner_" + gameRandom(), scene);
    parent.position = new BABYLON.Vector3(x, 0, z);

    // Center post
    var post = BABYLON.MeshBuilder.CreateCylinder("spinPost_" + gameRandom(), {
        diameter: 0.3, height: armH + 0.2, tessellation: 12
    }, scene);
    post.parent = parent;
    post.position.y = (armH + 0.2) / 2;
    var postMat = new BABYLON.StandardMaterial("spinPostMat_" + gameRandom(), scene);
    postMat.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.30);
    postMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    post.material = postMat;
    shadowGen.addShadowCaster(post);

    // Create arm material with dark metal + red/yellow striped tips
    function makeArmMesh(name, dirX, dirZ) {
        var arm = BABYLON.MeshBuilder.CreateBox(name, {
            width: Math.abs(dirX) > 0 ? armLen * 2 : armW,
            height: armH,
            depth: Math.abs(dirZ) > 0 ? armLen * 2 : armW
        }, scene);
        arm.parent = parent;
        arm.position.y = armH / 2;
        var mat = new BABYLON.StandardMaterial("spinArmMat_" + gameRandom(), scene);
        var tex = new BABYLON.DynamicTexture("spinArmTex_" + gameRandom(), 128, scene);
        var ctx = tex.getContext();
        // Dark metal base with red/yellow tips
        ctx.fillStyle = "#333340";
        ctx.fillRect(0, 0, 128, 128);
        // Red/yellow stripes at edges (tips)
        for (var s = 0; s < 20; s += 8) {
            ctx.fillStyle = s % 16 === 0 ? "#e74c3c" : "#f1c40f";
            ctx.fillRect(s, 0, 8, 128);
            ctx.fillRect(128 - 20 + s, 0, 8, 128);
        }
        tex.update();
        mat.diffuseTexture = tex;
        mat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        arm.material = mat;
        shadowGen.addShadowCaster(arm);
        return arm;
    }

    // Two cross-shaped arms
    makeArmMesh("spinArm1_" + gameRandom(), 1, 0);
    makeArmMesh("spinArm2_" + gameRandom(), 0, 1);

    parent._spinner = true;
    parent._isObstacle = true;
    parent._spinSpeed = 1.5 + gameRandom() * 1.0;
    parent._spinPhase = gameRandom() * Math.PI * 2;
    parent._armReach = armLen;
    parent._centerX = x;
    parent._centerZ = z;
    parent._obstacleBounds = {
        minX: x - armLen - 0.3,
        maxX: x + armLen + 0.3,
        minZ: z - armLen - 0.3,
        maxZ: z + armLen + 0.3
    };

    return parent;
}

// --- Flame Jet (Alev Fışkırtıcı) ---
function createFlameJet(x, z, segDir, roadWidth, side) {
    var lateralOffset = side === "left" ? -roadWidth * 0.2 : roadWidth * 0.2;
    var gx = segDir === "z" ? x + lateralOffset : x;
    var gz = segDir === "z" ? z : z + lateralOffset;

    var parent = new BABYLON.TransformNode("flameJet_" + gameRandom(), scene);
    parent.position = new BABYLON.Vector3(gx, 0, gz);

    // Metal grate base
    var grate = BABYLON.MeshBuilder.CreateBox("flameGrate_" + gameRandom(), {
        width: 1.2, height: 0.1, depth: 1.2
    }, scene);
    grate.parent = parent;
    grate.position.y = 0.05;
    var grateMat = new BABYLON.StandardMaterial("flameGrateMat_" + gameRandom(), scene);
    grateMat.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.38);
    grateMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    grateMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    grate.material = grateMat;
    shadowGen.addShadowCaster(grate);

    // Flame particle system
    var flames = new BABYLON.ParticleSystem("flames_" + gameRandom(), 120, scene);
    flames.particleTexture = _getFlameParticleTex();
    flames.emitter = new BABYLON.Vector3(gx, 0.15, gz);
    flames.minSize = 0.15; flames.maxSize = 0.5;
    flames.minLifeTime = 0.2; flames.maxLifeTime = 0.6;
    flames.emitRate = 0; // starts off
    flames.minEmitPower = 3.0; flames.maxEmitPower = 6.0;
    flames.direction1 = new BABYLON.Vector3(-0.3, 1, -0.3);
    flames.direction2 = new BABYLON.Vector3(0.3, 1, 0.3);
    flames.gravity = new BABYLON.Vector3(0, 2, 0);
    flames.color1 = new BABYLON.Color4(1.0, 0.8, 0.2, 1.0);
    flames.color2 = new BABYLON.Color4(1.0, 0.3, 0.0, 0.8);
    flames.colorDead = new BABYLON.Color4(0.5, 0.1, 0.0, 0.0);
    flames.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    flames.start();

    parent._flameJet = true;
    parent._isObstacle = false;
    parent._grate = grate;
    parent._flames = flames;
    parent._flamePeriod = 2.5 + gameRandom() * 1.5;
    parent._flamePhase = gameRandom() * parent._flamePeriod;
    parent._centerX = gx;
    parent._centerZ = gz;
    parent._obstacleBounds = {
        minX: gx - 0.8,
        maxX: gx + 0.8,
        minZ: gz - 0.8,
        maxZ: gz + 0.8
    };

    return parent;
}

// --- Rolling Boulder (Yuvarlanan Kaya) ---
function createRollingBoulder(x, z, segDir, roadWidth) {
    var radius = 0.9;

    var sphere = BABYLON.MeshBuilder.CreateSphere("boulder_" + gameRandom(), {
        diameter: radius * 2, segments: 12
    }, scene);
    sphere.position = new BABYLON.Vector3(x, radius, z);

    var mat = new BABYLON.StandardMaterial("boulderMat_" + gameRandom(), scene);
    var tex = new BABYLON.DynamicTexture("boulderTex_" + gameRandom(), 128, scene);
    var ctx = tex.getContext();
    // Stone texture - mottled grey/brown
    ctx.fillStyle = "#8a8070";
    ctx.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 40; i++) {
        var bx = Math.floor(Math.random() * 120);
        var by = Math.floor(Math.random() * 120);
        var bs = 4 + Math.floor(Math.random() * 12);
        ctx.fillStyle = Math.random() > 0.5 ? "#706858" : "#9a9080";
        ctx.fillRect(bx, by, bs, bs);
    }
    tex.update();
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    sphere.material = mat;
    shadowGen.addShadowCaster(sphere);

    // Dust trail particle system
    var dust = new BABYLON.ParticleSystem("boulderDust_" + gameRandom(), 30, scene);
    dust.particleTexture = _getDustParticleTex();
    dust.emitter = sphere;
    dust.minSize = 0.1; dust.maxSize = 0.3;
    dust.minLifeTime = 0.3; dust.maxLifeTime = 0.8;
    dust.emitRate = 8;
    dust.minEmitPower = 0.3; dust.maxEmitPower = 0.8;
    dust.direction1 = new BABYLON.Vector3(-0.5, 0.2, -0.5);
    dust.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
    dust.gravity = new BABYLON.Vector3(0, -1, 0);
    dust.color1 = new BABYLON.Color4(0.7, 0.6, 0.5, 0.6);
    dust.color2 = new BABYLON.Color4(0.6, 0.5, 0.4, 0.4);
    dust.colorDead = new BABYLON.Color4(0.5, 0.4, 0.3, 0.0);
    dust.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    dust.start();

    sphere._boulder = true;
    sphere._isObstacle = true;
    sphere._segDir = segDir;
    sphere._moveAxis = segDir === "z" ? "x" : "z";
    sphere._moveCenter = sphere._moveAxis === "x" ? x : z;
    sphere._rollSpeed = 2.0 + gameRandom() * 1.5;
    sphere._rollPhase = gameRandom() * Math.PI * 2;
    sphere._rollRange = roadWidth * 0.3;
    sphere._radius = radius;
    sphere._dust = dust;
    sphere._obstacleBounds = {
        minX: x - radius - 0.3,
        maxX: x + radius + 0.3,
        minZ: z - radius - 0.3,
        maxZ: z + radius + 0.3
    };

    return sphere;
}

// --- Piston / Stomper ---
function createPiston(x, z, segDir, roadWidth) {
    var pistonW = roadWidth * 0.5;
    var pistonH = 1.5;
    var pistonD = 1.0;

    var parent = new BABYLON.TransformNode("piston_" + gameRandom(), scene);
    parent.position = new BABYLON.Vector3(x, 0, z);

    // Piston head (yellow/black hazard stripes)
    var head = BABYLON.MeshBuilder.CreateBox("pistonHead_" + gameRandom(), {
        width: segDir === "z" ? pistonW : pistonD,
        height: pistonH,
        depth: segDir === "z" ? pistonD : pistonW
    }, scene);
    head.parent = parent;
    head.position.y = 3.5 + pistonH / 2; // starts up
    var headMat = new BABYLON.StandardMaterial("pistonHeadMat_" + gameRandom(), scene);
    var headTex = new BABYLON.DynamicTexture("pistonHeadTex_" + gameRandom(), 128, scene);
    var ctx = headTex.getContext();
    var sw = 16;
    for (var i = 0; i < 128; i += sw) {
        ctx.fillStyle = (i / sw) % 2 === 0 ? "#f1c40f" : "#2c2c2c";
        ctx.fillRect(0, i, 128, sw);
    }
    headTex.update();
    headTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    headTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    headMat.diffuseTexture = headTex;
    headMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    headMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    head.material = headMat;
    shadowGen.addShadowCaster(head);

    // Support rod (thin cylinder above)
    var rod = BABYLON.MeshBuilder.CreateCylinder("pistonRod_" + gameRandom(), {
        diameter: 0.25, height: 3.0, tessellation: 8
    }, scene);
    rod.parent = parent;
    rod.position.y = 5.5;
    var rodMat = new BABYLON.StandardMaterial("pistonRodMat_" + gameRandom(), scene);
    rodMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.32);
    rodMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    rod.material = rodMat;
    shadowGen.addShadowCaster(rod);

    // Impact debris particle system
    var impact = new BABYLON.ParticleSystem("pistonImpact_" + gameRandom(), 60, scene);
    impact.particleTexture = _getDebrisParticleTex();
    impact.emitter = new BABYLON.Vector3(x, 0.5, z);
    impact.minSize = 0.08; impact.maxSize = 0.2;
    impact.minLifeTime = 0.2; impact.maxLifeTime = 0.5;
    impact.emitRate = 0;
    impact.minEmitPower = 2.0; impact.maxEmitPower = 4.0;
    impact.direction1 = new BABYLON.Vector3(-2, 1, -2);
    impact.direction2 = new BABYLON.Vector3(2, 3, 2);
    impact.gravity = new BABYLON.Vector3(0, -8, 0);
    impact.color1 = new BABYLON.Color4(0.8, 0.8, 0.7, 1.0);
    impact.color2 = new BABYLON.Color4(0.6, 0.6, 0.5, 0.8);
    impact.colorDead = new BABYLON.Color4(0.4, 0.4, 0.3, 0.0);
    impact.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    impact.start();

    parent._piston = true;
    parent._isObstacle = false;
    parent._head = head;
    parent._rod = rod;
    parent._impact = impact;
    parent._pistonW = pistonW;
    parent._pistonH = pistonH;
    parent._pistonD = pistonD;
    parent._segDir = segDir;
    parent._centerX = x;
    parent._centerZ = z;
    parent._pistonPeriod = 2.5 + gameRandom() * 1.0;
    parent._pistonPhase = gameRandom() * parent._pistonPeriod;
    parent._lastSlamImpact = false;
    parent._obstacleBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

    return parent;
}

// --- Laser Beam ---
function createLaser(x, z, segDir, roadWidth) {
    var parent = new BABYLON.TransformNode("laser_" + gameRandom(), scene);
    parent.position = new BABYLON.Vector3(x, 0, z);

    var postRadius = 0.12;
    var postHeight = 2.8;
    var postOffset = roadWidth * 0.35;

    // Left post
    var leftPost = BABYLON.MeshBuilder.CreateCylinder("laserPostL_" + gameRandom(), {
        diameter: postRadius * 2, height: postHeight, tessellation: 8
    }, scene);
    leftPost.parent = parent;
    leftPost.position.y = postHeight / 2;
    if (segDir === "z") { leftPost.position.x = -postOffset; }
    else { leftPost.position.z = -postOffset; }
    var postMat = new BABYLON.StandardMaterial("laserPostMat_" + gameRandom(), scene);
    postMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    postMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    leftPost.material = postMat;
    shadowGen.addShadowCaster(leftPost);

    // Right post
    var rightPost = BABYLON.MeshBuilder.CreateCylinder("laserPostR_" + gameRandom(), {
        diameter: postRadius * 2, height: postHeight, tessellation: 8
    }, scene);
    rightPost.parent = parent;
    rightPost.position.y = postHeight / 2;
    if (segDir === "z") { rightPost.position.x = postOffset; }
    else { rightPost.position.z = postOffset; }
    var postMat2 = new BABYLON.StandardMaterial("laserPostMat2_" + gameRandom(), scene);
    postMat2.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    postMat2.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    rightPost.material = postMat2;
    shadowGen.addShadowCaster(rightPost);

    // Beam (thin box between posts)
    var beamLen = postOffset * 2;
    var beam = BABYLON.MeshBuilder.CreateBox("laserBeam_" + gameRandom(), {
        width: segDir === "z" ? beamLen : 0.08,
        height: 0.08,
        depth: segDir === "z" ? 0.08 : beamLen
    }, scene);
    beam.parent = parent;
    beam.position.y = 1.2; // start mid-height
    var beamMat = new BABYLON.StandardMaterial("laserBeamMat_" + gameRandom(), scene);
    beamMat.diffuseColor = new BABYLON.Color3(1.0, 0.1, 0.1);
    beamMat.emissiveColor = new BABYLON.Color3(1.0, 0.1, 0.1);
    beamMat.specularColor = new BABYLON.Color3(0.8, 0.2, 0.2);
    beamMat.alpha = 0.7;
    beam.material = beamMat;

    parent._laser = true;
    parent._isObstacle = false;
    parent._beam = beam;
    parent._beamMat = beamMat;
    parent._segDir = segDir;
    parent._centerX = x;
    parent._centerZ = z;
    parent._laserSpeed = 1.2 + gameRandom() * 0.8;
    parent._laserPhase = gameRandom() * Math.PI * 2;
    parent._postOffset = postOffset;
    parent._obstacleBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

    return parent;
}

// --- Speed Zone ---
function createSpeedZone(x, z, segDir, roadWidth) {
    var zoneWidth = segDir === "z" ? roadWidth * 0.8 : 3;
    var zoneDepth = segDir === "z" ? 3 : roadWidth * 0.8;
    var zone = BABYLON.MeshBuilder.CreateBox("speedZone_" + gameRandom(), {
        width: zoneWidth, height: 0.1, depth: zoneDepth
    }, scene);
    zone.position = new BABYLON.Vector3(x, 0.06, z);
    var mat = new BABYLON.StandardMaterial("speedZoneMat_" + gameRandom(), scene);
    mat.diffuseColor = new BABYLON.Color3(0, 1, 0.5);
    mat.emissiveColor = new BABYLON.Color3(0, 0.5, 0.25);
    mat.alpha = 0.5;
    zone.material = mat;
    zone._isSpeedZone = true;
    zone._boostMultiplier = 1.5;
    zone._isObstacle = false;
    zone._obstacleBounds = {
        minX: x - zoneWidth / 2,
        maxX: x + zoneWidth / 2,
        minZ: z - zoneDepth / 2,
        maxZ: z + zoneDepth / 2,
    };
    return zone;
}

function spawnObstacleForSegment(seg) {
    // --- Manual barrier placements from level config ---
    if (levelMode && currentLevelConfig && currentLevelConfig.barriers) {
        var barriers = currentLevelConfig.barriers;
        var meshes = [];
        for (var bi = 0; bi < barriers.length; bi++) {
            if (barriers[bi].segment === seg.index) {
                var frac = barriers[bi].frac || 0.5;
                var ox, oz;
                if (seg.dir === "z") { ox = seg.startX; oz = seg.startZ + seg.length * frac; }
                else { ox = seg.startX + seg.length * frac; oz = seg.startZ; }
                var b = barriers[bi].laser
                    ? createLaser(ox, oz, seg.dir, CONFIG.ROAD_WIDTH)
                    : barriers[bi].piston
                    ? createPiston(ox, oz, seg.dir, CONFIG.ROAD_WIDTH)
                    : barriers[bi].boulder
                    ? createRollingBoulder(ox, oz, seg.dir, CONFIG.ROAD_WIDTH)
                    : barriers[bi].flameJet
                    ? createFlameJet(ox, oz, seg.dir, CONFIG.ROAD_WIDTH, barriers[bi].side)
                    : barriers[bi].spinner
                    ? createSpinner(ox, oz, seg.dir, CONFIG.ROAD_WIDTH, barriers[bi].side || "right")
                    : barriers[bi].crusher
                    ? createCrusher(ox, oz, seg.dir, CONFIG.ROAD_WIDTH)
                    : barriers[bi].axe
                    ? createSwingingAxe(ox, oz, seg.dir, CONFIG.ROAD_WIDTH, barriers[bi].side)
                    : barriers[bi].moving
                    ? createMovingSideBarrier(ox, oz, seg.dir, CONFIG.ROAD_WIDTH, barriers[bi].side)
                    : createSideBarrier(ox, oz, seg.dir, CONFIG.ROAD_WIDTH, barriers[bi].side);
                meshes.push(b);
            }
        }
        if (meshes.length > 0) return meshes;
    }

    var grace = 5;
    var chance = 0.20;
    if (levelMode && currentLevelConfig) {
        grace = currentLevelConfig.obstacleGracePeriod || 5;
        chance = currentLevelConfig.obstacleChance;
    }
    if (seg.index <= grace) return [];
    if (chance <= 0) return [];
    if (gameRandom() > chance) return [];

    var meshes = [];
    var frac = 0.3 + gameRandom() * 0.4;
    var ox, oz;

    if (seg.dir === "z") {
        ox = seg.startX;
        oz = seg.startZ + seg.length * frac;
    } else {
        ox = seg.startX + seg.length * frac;
        oz = seg.startZ;
    }

    var roll = gameRandom();

    if (levelMode && currentLevelConfig) {
        var cfg = currentLevelConfig;
        // Speed zone (check first, can coexist)
        if (cfg.speedZones && gameRandom() < 0.2) {
            var sz = createSpeedZone(ox, oz, seg.dir, CONFIG.ROAD_WIDTH);
            meshes.push(sz);
            seg.meshes.push(sz);
            return meshes;
        }
        // Moving obstacle
        if (cfg.movingObstacles && roll < 0.5) {
            var mo = createMovingObstacle(ox, oz, seg.dir, CONFIG.ROAD_WIDTH);
            meshes.push(mo);
            return meshes;
        }
        // Timed barrier
        if (cfg.timedBarriers && roll < 0.7) {
            var tb = createTimedBarrier(ox, oz, seg.dir, CONFIG.ROAD_WIDTH);
            meshes.push(tb);
            return meshes;
        }
    }

    if (gameRandom() < 0.6) {
        var barrier = createBarrierMesh(ox, oz, seg.dir, CONFIG.ROAD_WIDTH);
        meshes.push(barrier);
    } else {
        var cones = createConeMeshes(ox, oz, seg.dir, CONFIG.ROAD_WIDTH);
        meshes.push(...cones);
    }

    return meshes;
}

function checkObstacleCollision(carX, carZ, obstacles) {
    for (const obs of obstacles) {
        if (!obs._isObstacle || obs.isDisposed()) continue;
        const b = obs._obstacleBounds;
        if (carX >= b.minX && carX <= b.maxX && carZ >= b.minZ && carZ <= b.maxZ) {
            return true;
        }
    }
    return false;
}

// --- Check speed zone ---
function checkSpeedZone(carX, carZ, obstacles) {
    for (var i = 0; i < obstacles.length; i++) {
        var obs = obstacles[i];
        if (!obs._isSpeedZone || obs.isDisposed()) continue;
        var b = obs._obstacleBounds;
        if (carX >= b.minX && carX <= b.maxX && carZ >= b.minZ && carZ <= b.maxZ) {
            return obs._boostMultiplier;
        }
    }
    return 1.0;
}

// --- Update dynamic obstacles ---
function updateDynamicObstacles(dt) {
    if (!levelMode) return;
    var now = performance.now() / 1000;

    for (var si = 0; si < segments.length; si++) {
        var seg = segments[si];
        if (!seg.obstacles) continue;

        for (var oi = 0; oi < seg.obstacles.length; oi++) {
            var obs = seg.obstacles[oi];
            if (obs.isDisposed()) continue;

            // Moving obstacles
            if (obs._movingObstacle) {
                var newPos = obs._moveCenter + Math.sin(now * obs._moveSpeed + obs._movePhase) * obs._moveRange;
                if (obs._moveAxis === "x") {
                    obs.position.x = newPos;
                } else {
                    obs.position.z = newPos;
                }
                // Update collision bounds (use _segDir to get correct width/depth)
                var sd = obs._segDir || "z";
                var hw = (sd === "z" ? OBSTACLE_TYPES[0].width : OBSTACLE_TYPES[0].depth) / 2;
                var hd = (sd === "z" ? OBSTACLE_TYPES[0].depth : OBSTACLE_TYPES[0].width) / 2;
                obs._obstacleBounds.minX = obs.position.x - hw - 0.3;
                obs._obstacleBounds.maxX = obs.position.x + hw + 0.3;
                obs._obstacleBounds.minZ = obs.position.z - hd - 0.3;
                obs._obstacleBounds.maxZ = obs.position.z + hd + 0.3;
            }

            // Swinging axes
            if (obs._swingingAxe) {
                var angle = Math.sin(now * obs._swingSpeed + obs._swingPhase) * obs._swingRange;
                if (obs._segDir === "z") {
                    obs.rotation.z = angle;
                } else {
                    obs.rotation.x = angle;
                }
                // Compute blade center world position
                var bladeX = obs._pivotX;
                var bladeZ = obs._pivotZ;
                if (obs._segDir === "z") {
                    bladeX = obs._pivotX + Math.sin(angle) * obs._armLength;
                } else {
                    bladeZ = obs._pivotZ + Math.sin(angle) * obs._armLength;
                }
                // Blade Y — pendulum rises when swinging to sides
                var bladeY = 4.0 - Math.cos(angle) * obs._armLength;
                // Only collide when blade is near road level (car height ~1.2)
                if (bladeY < 1.5) {
                    obs._isObstacle = true;
                    var bhw = obs._segDir === "z" ? obs._bladeHalfW : obs._bladeHalfD;
                    var bhd = obs._segDir === "z" ? obs._bladeHalfD : obs._bladeHalfW;
                    obs._obstacleBounds.minX = bladeX - bhw - 0.3;
                    obs._obstacleBounds.maxX = bladeX + bhw + 0.3;
                    obs._obstacleBounds.minZ = bladeZ - bhd - 0.3;
                    obs._obstacleBounds.maxZ = bladeZ + bhd + 0.3;
                } else {
                    obs._isObstacle = false;
                }
            }

            // Crushers — polished with bounce-back + spark particles
            if (obs._crusher) {
                var cycle = ((now + obs._crushPhase) % obs._crushPeriod) / obs._crushPeriod;
                var curOffset;
                var isImpactFrame = false;
                var emissiveFlash = 0;

                if (cycle < 0.48) {
                    // OPEN — walls apart, safe
                    curOffset = obs._openOffset;
                    obs._isObstacle = false;
                } else if (cycle < 0.56) {
                    // SLAMMING — ease-in (accelerate into impact)
                    var t = (cycle - 0.48) / 0.08;
                    t = t * t * t; // cubic ease-in: slow start, fast finish
                    curOffset = obs._openOffset + (obs._closedOffset - obs._openOffset) * t;
                    obs._isObstacle = t > 0.7;
                } else if (cycle < 0.60) {
                    // IMPACT BOUNCE — walls recoil outward then settle
                    var t = (cycle - 0.56) / 0.04;
                    // Damped sine bounce: sharp outward then back
                    var bounce = Math.sin(t * Math.PI) * obs._bounceOffset * Math.exp(-t * 2.0);
                    curOffset = obs._closedOffset + bounce;
                    obs._isObstacle = true;
                    emissiveFlash = (1.0 - t) * 0.6; // flash fades
                    if (!obs._lastImpact) isImpactFrame = true;
                } else if (cycle < 0.62) {
                    // SETTLE — small secondary bounce
                    var t = (cycle - 0.60) / 0.02;
                    var bounce2 = Math.sin(t * Math.PI) * obs._bounceOffset * 0.15;
                    curOffset = obs._closedOffset + bounce2;
                    obs._isObstacle = true;
                } else if (cycle < 0.80) {
                    // CLOSED — walls locked together
                    curOffset = obs._closedOffset;
                    obs._isObstacle = true;
                } else {
                    // OPENING — smooth ease-out
                    var t2 = (cycle - 0.80) / 0.20;
                    t2 = 1.0 - (1.0 - t2) * (1.0 - t2); // quadratic ease-out
                    curOffset = obs._closedOffset + (obs._openOffset - obs._closedOffset) * t2;
                    obs._isObstacle = t2 < 0.25;
                }

                // Track impact edge for one-shot particle burst
                obs._lastImpact = (cycle >= 0.56 && cycle < 0.62);

                // Position walls
                if (obs._segDir === "z") {
                    obs._wallLeft.position.x = -curOffset;
                    obs._wallRight.position.x = curOffset;
                } else {
                    obs._wallLeft.position.z = -curOffset;
                    obs._wallRight.position.z = curOffset;
                }

                // Impact shake — small Y jitter on walls
                if (cycle >= 0.56 && cycle < 0.62) {
                    var shake = Math.sin(now * 80) * 0.04 * (1.0 - (cycle - 0.56) / 0.06);
                    obs._wallLeft.position.y = obs._wallH / 2 + shake;
                    obs._wallRight.position.y = obs._wallH / 2 - shake;
                } else {
                    obs._wallLeft.position.y = obs._wallH / 2;
                    obs._wallRight.position.y = obs._wallH / 2;
                }

                // Emissive flash on impact
                if (emissiveFlash > 0) {
                    var ec = emissiveFlash;
                    obs._wallLeft.material.emissiveColor.r = ec * 1.0;
                    obs._wallLeft.material.emissiveColor.g = ec * 0.5;
                    obs._wallLeft.material.emissiveColor.b = ec * 0.1;
                    obs._wallRight.material.emissiveColor.r = ec * 1.0;
                    obs._wallRight.material.emissiveColor.g = ec * 0.5;
                    obs._wallRight.material.emissiveColor.b = ec * 0.1;
                } else {
                    obs._wallLeft.material.emissiveColor.r = 0;
                    obs._wallLeft.material.emissiveColor.g = 0;
                    obs._wallLeft.material.emissiveColor.b = 0;
                    obs._wallRight.material.emissiveColor.r = 0;
                    obs._wallRight.material.emissiveColor.g = 0;
                    obs._wallRight.material.emissiveColor.b = 0;
                }

                // Spark burst on impact frame
                if (isImpactFrame && obs._sparks) {
                    obs._sparks.emitter.x = obs._centerX;
                    obs._sparks.emitter.z = obs._centerZ;
                    obs._sparks.manualEmitCount = 35;
                }

                // Update collision bounds when obstacle is active
                if (obs._isObstacle) {
                    var cx = obs._centerX;
                    var cz = obs._centerZ;
                    if (obs._segDir === "z") {
                        obs._obstacleBounds.minX = cx - curOffset - obs._wallHalfW;
                        obs._obstacleBounds.maxX = cx + curOffset + obs._wallHalfW;
                        obs._obstacleBounds.minZ = cz - obs._wallD / 2 - 0.3;
                        obs._obstacleBounds.maxZ = cz + obs._wallD / 2 + 0.3;
                    } else {
                        obs._obstacleBounds.minX = cx - obs._wallD / 2 - 0.3;
                        obs._obstacleBounds.maxX = cx + obs._wallD / 2 + 0.3;
                        obs._obstacleBounds.minZ = cz - curOffset - obs._wallHalfW;
                        obs._obstacleBounds.maxZ = cz + curOffset + obs._wallHalfW;
                    }
                }
            }

            // Timed barriers
            if (obs._timedObstacle) {
                var cycle = ((now + obs._timedPhase) % obs._timedPeriod) / obs._timedPeriod;
                var shouldBeOpen = cycle > 0.5;
                if (shouldBeOpen !== obs._timedOpen) {
                    obs._timedOpen = shouldBeOpen;
                    if (shouldBeOpen) {
                        obs._isObstacle = false;
                        gsap.to(obs.position, { y: obs._baseY - OBSTACLE_TYPES[0].height - 0.5, duration: 0.3 });
                        gsap.to(obs.material, { alpha: 0.3, duration: 0.3 });
                    } else {
                        obs._isObstacle = true;
                        gsap.to(obs.position, { y: obs._baseY, duration: 0.3 });
                        gsap.to(obs.material, { alpha: 1, duration: 0.3 });
                    }
                }
            }

            // Spinners — rotate around Y axis
            if (obs._spinner) {
                obs.rotation.y = now * obs._spinSpeed + obs._spinPhase;
                // Circular AABB always active — covers arm reach
                obs._isObstacle = true;
            }

            // Flame Jets — cycle on/off
            if (obs._flameJet) {
                var fjCycle = ((now + obs._flamePhase) % obs._flamePeriod) / obs._flamePeriod;
                var flameActive = fjCycle < 0.4; // 40% active, 60% safe
                if (flameActive) {
                    obs._isObstacle = true;
                    if (obs._flames) obs._flames.emitRate = 100;
                    // Grate emissive glow
                    if (obs._grate && obs._grate.material) {
                        var glow = 0.4 + Math.sin(now * 8) * 0.15;
                        obs._grate.material.emissiveColor.r = glow;
                        obs._grate.material.emissiveColor.g = glow * 0.4;
                        obs._grate.material.emissiveColor.b = 0;
                    }
                } else {
                    obs._isObstacle = false;
                    if (obs._flames) obs._flames.emitRate = 0;
                    if (obs._grate && obs._grate.material) {
                        obs._grate.material.emissiveColor.r = 0;
                        obs._grate.material.emissiveColor.g = 0;
                        obs._grate.material.emissiveColor.b = 0;
                    }
                }
            }

            // Rolling Boulders — lateral movement + visual rotation
            if (obs._boulder) {
                var bNewPos = obs._moveCenter + Math.sin(now * obs._rollSpeed + obs._rollPhase) * obs._rollRange;
                var bOldPos = obs._moveAxis === "x" ? obs.position.x : obs.position.z;
                if (obs._moveAxis === "x") {
                    obs.position.x = bNewPos;
                    obs.rotation.z -= (bNewPos - bOldPos) / obs._radius; // visual roll
                } else {
                    obs.position.z = bNewPos;
                    obs.rotation.x += (bNewPos - bOldPos) / obs._radius;
                }
                var r = obs._radius;
                obs._obstacleBounds.minX = obs.position.x - r - 0.3;
                obs._obstacleBounds.maxX = obs.position.x + r + 0.3;
                obs._obstacleBounds.minZ = obs.position.z - r - 0.3;
                obs._obstacleBounds.maxZ = obs.position.z + r + 0.3;
            }

            // Pistons — double-slam cycle: SLAM1 → short pause → SLAM2 → long wait
            // 0.00-0.06 slam1 down | 0.06-0.09 slam1 bounce | 0.09-0.14 slam1 hold
            // 0.14-0.22 rise1      | 0.22-0.28 brief pause (up)
            // 0.28-0.34 slam2 down | 0.34-0.37 slam2 bounce | 0.37-0.42 slam2 hold
            // 0.42-0.52 rise2      | 0.52-1.00 long wait (up, safe)
            if (obs._piston) {
                var pCycle = ((now + obs._pistonPhase) % obs._pistonPeriod) / obs._pistonPeriod;
                var headY;
                var pistonImpactFrame = false;
                var pistonEmFlash = 0;
                var upY = 3.5 + obs._pistonH / 2;
                var downY = 0.75 + obs._pistonH / 2;

                if (pCycle < 0.06) {
                    // SLAM 1 DOWN — cubic ease-in
                    var pt = pCycle / 0.06;
                    pt = pt * pt * pt;
                    headY = upY + (downY - upY) * pt;
                    obs._isObstacle = pt > 0.8;
                } else if (pCycle < 0.09) {
                    // SLAM 1 BOUNCE
                    var pt2 = (pCycle - 0.06) / 0.03;
                    var pBounce = Math.sin(pt2 * Math.PI) * 0.4 * Math.exp(-pt2 * 2.0);
                    headY = downY - pBounce;
                    obs._isObstacle = true;
                    pistonEmFlash = (1.0 - pt2) * 0.6;
                    if (!obs._lastSlamImpact) pistonImpactFrame = true;
                } else if (pCycle < 0.14) {
                    // SLAM 1 HOLD
                    headY = downY;
                    obs._isObstacle = true;
                } else if (pCycle < 0.22) {
                    // RISE 1
                    var pt3 = (pCycle - 0.14) / 0.08;
                    pt3 = 1.0 - (1.0 - pt3) * (1.0 - pt3);
                    headY = downY + (upY - downY) * pt3;
                    obs._isObstacle = pt3 < 0.2;
                } else if (pCycle < 0.28) {
                    // BRIEF PAUSE (up, safe)
                    headY = upY;
                    obs._isObstacle = false;
                } else if (pCycle < 0.34) {
                    // SLAM 2 DOWN — cubic ease-in
                    var pt4 = (pCycle - 0.28) / 0.06;
                    pt4 = pt4 * pt4 * pt4;
                    headY = upY + (downY - upY) * pt4;
                    obs._isObstacle = pt4 > 0.8;
                } else if (pCycle < 0.37) {
                    // SLAM 2 BOUNCE
                    var pt5 = (pCycle - 0.34) / 0.03;
                    var pBounce2 = Math.sin(pt5 * Math.PI) * 0.4 * Math.exp(-pt5 * 2.0);
                    headY = downY - pBounce2;
                    obs._isObstacle = true;
                    pistonEmFlash = (1.0 - pt5) * 0.6;
                    if (!obs._lastSlamImpact) pistonImpactFrame = true;
                } else if (pCycle < 0.42) {
                    // SLAM 2 HOLD
                    headY = downY;
                    obs._isObstacle = true;
                } else if (pCycle < 0.52) {
                    // RISE 2
                    var pt6 = (pCycle - 0.42) / 0.10;
                    pt6 = 1.0 - (1.0 - pt6) * (1.0 - pt6);
                    headY = downY + (upY - downY) * pt6;
                    obs._isObstacle = pt6 < 0.2;
                } else {
                    // LONG WAIT — safe
                    headY = upY;
                    obs._isObstacle = false;
                }

                obs._lastSlamImpact = (pCycle >= 0.06 && pCycle < 0.09) || (pCycle >= 0.34 && pCycle < 0.37);
                if (obs._head) obs._head.position.y = headY;
                if (obs._rod) obs._rod.position.y = headY + obs._pistonH / 2 + 1.5;

                // Emissive flash on slam
                if (pistonEmFlash > 0 && obs._head && obs._head.material) {
                    obs._head.material.emissiveColor.r = pistonEmFlash * 1.0;
                    obs._head.material.emissiveColor.g = pistonEmFlash * 0.7;
                    obs._head.material.emissiveColor.b = 0;
                } else if (obs._head && obs._head.material) {
                    obs._head.material.emissiveColor.r = 0;
                    obs._head.material.emissiveColor.g = 0;
                    obs._head.material.emissiveColor.b = 0;
                }

                // Impact debris burst
                if (pistonImpactFrame && obs._impact) {
                    obs._impact.manualEmitCount = 25;
                }

                // Update collision bounds when active
                if (obs._isObstacle) {
                    var phw = (obs._segDir === "z" ? obs._pistonW : obs._pistonD) / 2;
                    var phd = (obs._segDir === "z" ? obs._pistonD : obs._pistonW) / 2;
                    obs._obstacleBounds.minX = obs._centerX - phw - 0.3;
                    obs._obstacleBounds.maxX = obs._centerX + phw + 0.3;
                    obs._obstacleBounds.minZ = obs._centerZ - phd - 0.3;
                    obs._obstacleBounds.maxZ = obs._centerZ + phd + 0.3;
                }
            }

            // Lasers — beam sweeps vertically
            if (obs._laser) {
                var beamY = 0.3 + (Math.sin(now * obs._laserSpeed + obs._laserPhase) * 0.5 + 0.5) * 1.9; // 0.3 to 2.2
                if (obs._beam) obs._beam.position.y = beamY;

                // Pulsing glow
                if (obs._beamMat) {
                    var pulse = 0.7 + Math.sin(now * 6) * 0.3;
                    obs._beamMat.emissiveColor.r = pulse;
                    obs._beamMat.alpha = 0.5 + pulse * 0.2;
                }

                // Collision only when beam Y < 1.3 (car height)
                if (beamY < 1.3) {
                    obs._isObstacle = true;
                    if (obs._segDir === "z") {
                        obs._obstacleBounds.minX = obs._centerX - obs._postOffset - 0.2;
                        obs._obstacleBounds.maxX = obs._centerX + obs._postOffset + 0.2;
                        obs._obstacleBounds.minZ = obs._centerZ - 0.3;
                        obs._obstacleBounds.maxZ = obs._centerZ + 0.3;
                    } else {
                        obs._obstacleBounds.minX = obs._centerX - 0.3;
                        obs._obstacleBounds.maxX = obs._centerX + 0.3;
                        obs._obstacleBounds.minZ = obs._centerZ - obs._postOffset - 0.2;
                        obs._obstacleBounds.maxZ = obs._centerZ + obs._postOffset + 0.2;
                    }
                } else {
                    obs._isObstacle = false;
                }
            }
        }
    }
}

// ===== ZONE SYSTEM =====

// --- Shared Ice Particle Texture ---
var _iceParticleTex = null;
function _getIceParticleTex() {
    if (_iceParticleTex && !_iceParticleTex.isDisposed) return _iceParticleTex;
    _iceParticleTex = new BABYLON.DynamicTexture("icePTex", 64, scene);
    var ctx = _iceParticleTex.getContext();
    var grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, "rgba(200,230,255,1)");
    grad.addColorStop(0.4, "rgba(160,210,255,0.6)");
    grad.addColorStop(1, "rgba(120,180,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    _iceParticleTex.update();
    return _iceParticleTex;
}
function _resetIceParticleTex() { _iceParticleTex = null; }

// --- Shared Wind Particle Texture ---
var _windParticleTex = null;
function _getWindParticleTex() {
    if (_windParticleTex && !_windParticleTex.isDisposed) return _windParticleTex;
    _windParticleTex = new BABYLON.DynamicTexture("windPTex", 64, scene);
    var ctx = _windParticleTex.getContext();
    ctx.fillStyle = "rgba(255,255,255,0)";
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = "rgba(220,220,240,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, 32); ctx.lineTo(60, 32);
    ctx.stroke();
    _windParticleTex.update();
    return _windParticleTex;
}
function _resetWindParticleTex() { _windParticleTex = null; }

// --- Shared Rock Impact Texture ---
var _rockImpactTex = null;
function _getRockImpactTex() {
    if (_rockImpactTex && !_rockImpactTex.isDisposed) return _rockImpactTex;
    _rockImpactTex = new BABYLON.DynamicTexture("rockImpTex", 64, scene);
    var ctx = _rockImpactTex.getContext();
    var grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    grad.addColorStop(0, "rgba(160,140,100,0.9)");
    grad.addColorStop(0.5, "rgba(140,120,80,0.4)");
    grad.addColorStop(1, "rgba(120,100,60,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    _rockImpactTex.update();
    return _rockImpactTex;
}
function _resetRockImpactTex() { _rockImpactTex = null; }

// --- Ice Overlay ---
function createIceOverlay(seg, roadWidth) {
    var L = seg.length;
    var dir = seg.dir;
    var w = dir === "z" ? roadWidth : L;
    var d = dir === "z" ? L : roadWidth;
    var cx = dir === "z" ? seg.startX : seg.startX + L / 2;
    var cz = dir === "z" ? seg.startZ + L / 2 : seg.startZ;

    var overlay = BABYLON.MeshBuilder.CreateGround("iceOverlay_" + seg.index, { width: w, height: d, subdivisions: 1 }, scene);
    overlay.position = new BABYLON.Vector3(cx, 0.02, cz);
    var mat = new BABYLON.StandardMaterial("iceOverlayMat_" + seg.index, scene);
    mat.diffuseColor = new BABYLON.Color3(0.6, 0.8, 1.0);
    mat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    mat.alpha = 0.3;
    mat.specularColor = new BABYLON.Color3(0.8, 0.9, 1.0);
    mat.backFaceCulling = false;
    overlay.material = mat;

    // Sparkle particles
    var sparkles = new BABYLON.ParticleSystem("iceSpark_" + seg.index, 30, scene);
    sparkles.particleTexture = _getIceParticleTex();
    sparkles.emitter = new BABYLON.Vector3(cx, 0.3, cz);
    sparkles.minEmitBox = new BABYLON.Vector3(-w / 2, 0, -d / 2);
    sparkles.maxEmitBox = new BABYLON.Vector3(w / 2, 0.5, d / 2);
    sparkles.minSize = 0.05; sparkles.maxSize = 0.15;
    sparkles.minLifeTime = 0.5; sparkles.maxLifeTime = 1.2;
    sparkles.emitRate = 8;
    sparkles.minEmitPower = 0.1; sparkles.maxEmitPower = 0.4;
    sparkles.direction1 = new BABYLON.Vector3(-0.1, 0.5, -0.1);
    sparkles.direction2 = new BABYLON.Vector3(0.1, 1.0, 0.1);
    sparkles.gravity = new BABYLON.Vector3(0, -0.5, 0);
    sparkles.color1 = new BABYLON.Color4(0.7, 0.85, 1.0, 0.8);
    sparkles.color2 = new BABYLON.Color4(0.5, 0.7, 1.0, 0.5);
    sparkles.colorDead = new BABYLON.Color4(0.4, 0.6, 1.0, 0.0);
    sparkles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    sparkles.start();

    overlay._iceSparkles = sparkles;
    return overlay;
}

// --- Crumble Overlay ---
function createCrumbleOverlay(seg, roadWidth) {
    var L = seg.length;
    var dir = seg.dir;
    var w = dir === "z" ? roadWidth : L;
    var d = dir === "z" ? L : roadWidth;
    var cx = dir === "z" ? seg.startX : seg.startX + L / 2;
    var cz = dir === "z" ? seg.startZ + L / 2 : seg.startZ;

    var overlay = BABYLON.MeshBuilder.CreateGround("crumbleOverlay_" + seg.index, { width: w, height: d, subdivisions: 1 }, scene);
    overlay.position = new BABYLON.Vector3(cx, 0.02, cz);

    var mat = new BABYLON.StandardMaterial("crumbleOverlayMat_" + seg.index, scene);
    var tex = new BABYLON.DynamicTexture("crumbleTex_" + seg.index, 128, scene);
    var ctx = tex.getContext();
    ctx.fillStyle = "rgba(120,60,40,0.3)";
    ctx.fillRect(0, 0, 128, 128);
    // Draw cracks
    ctx.strokeStyle = "rgba(60,30,15,0.7)";
    ctx.lineWidth = 2;
    for (var i = 0; i < 8; i++) {
        ctx.beginPath();
        var sx = Math.random() * 128, sy = Math.random() * 128;
        ctx.moveTo(sx, sy);
        for (var j = 0; j < 3; j++) {
            ctx.lineTo(sx + (Math.random() - 0.5) * 50, sy + (Math.random() - 0.5) * 50);
        }
        ctx.stroke();
    }
    tex.update();
    tex.hasAlpha = true;
    mat.diffuseTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(0.15, 0.05, 0.02);
    mat.alpha = 0.5;
    mat.useAlphaFromDiffuseTexture = true;
    mat.backFaceCulling = false;
    overlay.material = mat;

    return overlay;
}

// --- Wind Particles ---
function createWindParticles(seg, roadWidth, windDir) {
    var L = seg.length;
    var dir = seg.dir;
    var w = dir === "z" ? roadWidth : L;
    var d = dir === "z" ? L : roadWidth;
    var cx = dir === "z" ? seg.startX : seg.startX + L / 2;
    var cz = dir === "z" ? seg.startZ + L / 2 : seg.startZ;

    var wind = new BABYLON.ParticleSystem("windPS_" + seg.index, 60, scene);
    wind.particleTexture = _getWindParticleTex();
    wind.emitter = new BABYLON.Vector3(cx, 0.8, cz);
    wind.minEmitBox = new BABYLON.Vector3(-w / 2, 0, -d / 2);
    wind.maxEmitBox = new BABYLON.Vector3(w / 2, 1.5, d / 2);
    wind.minSize = 0.3; wind.maxSize = 0.8;
    wind.minLifeTime = 0.4; wind.maxLifeTime = 0.8;
    wind.emitRate = 25;
    wind.minEmitPower = 3.0; wind.maxEmitPower = 6.0;

    // Wind direction — lateral to road
    var sign = windDir === "left" ? -1 : 1;
    if (dir === "z") {
        wind.direction1 = new BABYLON.Vector3(sign * 3, -0.2, -0.5);
        wind.direction2 = new BABYLON.Vector3(sign * 6, 0.3, 0.5);
    } else {
        wind.direction1 = new BABYLON.Vector3(-0.5, -0.2, sign * 3);
        wind.direction2 = new BABYLON.Vector3(0.5, 0.3, sign * 6);
    }
    wind.gravity = new BABYLON.Vector3(0, 0, 0);
    wind.color1 = new BABYLON.Color4(0.85, 0.85, 0.9, 0.5);
    wind.color2 = new BABYLON.Color4(0.75, 0.75, 0.85, 0.3);
    wind.colorDead = new BABYLON.Color4(0.7, 0.7, 0.8, 0.0);
    wind.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    wind.start();

    return wind;
}

// --- Falling Rock ---
function createFallingRock(targetX, targetZ, roadWidth) {
    var radius = 0.7 + Math.random() * 0.4;

    // Warning shadow on ground
    var shadow = BABYLON.MeshBuilder.CreateGround("rockShadow_" + gameRandom(), { width: 0.2, height: 0.2 }, scene);
    shadow.position = new BABYLON.Vector3(targetX, 0.03, targetZ);
    var shadowMat = new BABYLON.StandardMaterial("rockShadMat_" + gameRandom(), scene);
    shadowMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    shadowMat.alpha = 0.5;
    shadowMat.backFaceCulling = false;
    shadow.material = shadowMat;

    // Rock sphere starts high
    var rock = BABYLON.MeshBuilder.CreateSphere("fallingRock_" + gameRandom(), { diameter: radius * 2, segments: 8 }, scene);
    rock.position = new BABYLON.Vector3(targetX, 18, targetZ);
    var mat = new BABYLON.StandardMaterial("fRockMat_" + gameRandom(), scene);
    mat.diffuseColor = new BABYLON.Color3(0.5, 0.45, 0.35);
    mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    rock.material = mat;
    shadowGen.addShadowCaster(rock);

    rock._fallingRock = true;
    rock._shadow = shadow;
    rock._radius = radius;
    rock._targetX = targetX;
    rock._targetZ = targetZ;
    rock._fallSpeed = 0;
    rock._phase = "warning"; // warning -> falling -> landed
    rock._timer = 0.8; // warning duration
    rock._landed = false;
    rock._isObstacle = false;
    rock._obstacleBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

    return rock;
}

// --- Update Zone Effects (called from gameUpdate) ---
// _activeRocks: array managed externally (in game.js)
function updateZoneEffects(dt, currentSegIndex, zones, segs, activeRocks) {
    if (!zones || zones.length === 0) return;

    // Update falling rocks
    for (var ri = activeRocks.length - 1; ri >= 0; ri--) {
        var rock = activeRocks[ri];
        if (rock.isDisposed()) { activeRocks.splice(ri, 1); continue; }

        if (rock._phase === "warning") {
            rock._timer -= dt;
            // Grow shadow circle as warning
            var warnProgress = 1 - Math.max(0, rock._timer / 0.8);
            var shadowSize = 0.2 + warnProgress * (rock._radius * 3);
            rock._shadow.scaling.x = shadowSize;
            rock._shadow.scaling.z = shadowSize;
            rock._shadow.material.alpha = 0.3 + warnProgress * 0.4;
            if (rock._timer <= 0) {
                rock._phase = "falling";
            }
        } else if (rock._phase === "falling") {
            rock._fallSpeed += 35 * dt;
            rock.position.y -= rock._fallSpeed * dt;
            rock.rotation.x += dt * 5;
            rock.rotation.z += dt * 3;
            if (rock.position.y <= rock._radius) {
                rock.position.y = rock._radius;
                rock._phase = "landed";
                rock._landed = true;
                rock._isObstacle = true;
                var r = rock._radius;
                rock._obstacleBounds = {
                    minX: rock.position.x - r - 0.3,
                    maxX: rock.position.x + r + 0.3,
                    minZ: rock.position.z - r - 0.3,
                    maxZ: rock.position.z + r + 0.3
                };
                // Shrink shadow to match rock
                rock._shadow.scaling.x = rock._radius * 2.5;
                rock._shadow.scaling.z = rock._radius * 2.5;
                rock._shadow.material.alpha = 0.35;
            }
        }
        // Landed rocks stay as obstacles — cleaned up via removeSegment
    }

    // Update crumble timers on segments
    for (var si = 0; si < segs.length; si++) {
        var seg = segs[si];
        if (!seg._crumbleActive) continue;
        if (seg._crumbleFalling) {
            // Animate segment falling
            seg._crumbleFallSpeed = (seg._crumbleFallSpeed || 0) + 12 * dt;
            for (var mi = 0; mi < seg.meshes.length; mi++) {
                var m = seg.meshes[mi];
                if (m.isDisposed()) continue;
                m.position.y -= seg._crumbleFallSpeed * dt;
                m.rotation.x += dt * 1.2;
                m.rotation.z += dt * 0.8;
            }
            // Mark bounds invalid so car falls through
            seg.bounds.minX = 99999; seg.bounds.maxX = -99999;
            seg.bounds.minZ = 99999; seg.bounds.maxZ = -99999;
            continue;
        }
        if (seg._crumbleTriggered && !seg._crumbleFalling) {
            seg._crumbleTimer -= dt;
            if (seg._crumbleTimer <= 0) {
                seg._crumbleFalling = true;
                seg._crumbleFallSpeed = 0;
            }
        }
    }
}
