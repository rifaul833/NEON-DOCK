// ===== SOUND SYSTEM (Web Audio API) =====
let audioCtx = null;
let masterGain = null;

// --- Audio settings (persisted to localStorage) ---
var sfxEnabled = localStorage.getItem("sfxEnabled") !== "false";
var musicEnabled = localStorage.getItem("musicEnabled") !== "false";

function setSfxEnabled(val) {
    sfxEnabled = val;
    localStorage.setItem("sfxEnabled", val ? "true" : "false");
}

function setMusicEnabled(val) {
    musicEnabled = val;
    localStorage.setItem("musicEnabled", val ? "true" : "false");
    if (!val) {
        stopMusic();
    }
}

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
}

function playTone(freq, duration, type, vol, detune) {
    if (!audioCtx || !sfxEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.value = vol || 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playMultiTone(notes) {
    if (!sfxEnabled) return;
    // notes: [{freq, delay, dur, type, vol}]
    notes.forEach(n => {
        setTimeout(() => playTone(n.freq, n.dur || 0.1, n.type || "sine", n.vol || 0.15), n.delay || 0);
    });
}

// ===== LOBBY SOUNDS =====

function playCarSwitchSound() {
    // Soft whoosh/swipe
    if (!audioCtx || !sfxEnabled) return;
    const bufSize = audioCtx.sampleRate * 0.12;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        const env = Math.sin((i / bufSize) * Math.PI);
        d[i] = (Math.random() * 2 - 1) * env * 0.3;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000;
    filter.Q.value = 0.8;
    const g = audioCtx.createGain();
    g.gain.value = 0.12;
    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start();
    // Tiny pitch accent
    playTone(900, 0.06, "sine", 0.08);
}

function playStartGameSound() {
    // Dramatic launch: ascending tones + whoosh
    playMultiTone([
        { freq: 440, delay: 0, dur: 0.08, vol: 0.15 },
        { freq: 554, delay: 50, dur: 0.08, vol: 0.17 },
        { freq: 659, delay: 100, dur: 0.08, vol: 0.19 },
        { freq: 880, delay: 150, dur: 0.15, vol: 0.22 },
        { freq: 1100, delay: 220, dur: 0.2, vol: 0.18 },
    ]);
    // Whoosh
    if (!audioCtx || !sfxEnabled) return;
    setTimeout(() => {
        const bufSize = audioCtx.sampleRate * 0.25;
        const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = i / bufSize;
            d[i] = (Math.random() * 2 - 1) * (1 - t) * t * 4 * 0.2;
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 800;
        const g = audioCtx.createGain();
        g.gain.value = 0.15;
        src.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        src.start();
    }, 100);
}

function playLobbyEnterSound() {
    // Ambient welcome chime
    playMultiTone([
        { freq: 523, delay: 0, dur: 0.2, type: "sine", vol: 0.1 },
        { freq: 659, delay: 120, dur: 0.2, type: "sine", vol: 0.12 },
        { freq: 784, delay: 240, dur: 0.3, type: "sine", vol: 0.1 },
    ]);
}

function playButtonClickSound() {
    // Short snappy click
    playTone(1400, 0.04, "sine", 0.1);
    setTimeout(() => playTone(1800, 0.03, "sine", 0.07), 30);
}

function playPauseSound() {
    // Soft descending
    playTone(600, 0.08, "sine", 0.1);
    setTimeout(() => playTone(450, 0.1, "sine", 0.08), 60);
}

function playResumeSound() {
    // Soft ascending
    playTone(450, 0.08, "sine", 0.1);
    setTimeout(() => playTone(600, 0.1, "sine", 0.12), 60);
}

// ===== GAME SOUNDS =====

function playCoinSound() {
    playTone(1200, 0.08, "sine", 0.18);
    setTimeout(() => playTone(1600, 0.1, "sine", 0.15), 60);
}

function playPowerUpSound() {
    playTone(600, 0.1, "sine", 0.2);
    setTimeout(() => playTone(800, 0.1, "sine", 0.18), 80);
    setTimeout(() => playTone(1100, 0.15, "sine", 0.2), 160);
}

function playFallSound() {
    if (!audioCtx || !sfxEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 400;
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.8);
    gain.gain.value = 0.25;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.9);
}

function playShieldBreakSound() {
    if (!audioCtx || !sfxEnabled) return;
    playTone(300, 0.15, "square", 0.15);
    setTimeout(() => playTone(200, 0.2, "sawtooth", 0.1), 100);
    const bufSize = audioCtx.sampleRate * 0.2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.value = 0.15;
    src.connect(g);
    g.connect(masterGain);
    src.start();
}

function playLandSound() {
    playTone(100, 0.15, "sine", 0.12);
    playTone(150, 0.1, "triangle", 0.08);
}

function playNewHighScoreSound() {
    playMultiTone([
        { freq: 800, delay: 0, dur: 0.12, vol: 0.2 },
        { freq: 1000, delay: 100, dur: 0.12, vol: 0.2 },
        { freq: 1300, delay: 200, dur: 0.15, vol: 0.22 },
        { freq: 1600, delay: 320, dur: 0.25, vol: 0.25 },
    ]);
}

function playPurchaseSound() {
    playMultiTone([
        { freq: 523, delay: 0, dur: 0.1, vol: 0.2 },
        { freq: 659, delay: 80, dur: 0.1, vol: 0.2 },
        { freq: 784, delay: 160, dur: 0.1, vol: 0.22 },
        { freq: 1047, delay: 260, dur: 0.2, vol: 0.25 },
        { freq: 1319, delay: 380, dur: 0.3, vol: 0.2 },
    ]);
}

function playSelectSound() {
    playTone(800, 0.08, "sine", 0.15);
    setTimeout(() => playTone(1000, 0.1, "sine", 0.18), 60);
}

function playErrorSound() {
    playTone(200, 0.15, "square", 0.12);
    setTimeout(() => playTone(150, 0.2, "square", 0.1), 120);
}

// ===== LEVEL SOUNDS =====

function playLevelCompleteSound() {
    // Epic ascending fanfare
    playMultiTone([
        { freq: 523, delay: 0, dur: 0.12, vol: 0.22 },
        { freq: 659, delay: 80, dur: 0.12, vol: 0.24 },
        { freq: 784, delay: 160, dur: 0.12, vol: 0.26 },
        { freq: 1047, delay: 280, dur: 0.25, vol: 0.30 },
        { freq: 1319, delay: 420, dur: 0.30, vol: 0.28 },
        { freq: 1568, delay: 580, dur: 0.40, vol: 0.25 },
    ]);
    // Firework crackle sounds
    setTimeout(function() { playTone(3000, 0.05, "square", 0.08); }, 100);
    setTimeout(function() { playTone(4000, 0.04, "square", 0.06); }, 500);
    setTimeout(function() { playTone(3500, 0.05, "square", 0.07); }, 950);
}

function playStarEarnedSound() {
    // Bright chime
    playTone(1800, 0.12, "sine", 0.15);
    setTimeout(function() { playTone(2200, 0.15, "sine", 0.12); }, 60);
}

// ===== ENGINE STUBS (removed - no more car engine sounds) =====
function updateEngineSound() {}
function muteEngine() {}
function muteEngineFast() {}

// ===== MUSIC SYSTEM (bg.webm) =====
var _bgMusic = null;
var _musicPlaying = null; // "lobby" | "game" | null
var _musicFadeTimer = null;
var _MUSIC_MAX = 0.06; // real max volume cap
var musicVolume = parseFloat(localStorage.getItem("musicVolume")) || 0.25;

function _realVol(v) { return v * _MUSIC_MAX; }

function setMusicVolume(val) {
    musicVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem("musicVolume", musicVolume.toFixed(2));
    if (_bgMusic && !_bgMusic.paused) _bgMusic.volume = _realVol(musicVolume);
}

function _getBgMusic() {
    if (!_bgMusic) {
        _bgMusic = new Audio("bg.webm");
        _bgMusic.loop = true;
        _bgMusic.volume = _realVol(musicVolume);
    }
    return _bgMusic;
}

function stopMusic() {
    if (_musicFadeTimer) { clearInterval(_musicFadeTimer); _musicFadeTimer = null; }
    var m = _getBgMusic();
    m.pause();
    m.currentTime = 0;
    m.volume = _realVol(musicVolume);
    _musicPlaying = null;
}

function startLobbyMusic() {
    if (!musicEnabled) return;
    if (_musicPlaying === "lobby") return;
    stopMusic();
    _musicPlaying = "lobby";
    var m = _getBgMusic();
    m.volume = _realVol(musicVolume);
    m.play().catch(function() {});
}

function startGameMusic() {
    if (!musicEnabled) return;
    if (_musicPlaying === "game") return;
    stopMusic();
    _musicPlaying = "game";
    var m = _getBgMusic();
    m.volume = _realVol(musicVolume);
    m.play().catch(function() {});
}

function fadeOutMusic(dur, callback) {
    var m = _getBgMusic();
    if (m.paused) { _musicPlaying = null; if (callback) callback(); return; }
    var steps = 20;
    var interval = ((dur || 0.5) * 1000) / steps;
    var volStep = m.volume / steps;
    _musicFadeTimer = setInterval(function() {
        m.volume = Math.max(0, m.volume - volStep);
        if (m.volume <= 0.001) {
            clearInterval(_musicFadeTimer);
            _musicFadeTimer = null;
            stopMusic();
            if (callback) callback();
        }
    }, interval);
}
