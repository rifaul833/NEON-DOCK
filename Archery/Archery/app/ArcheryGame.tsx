"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type GameMode = "solo" | "room";
type ShotResult = { points: number; label: string };
type RoomMessage = { type: "hello" | "shot" | "restart"; name: string; score: number; arrows: number };

const MAX_ARROWS = 8;
const MAX_LEVEL = 5;
const HITS_PER_LEVEL = 4;
/** Empty for local vinext; `/games/archery` when statically exported for Vercel. */
const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const RANGE_BACKDROPS: Record<string, string> = {
  "DESERT SUNSET": `${ASSET_BASE}/desert-sunset.jpg`,
  "WINTER PEAKS": `${ASSET_BASE}/winter-peaks.avif`,
  "DREAMY HIGHLANDS": `${ASSET_BASE}/dreamy-landscape.avif`,
  "CARTOON COAST": `${ASSET_BASE}/cartoon-ocean.avif`,
  "FANTASY ISLAND": `${ASSET_BASE}/fantasy-island.png`,
};

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default function ArcheryGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<THREE.Group | null>(null);
  const balloonRef = useRef<THREE.Group | null>(null);
  const bowRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const scoreRef = useRef(0);
  const arrowsRef = useRef(0);
  const playingRef = useRef(false);
  const aimRef = useRef({ x: 0, y: 0 });
  const shotLockedRef = useRef(false);
  const awaitingNextShotRef = useRef(false);
  const targetPauseRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stretchSoundRef = useRef<{ oscillator: OscillatorNode; gain: GainNode } | null>(null);
  const musicRef = useRef<{ sources: AudioScheduledSourceNode[]; master: GainNode; melodyTimer: number } | null>(null);
  const drawingRef = useRef(false);
  const shotVisualRef = useRef(0);
  const cycleEnvironmentRef = useRef<() => void>(() => undefined);
  const resetEnvironmentRef = useRef<() => void>(() => undefined);
  const cycleBowPositionRef = useRef<() => void>(() => undefined);
  const resetBowPositionRef = useRef<() => void>(() => undefined);
  const powerRef = useRef(0);
  const windRef = useRef({ speed: 2.4, direction: 1 });
  const levelRef = useRef(1);
  const hitsInLevelRef = useRef(0);

  const [screen, setScreen] = useState<"lobby" | "game" | "results">("lobby");
  const [mode, setMode] = useState<GameMode>("solo");
  const [name, setName] = useState("Ranger");
  const [room, setRoom] = useState("");
  const [score, setScore] = useState(0);
  const [arrows, setArrows] = useState(0);
  const [opponent, setOpponent] = useState({ name: "Waiting…", score: 0, arrows: 0 });
  const [drawing, setDrawing] = useState(false);
  const [power, setPower] = useState(0);
  const [lastShot, setLastShot] = useState<ShotResult | null>(null);
  const [awaitingNextShot, setAwaitingNextShot] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [environmentName, setEnvironmentName] = useState("DESERT SUNSET");
  const [environmentPulse, setEnvironmentPulse] = useState(false);
  const [wind, setWind] = useState({ speed: 2.4, direction: 1 });
  const [level, setLevel] = useState(1);
  const [hitsInLevel, setHitsInLevel] = useState(0);
  const [levelPulse, setLevelPulse] = useState(false);
  const drawStart = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { arrowsRef.current = arrows; }, [arrows]);
  useEffect(() => { playingRef.current = screen === "game"; }, [screen]);
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { hitsInLevelRef.current = hitsInLevel; }, [hitsInLevel]);
  useEffect(() => {
    Object.values(RANGE_BACKDROPS).forEach((source) => {
      const image = new Image();
      image.src = source;
    });
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    const context = audioContextRef.current;
    if (context.state === "suspended") void context.resume();
    return context;
  }, []);

  const makeNoise = useCallback((context: AudioContext, seconds: number) => {
    const frameCount = Math.ceil(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
    const source = context.createBufferSource();
    source.buffer = buffer;
    return source;
  }, []);

  const stopStretchSound = useCallback(() => {
    const active = stretchSoundRef.current;
    if (!active) return;
    const now = active.gain.context.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(Math.max(active.gain.gain.value, 0.0001), now);
    active.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    try { active.oscillator.stop(now + 0.08); } catch { /* already stopped */ }
    stretchSoundRef.current = null;
  }, []);

  const playStretchSound = useCallback(() => {
    if (!audioEnabled) return;
    stopStretchSound();
    const context = ensureAudio();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(58, now);
    oscillator.frequency.exponentialRampToValueAtTime(105, now + 1.1);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, now);
    filter.Q.value = 7;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028, now + 0.18);
    gain.gain.linearRampToValueAtTime(0.048, now + 1.05);
    oscillator.connect(filter).connect(gain).connect(context.destination);
    oscillator.start(now);
    stretchSoundRef.current = { oscillator, gain };

    const creak = makeNoise(context, 0.42);
    const creakFilter = context.createBiquadFilter();
    const creakGain = context.createGain();
    creakFilter.type = "bandpass";
    creakFilter.frequency.value = 780;
    creakFilter.Q.value = 9;
    creakGain.gain.setValueAtTime(0.025, now);
    creakGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    creak.connect(creakFilter).connect(creakGain).connect(context.destination);
    creak.start(now + 0.08);
  }, [audioEnabled, ensureAudio, makeNoise, stopStretchSound]);

  const playReleaseSound = useCallback(() => {
    if (!audioEnabled) return;
    const context = ensureAudio();
    const now = context.currentTime;
    const snap = makeNoise(context, 0.18);
    const snapFilter = context.createBiquadFilter();
    const snapGain = context.createGain();
    snapFilter.type = "highpass";
    snapFilter.frequency.value = 1200;
    snapGain.gain.setValueAtTime(0.17, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    snap.connect(snapFilter).connect(snapGain).connect(context.destination);
    snap.start(now);

    const whistle = context.createOscillator();
    const whistleGain = context.createGain();
    whistle.type = "sine";
    whistle.frequency.setValueAtTime(860, now);
    whistle.frequency.exponentialRampToValueAtTime(190, now + 0.32);
    whistleGain.gain.setValueAtTime(0.055, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    whistle.connect(whistleGain).connect(context.destination);
    whistle.start(now);
    whistle.stop(now + 0.34);
  }, [audioEnabled, ensureAudio, makeNoise]);

  const playImpactSound = useCallback((hitTarget: boolean) => {
    if (!audioEnabled) return;
    const context = ensureAudio();
    const now = context.currentTime;

    // A bright rising major arpeggio celebrates a hit; a slower descending
    // minor phrase makes a miss immediately recognisable without looking.
    const cueNotes = hitTarget
      ? [523.25, 659.25, 783.99, 1046.5]
      : [440, 392, 329.63, 261.63];
    const noteLength = hitTarget ? 0.14 : 0.24;
    cueNotes.forEach((frequency, index) => {
      const tone = context.createOscillator();
      const toneGain = context.createGain();
      const noteStart = now + index * noteLength;
      tone.type = hitTarget ? "triangle" : "sine";
      tone.frequency.setValueAtTime(frequency, noteStart);
      toneGain.gain.setValueAtTime(0.0001, noteStart);
      toneGain.gain.exponentialRampToValueAtTime(hitTarget ? 0.16 : 0.11, noteStart + 0.025);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteLength * 1.45);
      tone.connect(toneGain).connect(context.destination);
      tone.start(noteStart);
      tone.stop(noteStart + noteLength * 1.55);
    });

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const callout = new SpeechSynthesisUtterance(hitTarget ? "Hit!" : "Miss!");
      callout.rate = hitTarget ? 1.08 : 0.88;
      callout.pitch = hitTarget ? 1.3 : 0.72;
      callout.volume = 0.9;
      window.speechSynthesis.speak(callout);
    }

    const thump = context.createOscillator();
    const thumpGain = context.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(hitTarget ? 145 : 92, now);
    thump.frequency.exponentialRampToValueAtTime(hitTarget ? 48 : 36, now + 0.24);
    thumpGain.gain.setValueAtTime(hitTarget ? 0.22 : 0.15, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    thump.connect(thumpGain).connect(context.destination);
    thump.start(now);
    thump.stop(now + 0.32);

    const texture = makeNoise(context, hitTarget ? 0.2 : 0.38);
    const textureFilter = context.createBiquadFilter();
    const textureGain = context.createGain();
    textureFilter.type = hitTarget ? "bandpass" : "lowpass";
    textureFilter.frequency.value = hitTarget ? 950 : 360;
    textureFilter.Q.value = hitTarget ? 3.5 : 1.2;
    textureGain.gain.setValueAtTime(hitTarget ? 0.12 : 0.1, now);
    textureGain.gain.exponentialRampToValueAtTime(0.0001, now + (hitTarget ? 0.2 : 0.38));
    texture.connect(textureFilter).connect(textureGain).connect(context.destination);
    texture.start(now);
    if ("vibrate" in navigator) navigator.vibrate(hitTarget ? 32 : 18);
  }, [audioEnabled, ensureAudio, makeNoise]);

  const stopMusic = useCallback(() => {
    const music = musicRef.current;
    if (!music) return;
    const now = music.master.context.currentTime;
    music.master.gain.cancelScheduledValues(now);
    music.master.gain.setValueAtTime(Math.max(music.master.gain.value, 0.0001), now);
    music.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    music.sources.forEach((source) => {
      try { source.stop(now + 0.85); } catch { /* already stopped */ }
    });
    window.clearInterval(music.melodyTimer);
    musicRef.current = null;
  }, []);

  const startMusic = useCallback(() => {
    if (!audioEnabled || musicRef.current) return;
    const context = ensureAudio();
    const now = context.currentTime;
    const master = context.createGain();
    const warmth = context.createBiquadFilter();
    warmth.type = "lowpass";
    warmth.frequency.value = 680;
    warmth.Q.value = 0.7;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.2, now + 0.7);
    master.connect(warmth).connect(context.destination);

    const sources: AudioScheduledSourceNode[] = [];
    [65.41, 98, 130.81, 196].forEach((frequency, index) => {
      const tone = context.createOscillator();
      const toneGain = context.createGain();
      tone.type = index % 2 ? "sine" : "triangle";
      tone.frequency.value = frequency;
      tone.detune.value = index % 2 ? 5 : -5;
      toneGain.gain.value = index < 2 ? 0.42 : 0.22;
      tone.connect(toneGain).connect(master);
      tone.start(now);
      sources.push(tone);
    });

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.075;
    lfoGain.gain.value = 0.011;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start(now);
    sources.push(lfo);

    const windBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < windData.length; i++) windData[i] = Math.random() * 2 - 1;
    const wind = context.createBufferSource();
    const windFilter = context.createBiquadFilter();
    const windGain = context.createGain();
    wind.buffer = windBuffer;
    wind.loop = true;
    windFilter.type = "bandpass";
    windFilter.frequency.value = 260;
    windFilter.Q.value = 0.5;
    windGain.gain.value = 0.055;
    wind.connect(windFilter).connect(windGain).connect(master);
    wind.start(now);
    sources.push(wind);
    const melody = [261.63, 329.63, 392, 329.63, 293.66, 392, 440, 392];
    let melodyIndex = 0;
    const playThemeNote = () => {
      const noteNow = context.currentTime;
      const note = context.createOscillator();
      const noteGain = context.createGain();
      note.type = "triangle";
      note.frequency.value = melody[melodyIndex % melody.length];
      melodyIndex += 1;
      noteGain.gain.setValueAtTime(0.0001, noteNow);
      noteGain.gain.exponentialRampToValueAtTime(0.26, noteNow + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteNow + 0.85);
      note.connect(noteGain).connect(master);
      note.start(noteNow);
      note.stop(noteNow + 0.9);
    };
    playThemeNote();
    const melodyTimer = window.setInterval(playThemeNote, 1080);
    musicRef.current = { sources, master, melodyTimer };
  }, [audioEnabled, ensureAudio]);

  useEffect(() => {
    if (audioEnabled && screen === "game") startMusic();
    if (!audioEnabled) stopMusic();
  }, [audioEnabled, screen, startMusic, stopMusic]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 2.15, 8);
    camera.lookAt(0, 2, -10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe9fbff, 0x78965b, 2.4));
    const moon = new THREE.DirectionalLight(0xfff2c2, 4.2);
    moon.position.set(-6, 12, 4);
    moon.castShadow = true;
    scene.add(moon);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x132a22, roughness: 0.96 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 42),
      new THREE.MeshStandardMaterial({ color: 0x1d2b22, roughness: 1 })
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.015, -10);
    scene.add(lane);

    const legacyForest = new THREE.Group();
    scene.add(legacyForest);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2b22 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x173c31, roughness: 0.9 });
    for (let i = 0; i < 34; i++) {
      const side = i % 2 ? 1 : -1;
      const z = 7 - Math.floor(i / 2) * 2.35;
      const x = side * (4.5 + (i % 5) * 0.8);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3, 7), trunkMat);
      trunk.position.set(x, 1.5, z);
      trunk.castShadow = true;
      legacyForest.add(trunk);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.25, 4.4, 8), pineMat);
      crown.position.set(x, 4.2, z);
      crown.castShadow = true;
      legacyForest.add(crown);
    }
    ground.visible = false;
    lane.visible = false;
    legacyForest.visible = false;

    // Stylized low-poly young archer, staged over the player's shoulder.
    const archer = new THREE.Group();
    archer.position.set(2.15, 0.06, 4.15);
    archer.rotation.y = -0.18;
    archer.scale.setScalar(1.08);
    scene.add(archer);
    archer.visible = false;

    const skin = new THREE.MeshStandardMaterial({ color: 0xb97850, roughness: 0.82 });
    const skinLight = new THREE.MeshStandardMaterial({ color: 0xc98d63, roughness: 0.8 });
    const tunic = new THREE.MeshStandardMaterial({ color: 0x244c3e, roughness: 0.92 });
    const tunicEdge = new THREE.MeshStandardMaterial({ color: 0xc4a05d, roughness: 0.68, metalness: 0.12 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x4c2e21, roughness: 0.9 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x241813, roughness: 1 });
    const darkCloth = new THREE.MeshStandardMaterial({ color: 0x182923, roughness: 0.94 });

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.27, 0.45, 8), darkCloth);
    hips.position.y = 0.78;
    hips.castShadow = true;
    archer.add(hips);
    [-0.17, 0.17].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.78, 8), darkCloth);
      leg.position.set(x, 0.35, 0);
      leg.castShadow = true;
      archer.add(leg);
    });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.72, 6, 12), tunic);
    torso.position.y = 1.34;
    torso.scale.set(1.05, 1, 0.72);
    torso.castShadow = true;
    archer.add(torso);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 8, 24), leather);
    belt.rotation.x = Math.PI / 2;
    belt.position.set(0, 0.91, 0);
    archer.add(belt);
    const shoulderStrap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.05, 0.055), leather);
    shoulderStrap.position.set(0.05, 1.39, 0.29);
    shoulderStrap.rotation.z = -0.46;
    archer.add(shoulderStrap);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.2, 10), skin);
    neck.position.y = 1.91;
    archer.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.265, 18, 14), skinLight);
    head.position.set(0, 2.19, -0.02);
    head.scale.set(0.88, 1.08, 0.92);
    head.castShadow = true;
    archer.add(head);
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.275, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.6), hair);
    hairCap.position.set(0, 2.25, -0.005);
    hairCap.scale.set(0.92, 1.1, 0.96);
    archer.add(hairCap);
    for (let i = 0; i < 5; i++) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.25, 6), hair);
      tuft.position.set(-0.16 + i * 0.075, 2.48 + Math.sin(i) * 0.035, -0.02 - Math.abs(2 - i) * 0.02);
      tuft.rotation.z = -0.35 + i * 0.15;
      archer.add(tuft);
    }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 7), skinLight);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 2.18, -0.25);
    archer.add(nose);
    [-0.085, 0.085].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1b221f }));
      eye.position.set(x, 2.25, -0.246);
      archer.add(eye);
    });

    const makeArm = (side: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.39, 1.68, -0.02);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.115, 0.42, 9), tunic);
      sleeve.position.y = -0.2;
      sleeve.castShadow = true;
      pivot.add(sleeve);
      const forearmPivot = new THREE.Group();
      forearmPivot.position.y = -0.41;
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.46, 9), skin);
      forearm.position.y = -0.22;
      forearm.castShadow = true;
      forearmPivot.add(forearm);
      const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.088, 0.22, 9), leather);
      bracer.position.y = -0.16;
      forearmPivot.add(bracer);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), skinLight);
      hand.position.y = -0.47;
      forearmPivot.add(hand);
      pivot.add(forearmPivot);
      archer.add(pivot);
      return { pivot, forearmPivot };
    };
    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);
    leftArm.pivot.rotation.set(1.22, 0.04, -0.3);
    leftArm.forearmPivot.rotation.x = 0.08;
    rightArm.pivot.rotation.set(0.78, -0.18, 0.55);
    rightArm.forearmPivot.rotation.set(0.92, 0.15, -0.18);

    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.95, 10, 1, true), leather);
    quiver.position.set(0.34, 1.42, 0.28);
    quiver.rotation.z = -0.28;
    archer.add(quiver);
    for (let i = 0; i < 4; i++) {
      const spareArrow = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1.16, 6), tunicEdge);
      spareArrow.position.set(0.26 + i * 0.05, 1.83 + i * 0.015, 0.28);
      spareArrow.rotation.z = -0.28;
      archer.add(spareArrow);
    }

    const bowGroup = new THREE.Group();
    bowGroup.position.set(-0.78, 1.46, -0.79);
    archer.add(bowGroup);
    const bowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0.22, 0.58, 0),
      new THREE.Vector3(0.31, 0, 0), new THREE.Vector3(0.22, -0.58, 0), new THREE.Vector3(0, -0.95, 0),
    ]);
    const bowMesh = new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 48, 0.035, 8, false), new THREE.MeshStandardMaterial({ color: 0xb66e33, roughness: 0.62, metalness: 0.08 }));
    bowMesh.castShadow = true;
    bowGroup.add(bowMesh);
    const bowGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.32, 8), leather);
    bowGrip.position.x = 0.31;
    bowGroup.add(bowGrip);
    const stringGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0.05, 0, 0), new THREE.Vector3(0, -0.95, 0)]);
    const string = new THREE.Line(stringGeometry, new THREE.LineBasicMaterial({ color: 0xece9d5, transparent: true, opacity: 0.9 }));
    bowGroup.add(string);
    const heldArrow = new THREE.Group();
    const heldShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.25, 7), tunicEdge);
    heldShaft.rotation.x = Math.PI / 2;
    heldArrow.add(heldShaft);
    const heldTip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 7), new THREE.MeshStandardMaterial({ color: 0xb9c2bd, metalness: 0.7, roughness: 0.3 }));
    heldTip.rotation.x = -Math.PI / 2;
    heldTip.position.z = -1.2;
    heldArrow.add(heldTip);
    heldArrow.position.set(0.3, 0.02, -0.88);
    bowGroup.add(heldArrow);

    const makeArenaGround = (color: number) => {
      const group = new THREE.Group();
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color, roughness: 0.94, transparent: true, opacity: 0.72 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      group.add(floor);
      return group;
    };

    const field = makeArenaGround(0x78bd50);
    for (let i = 0; i < 90; i++) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffef72 : i % 3 === 1 ? 0xffffff : 0xf18cb7 }));
      const side = i % 2 ? 1 : -1;
      flower.position.set(side * (3.5 + Math.random() * 12), 0.05, 7 - Math.random() * 32);
      field.add(flower);
    }

    const mountain = makeArenaGround(0x8ea27b);
    for (let i = 0; i < 9; i++) {
      const peakHeight = 7 + (i % 4) * 1.7;
      const peak = new THREE.Mesh(new THREE.ConeGeometry(4.2, peakHeight, 7), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x71808a : 0x65736e, roughness: 1 }));
      peak.position.set(-20 + i * 5, peakHeight / 2 - 0.2, -31 - (i % 2) * 4);
      mountain.add(peak);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(1.35, 2.2, 7), new THREE.MeshStandardMaterial({ color: 0xf3f8f5, roughness: 0.9 }));
      snow.position.set(peak.position.x, peakHeight - 1.1, peak.position.z);
      mountain.add(snow);
    }

    const river = makeArenaGround(0x79b85b);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(12, 70), new THREE.MeshStandardMaterial({ color: 0x36aee5, roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.9 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(-8, 0.035, -15);
    river.add(water);
    for (let i = 0; i < 24; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.4, 0), new THREE.MeshStandardMaterial({ color: 0x7b8178, roughness: 1 }));
      rock.position.set(-2.2 - Math.random() * 11, 0.2, 6 - Math.random() * 38);
      river.add(rock);
    }

    const jungle = makeArenaGround(0x348543);
    for (let i = 0; i < 42; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (3.8 + Math.random() * 9);
      const z = 8 - Math.random() * 38;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.23, 2.8, 7), new THREE.MeshStandardMaterial({ color: 0x805029, roughness: 1 }));
      trunk.position.set(x, 1.4, z);
      jungle.add(trunk);
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 + Math.random() * 0.55, 1), new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x50b94d : 0x218744, roughness: 0.9 }));
      leaves.position.set(x, 3.15, z);
      jungle.add(leaves);
    }

    const desert = makeArenaGround(0xe7bd67);
    for (let i = 0; i < 15; i++) {
      const dune = new THREE.Mesh(new THREE.SphereGeometry(3.5 + Math.random() * 2, 16, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xdcae58 : 0xf0cb79, roughness: 1 }));
      dune.scale.y = 0.22;
      dune.position.set(-20 + Math.random() * 40, -0.35, -5 - Math.random() * 34);
      desert.add(dune);
    }
    for (let i = 0; i < 8; i++) {
      const cactus = new THREE.Group();
      const cactusMat = new THREE.MeshStandardMaterial({ color: 0x3d8f55, roughness: 0.9 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.1, 8), cactusMat);
      stem.position.y = 1.05;
      cactus.add(stem);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.85, 8), cactusMat);
      arm.position.set(0.3, 1.2, 0);
      arm.rotation.z = Math.PI / 2.5;
      cactus.add(arm);
      cactus.position.set((i % 2 ? 1 : -1) * (5 + Math.random() * 9), 0, 2 - Math.random() * 28);
      desert.add(cactus);
    }

    const arenas = [
      { name: "DESERT SUNSET", sky: 0xffcf78, group: desert },
      { name: "WINTER PEAKS", sky: 0xa9ddf5, group: mountain },
      { name: "DREAMY HIGHLANDS", sky: 0xaedcf2, group: field },
      { name: "CARTOON COAST", sky: 0x76d8f1, group: river },
      { name: "FANTASY ISLAND", sky: 0x8fd8c7, group: jungle },
    ];
    arenas.forEach((arena) => { arena.group.visible = false; scene.add(arena.group); });
    let arenaIndex = 0;
    const showArena = (index: number) => {
      arenaIndex = index % arenas.length;
      arenas.forEach((arena) => { arena.group.visible = false; });
      scene.background = null;
      if (scene.fog instanceof THREE.Fog) scene.fog.color.setHex(arenas[arenaIndex].sky);
      setEnvironmentName(arenas[arenaIndex].name);
    };
    cycleEnvironmentRef.current = () => showArena(arenaIndex + 1);
    resetEnvironmentRef.current = () => showArena(0);

    // Bright sculpted recurve bow based on the player's reference image.
    const olympicBow = new THREE.Group();
    olympicBow.position.set(2.15, 1.7, 4.25);
    olympicBow.scale.setScalar(0.564);
    bowRef.current = olympicBow;
    scene.add(olympicBow);
    let bowCornerIndex = 0;
    const bowCornerSigns = [
      { x: 1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: -1, y: -1 },
    ];
    const getBowCornerPosition = () => {
      const depth = Math.abs(camera.position.z - 4.25);
      const verticalHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depth;
      const horizontalHalf = verticalHalf * camera.aspect;
      const corner = bowCornerSigns[bowCornerIndex];
      return new THREE.Vector3(
        camera.position.x + corner.x * Math.max(0.48, horizontalHalf - 0.55),
        camera.position.y + corner.y * Math.max(0.62, verticalHalf - 0.84),
        4.25,
      );
    };
    olympicBow.position.copy(getBowCornerPosition());
    cycleBowPositionRef.current = () => { bowCornerIndex = (bowCornerIndex + 1) % bowCornerSigns.length; };
    resetBowPositionRef.current = () => { bowCornerIndex = 0; olympicBow.position.copy(getBowCornerPosition()); };
    const referenceBrown = new THREE.MeshStandardMaterial({ color: 0xd64238, roughness: 0.36, metalness: 0.08 });
    const referenceYellow = new THREE.MeshStandardMaterial({ color: 0xf5bd42, roughness: 0.24, metalness: 0.62 });
    const referenceSilver = new THREE.MeshStandardMaterial({ color: 0xe8ad38, roughness: 0.2, metalness: 0.76 });
    const olympicCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 1.33, 0), new THREE.Vector3(0.13, 1.15, 0),
      new THREE.Vector3(0.24, 0.82, 0), new THREE.Vector3(0.2, 0.55, 0),
      new THREE.Vector3(0.37, 0.3, 0), new THREE.Vector3(0.37, -0.3, 0),
      new THREE.Vector3(0.2, -0.55, 0), new THREE.Vector3(0.24, -0.82, 0),
      new THREE.Vector3(0.13, -1.15, 0), new THREE.Vector3(-0.08, -1.33, 0),
    ]);
    const olympicLimb = new THREE.Mesh(new THREE.TubeGeometry(olympicCurve, 72, 0.075, 12, false), referenceBrown);
    olympicLimb.castShadow = true;
    olympicBow.add(olympicLimb);
    [1.33, -1.33].forEach((y) => {
      const roundTip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), referenceBrown);
      roundTip.position.set(-0.08, y, 0);
      roundTip.castShadow = true;
      olympicBow.add(roundTip);
      const tipCollar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 24), referenceYellow);
      tipCollar.position.set(-0.025, y + (y > 0 ? -0.12 : 0.12), 0);
      tipCollar.rotation.z = y > 0 ? -0.7 : 0.7;
      olympicBow.add(tipCollar);
    });
    [
      [new THREE.Vector3(0.13, 1.1, 0), new THREE.Vector3(0.27, 0.82, 0), new THREE.Vector3(0.2, 0.58, 0)],
      [new THREE.Vector3(0.2, -0.58, 0), new THREE.Vector3(0.27, -0.82, 0), new THREE.Vector3(0.13, -1.1, 0)],
    ].forEach((points) => {
      const guard = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, 0.095, 12, false), referenceYellow);
      guard.castShadow = true;
      olympicBow.add(guard);
    });
    [0.42, -0.42, 1.17, -1.17].forEach((y, index) => {
      const collar = new THREE.Mesh(new THREE.BoxGeometry(index < 2 ? 0.2 : 0.16, 0.1, 0.16), referenceSilver);
      collar.position.set(index < 2 ? 0.31 : 0.08, y, 0);
      collar.rotation.z = index < 2 ? (y > 0 ? -0.35 : 0.35) : (y > 0 ? -0.65 : 0.65);
      olympicBow.add(collar);
    });
    const centerMount = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.27, 0.18), referenceSilver);
    centerMount.position.set(0.37, 0, 0);
    centerMount.castShadow = true;
    olympicBow.add(centerMount);
    const centerGrip = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.24, 6, 12), referenceBrown);
    centerGrip.position.set(0.36, 0, 0.02);
    olympicBow.add(centerGrip);
    const olympicStringGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.08, 1.33, 0), new THREE.Vector3(0.65, 0, 0), new THREE.Vector3(-0.08, -1.33, 0)]);
    const olympicString = new THREE.Line(olympicStringGeometry, new THREE.LineBasicMaterial({ color: 0xd9a73e, transparent: true, opacity: 0.98 }));
    olympicBow.add(olympicString);
    const competitionArrow = new THREE.Group();
    const compShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.55, 8), referenceBrown);
    compShaft.rotation.x = Math.PI / 2;
    competitionArrow.add(compShaft);
    const compTip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 10), referenceSilver);
    compTip.rotation.x = -Math.PI / 2;
    compTip.position.z = -1.4;
    competitionArrow.add(compTip);
    [-0.72, -0.15, 0.68].forEach((z) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.12, 8), referenceYellow);
      band.rotation.x = Math.PI / 2;
      band.position.z = z;
      competitionArrow.add(band);
    });
    const vane = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), new THREE.MeshStandardMaterial({ color: 0xf2ba42, roughness: 0.28, metalness: 0.48 }));
    vane.position.z = 1.08;
    competitionArrow.add(vane);
    const vaneCross = vane.clone();
    vaneCross.rotation.z = Math.PI / 2;
    competitionArrow.add(vaneCross);
    competitionArrow.position.set(0.28, 0.04, -0.9);
    olympicBow.add(competitionArrow);

    const target = new THREE.Group();
    target.position.set(0, 3.05, -18);
    const balloon = new THREE.Group();
    const balloonSkin = new THREE.MeshPhysicalMaterial({
      color: 0xff5c72,
      roughness: 0.16,
      metalness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xff9b79),
    });
    const balloonBody = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), balloonSkin);
    balloonBody.scale.set(1.02, 1.22, 0.82);
    balloonBody.castShadow = true;
    balloon.add(balloonBody);
    const lowerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 36, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xff7144, transparent: true, opacity: 0.34, roughness: 0.2, depthWrite: false })
    );
    lowerGlow.scale.set(1, 0.62, 0.9);
    lowerGlow.position.set(0, -0.35, 0.24);
    balloon.add(lowerGlow);
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.58, depthWrite: false })
    );
    shine.scale.set(0.42, 1.3, 0.18);
    shine.position.set(-0.37, 0.42, 0.73);
    balloon.add(shine);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.25, 14), new THREE.MeshStandardMaterial({ color: 0xf23c56, roughness: 0.35 }));
    knot.position.y = -1.28;
    knot.rotation.z = Math.PI;
    balloon.add(knot);
    const balloonStringGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.38, 0),
      new THREE.Vector3(-0.08, -1.72, 0),
      new THREE.Vector3(0.06, -2.12, 0),
      new THREE.Vector3(-0.02, -2.42, 0),
    ]);
    balloon.add(new THREE.Line(balloonStringGeometry, new THREE.LineBasicMaterial({ color: 0x242326, transparent: true, opacity: 0.85 })));
    balloonRef.current = balloon;
    target.add(balloon);
    targetRef.current = target;
    scene.add(target);

    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = Math.random() * 10;
      positions[i * 3 + 2] = 8 - Math.random() * 40;
    }
    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(particles, new THREE.PointsMaterial({ color: 0xc5f7cf, size: 0.035, transparent: true, opacity: 0.65 })));

    let frame = 0;
    const clock = new THREE.Clock();
    let drawBlend = 0;
    let lastWindUpdate = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const signedWind = Math.sin(t * 0.48) * 4.2 + Math.sin(t * 1.37 + 0.8) * 2.1;
      const nextWind = {
        speed: THREE.MathUtils.clamp(Math.abs(signedWind) + 0.55, 0.55, 7.8),
        direction: signedWind >= 0 ? 1 : -1,
      };
      windRef.current = nextWind;
      if (performance.now() - lastWindUpdate > 280) {
        lastWindUpdate = performance.now();
        setWind(nextWind);
      }
      if (targetRef.current && performance.now() > targetPauseRef.current) {
        const levelOffset = levelRef.current - 1;
        const speedMultiplier = 1 + levelOffset * 0.38;
        targetRef.current.position.x =
          Math.sin(t * 0.95 * speedMultiplier) * (3.1 + levelOffset * 0.18) +
          Math.sin(t * 2.15 * speedMultiplier + levelOffset * 0.55) * (0.42 + levelOffset * 0.08);
        targetRef.current.position.y =
          3.05 +
          Math.sin(t * 1.45 * speedMultiplier) * (0.52 + levelOffset * 0.07) +
          Math.sin(t * 3.7 * speedMultiplier + 0.4) * levelOffset * 0.035;
      }
      if (balloonRef.current?.visible) balloonRef.current.rotation.z = Math.sin(t * 1.2) * 0.065;
      const wantedDraw = drawingRef.current ? 1 : 0;
      drawBlend += (wantedDraw - drawBlend) * 0.11;
      const breath = Math.sin(t * 1.7) * 0.018;
      torso.scale.y = 1 + breath;
      head.position.y = 2.19 + breath * 0.5;
      rightArm.pivot.rotation.x = 0.78 - drawBlend * 0.63;
      rightArm.pivot.rotation.z = 0.55 - drawBlend * 0.2;
      rightArm.forearmPivot.rotation.x = 0.92 + drawBlend * 0.68;
      leftArm.pivot.rotation.x = 1.22 + drawBlend * 0.12;
      bowGroup.rotation.y = Math.sin(t * 1.5) * 0.012;
      stringGeometry.setFromPoints([
        new THREE.Vector3(0, 0.95, 0),
        new THREE.Vector3(0.05, 0, drawBlend * 0.52),
        new THREE.Vector3(0, -0.95, 0),
      ]);
      heldArrow.position.z = -0.88 + drawBlend * 0.5;
      heldArrow.visible = performance.now() > shotVisualRef.current;
      const bowCorner = getBowCornerPosition();
      bowCorner.y += Math.sin(t * 1.6) * 0.018;
      olympicBow.position.lerp(bowCorner, 0.12);
      olympicBow.lookAt(target.position);
      olympicBow.rotateY(Math.PI);
      olympicBow.rotateZ(-0.06 + Math.sin(t * 1.6) * 0.012);
      olympicStringGeometry.setFromPoints([
        new THREE.Vector3(-0.08, 1.33, 0),
        new THREE.Vector3(0.65, 0, drawBlend * 0.62),
        new THREE.Vector3(-0.08, -1.33, 0),
      ]);
      competitionArrow.position.z = -0.9 + drawBlend * 0.58;
      competitionArrow.visible = performance.now() > shotVisualRef.current;
      camera.position.x += (aimRef.current.x * 0.42 - camera.position.x) * 0.045;
      camera.position.y += (2.15 + aimRef.current.y * 0.28 - camera.position.y) * 0.045;
      camera.lookAt(aimRef.current.x * 0.75, 2.3 + aimRef.current.y * 0.5, -12);
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const broadcast = useCallback((type: RoomMessage["type"], nextScore = scoreRef.current, nextArrows = arrowsRef.current) => {
    channelRef.current?.postMessage({ type, name, score: nextScore, arrows: nextArrows } satisfies RoomMessage);
  }, [name]);

  const connectRoom = useCallback((code: string) => {
    channelRef.current?.close();
    const channel = new BroadcastChannel(`arrowfall-${code}`);
    channel.onmessage = (event: MessageEvent<RoomMessage>) => {
      const data = event.data;
      setOpponent({ name: data.name, score: data.score, arrows: data.arrows });
      if (data.type === "hello") {
        channel.postMessage({ type: "shot", name, score: scoreRef.current, arrows: arrowsRef.current } satisfies RoomMessage);
      }
    };
    channelRef.current = channel;
    channel.postMessage({ type: "hello", name, score: 0, arrows: 0 } satisfies RoomMessage);
  }, [name]);

  useEffect(() => () => channelRef.current?.close(), []);

  const startGame = (selectedMode: GameMode, selectedRoom?: string, continueProgress = false) => {
    const code = (selectedRoom || room || makeRoomCode()).toUpperCase();
    setMode(selectedMode);
    setRoom(code);
    setScore(0);
    setArrows(0);
    setOpponent({ name: selectedMode === "room" ? "Waiting…" : "Forest AI", score: 0, arrows: 0 });
    setLastShot(null);
    if (!continueProgress) {
      levelRef.current = 1;
      hitsInLevelRef.current = 0;
      setLevel(1);
      setHitsInLevel(0);
    }
    setLevelPulse(false);
    setAwaitingNextShot(false);
    awaitingNextShotRef.current = false;
    shotLockedRef.current = false;
    if (balloonRef.current) {
      balloonRef.current.visible = true;
      balloonRef.current.scale.setScalar(1);
    }
    resetEnvironmentRef.current();
    resetBowPositionRef.current();
    setScreen("game");
    startMusic();
    if (selectedMode === "room") connectRoom(code);
  };

  const fire = useCallback((clientX: number, clientY: number) => {
    if (!playingRef.current || arrowsRef.current >= MAX_ARROWS || shotLockedRef.current || awaitingNextShotRef.current) return;
    const mount = mountRef.current;
    const camera = cameraRef.current;
    const target = targetRef.current;
    const scene = sceneRef.current;
    if (!mount || !camera || !target || !scene) return;

    const rect = mount.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -target.position.z);
    const hit = new THREE.Vector3();
    ray.ray.intersectPlane(plane, hit);
    const strength = Math.min(1, (performance.now() - drawStart.current) / 900);
    const flightSeconds = THREE.MathUtils.lerp(1.12, 0.78, strength);
    hit.y -= Math.pow(1 - strength, 1.35) * 1.35;

    const aimedEnd = hit.clone();
    aimedEnd.z += 0.22;
    const start = bowRef.current
      ? bowRef.current.getWorldPosition(new THREE.Vector3())
      : camera.position.clone().add(ray.ray.direction.clone().multiplyScalar(1.35));
    start.addScaledVector(aimedEnd.clone().sub(start).normalize(), 0.8);
    const shotWind = { ...windRef.current };
    const gravity = new THREE.Vector3(0, -8.4, 0);
    // Convert the displayed crosswind into a lateral acceleration. Launch
    // velocity compensates gravity only; wind therefore moves the real impact.
    const windAcceleration = new THREE.Vector3(shotWind.direction * shotWind.speed * 0.16, 0, 0);
    const totalAcceleration = gravity.clone().add(windAcceleration);
    const launchVelocity = aimedEnd.clone()
      .sub(start)
      .sub(gravity.clone().multiplyScalar(0.5 * flightSeconds * flightSeconds))
      .divideScalar(flightSeconds);
    const end = start.clone()
      .addScaledVector(launchVelocity, flightSeconds)
      .addScaledVector(totalAcceleration, 0.5 * flightSeconds * flightSeconds);

    const dx = end.x - target.position.x;
    const dy = end.y - target.position.y;
    // Match the glossy balloon's elliptical silhouette exactly. Any impact
    // within the visible skin is a hit; central strikes earn more points.
    const balloonDistance = Math.sqrt((dx / 1.02) ** 2 + (dy / 1.22) ** 2);
    const points = balloonDistance < 0.12 ? 10 : balloonDistance < 0.28 ? 8 : balloonDistance < 0.48 ? 6 : balloonDistance < 0.7 ? 4 : balloonDistance < 0.88 ? 2 : balloonDistance <= 1 ? 1 : 0;
    const label = points === 10 ? "PERFECT POP" : points >= 8 ? "CLEAN POP" : points === 1 ? "EDGE POP" : points > 0 ? "BALLOON HIT" : "";

    playReleaseSound();
    shotVisualRef.current = performance.now() + 620;

    shotLockedRef.current = true;
    // Keep the target at the exact scored position until the arrow arrives.
    targetPauseRef.current = performance.now() + 1400;

    const arrow = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 2.4, 10), new THREE.MeshStandardMaterial({ color: 0xe0aa35, roughness: 0.3, metalness: 0.48 }));
    shaft.rotation.x = Math.PI / 2;
    arrow.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.28, 10), new THREE.MeshStandardMaterial({ color: 0xf0bd4b, metalness: 0.72, roughness: 0.22 }));
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 1.32;
    arrow.add(tip);
    [-0.58, 0.02, 0.62].forEach((z) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.039, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0xffd664, roughness: 0.28, metalness: 0.5 }));
      band.rotation.x = Math.PI / 2;
      band.position.z = z;
      arrow.add(band);
    });
    const featherMat = new THREE.MeshStandardMaterial({ color: 0xf3bd46, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.3 });
    const featherA = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.36), featherMat);
    featherA.position.z = -0.92;
    arrow.add(featherA);
    const featherB = featherA.clone();
    featherB.rotation.z = Math.PI / 2;
    arrow.add(featherB);
    arrow.scale.setScalar(1.18);

    arrow.position.copy(start);
    scene.add(arrow);

    // Animation and scoring share the same Newtonian trajectory.
    const trailGeometry = new THREE.BufferGeometry().setFromPoints([start, start]);
    const trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: 0xd8ff78, transparent: true, opacity: 0.72 }));
    scene.add(trail);

    const flightStarted = performance.now();
    let previous = start.clone();
    const fly = (now: number) => {
      const raw = Math.min(1, (now - flightStarted) / (flightSeconds * 1000));
      const elapsed = raw * flightSeconds;
      const current = start.clone()
        .addScaledVector(launchVelocity, elapsed)
        .addScaledVector(totalAcceleration, 0.5 * elapsed * elapsed);
      arrow.position.copy(current);
      const velocityNow = launchVelocity.clone().addScaledVector(totalAcceleration, elapsed);
      const lookAhead = current.clone().add(velocityNow.normalize().multiplyScalar(0.5));
      arrow.lookAt(lookAhead);
      trailGeometry.setFromPoints([previous, current]);
      previous = current.clone();
      if (raw < 1) requestAnimationFrame(fly);
      else {
        scene.remove(trail);
        if (points > 0 && balloonRef.current) {
          const poppedBalloon = balloonRef.current;
          const burstOrigin = new THREE.Vector3();
          poppedBalloon.getWorldPosition(burstOrigin);
          poppedBalloon.scale.setScalar(1.24);

          const fragments = new THREE.Group();
          fragments.position.copy(burstOrigin);
          const fragmentVelocities: THREE.Vector3[] = [];
          const fragmentMaterials = [0xff496d, 0xff7654, 0xffa067].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.42, side: THREE.DoubleSide }));
          for (let i = 0; i < 26; i++) {
            const fragment = new THREE.Mesh(new THREE.TetrahedronGeometry(0.055 + Math.random() * 0.075, 0), fragmentMaterials[i % fragmentMaterials.length]);
            fragment.position.set((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.42, (Math.random() - 0.5) * 0.28);
            fragments.add(fragment);
            fragmentVelocities.push(new THREE.Vector3((Math.random() - 0.5) * 4.8, (Math.random() - 0.15) * 4.2, (Math.random() - 0.5) * 3.2));
          }
          scene.add(fragments);
          window.setTimeout(() => {
            poppedBalloon.visible = false;
            poppedBalloon.scale.setScalar(1);
          }, 75);
          const burstStarted = performance.now();
          let burstPrevious = burstStarted;
          const animateBurst = (burstNow: number) => {
            const elapsedBurst = (burstNow - burstStarted) / 1000;
            const step = Math.min(0.034, (burstNow - burstPrevious) / 1000);
            burstPrevious = burstNow;
            fragments.children.forEach((piece, index) => {
              const velocity = fragmentVelocities[index];
              piece.position.addScaledVector(velocity, step);
              velocity.y -= 4.6 * step;
              piece.rotation.x += step * (3 + index % 5);
              piece.rotation.z += step * (2 + index % 4);
              piece.scale.setScalar(Math.max(0.05, 1 - elapsedBurst * 0.8));
            });
            if (elapsedBurst < 1.05) requestAnimationFrame(animateBurst);
            else scene.remove(fragments);
          };
          requestAnimationFrame(animateBurst);
        }
        playImpactSound(points > 0);
        if (points > 0 && levelRef.current < MAX_LEVEL) {
          const nextHits = hitsInLevelRef.current + 1;
          if (nextHits >= HITS_PER_LEVEL) {
            const nextLevel = Math.min(MAX_LEVEL, levelRef.current + 1);
            levelRef.current = nextLevel;
            hitsInLevelRef.current = 0;
            setLevel(nextLevel);
            setHitsInLevel(0);
            setLevelPulse(true);
            window.setTimeout(() => setLevelPulse(false), 1500);
          } else {
            hitsInLevelRef.current = nextHits;
            setHitsInLevel(nextHits);
          }
        }
        setLastShot({ points, label });
        if (nextArrows < MAX_ARROWS) {
          awaitingNextShotRef.current = true;
          setAwaitingNextShot(true);
        } else {
          shotLockedRef.current = false;
        }
        window.setTimeout(() => { scene.remove(arrow); }, 4200);
      }
    };
    requestAnimationFrame(fly);

    const nextScore = scoreRef.current + points;
    const nextArrows = arrowsRef.current + 1;
    scoreRef.current = nextScore;
    arrowsRef.current = nextArrows;
    setScore(nextScore);
    setArrows(nextArrows);
    broadcast("shot", nextScore, nextArrows);
    if (nextArrows >= MAX_ARROWS) window.setTimeout(() => setScreen("results"), 2400);
  }, [broadcast, playImpactSound, playReleaseSound]);

  useEffect(() => {
    if (!drawing) return;
    let raf = 0;
    const tick = () => {
      setPower(Math.min(100, (performance.now() - drawStart.current) / 8));
      powerRef.current = Math.min(100, (performance.now() - drawStart.current) / 9);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [drawing]);

  const pointerMove = (e: React.PointerEvent) => {
    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const pointerY = THREE.MathUtils.clamp((e.clientY - rect.top) / rect.height, 0, 1);
    aimRef.current = { x: (pointerX - 0.5) * 2, y: -(pointerY - 0.5) * 2 };
    if (reticleRef.current) {
      reticleRef.current.style.left = `${pointerX * 100}%`;
      reticleRef.current.style.top = `${pointerY * 100}%`;
    }
  };
  const pointerDown = (e: React.PointerEvent) => {
    if (screen !== "game" || arrows >= MAX_ARROWS || awaitingNextShotRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawStart.current = performance.now();
    powerRef.current = 0;
    setPower(0);
    setDrawing(true);
    ensureAudio();
    startMusic();
    playStretchSound();
  };
  const pointerUp = (e: React.PointerEvent) => {
    if (!drawing) return;
    stopStretchSound();
    setDrawing(false);
    fire(e.clientX, e.clientY);
  };

  const cancelDraw = () => {
    stopStretchSound();
    setDrawing(false);
  };

  const playAgain = () => {
    if (!awaitingNextShotRef.current) return;
    awaitingNextShotRef.current = false;
    shotLockedRef.current = false;
    setAwaitingNextShot(false);
    setLastShot(null);
    if (balloonRef.current) {
      balloonRef.current.visible = true;
      balloonRef.current.scale.setScalar(1);
    }
    cycleEnvironmentRef.current();
    cycleBowPositionRef.current();
    setEnvironmentPulse(true);
    window.setTimeout(() => setEnvironmentPulse(false), 520);
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      stopStretchSound();
      stopMusic();
      setAudioEnabled(false);
    } else {
      ensureAudio();
      setAudioEnabled(true);
    }
  };

  const copyInvite = async () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${room}`;
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get("room");
    if (incoming) { setRoom(incoming.toUpperCase()); setMode("room"); }
  }, []);

  const opponentScore = mode === "solo" ? Math.min(76, Math.round((arrows / MAX_ARROWS) * 55)) : opponent.score;
  const won = score >= opponentScore;

  return (
    <main className="game-shell" onPointerMove={pointerMove}>
      <div className="photo-backdrop" style={{ backgroundImage: `url(${RANGE_BACKDROPS[environmentName]})` }} aria-hidden="true" />
      <div ref={mountRef} className="world" onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={cancelDraw} />
      <div className="vignette" />
      <div className={`scene-transition ${environmentPulse ? "active" : ""}`} />
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("lobby")} aria-label="Back to lobby"><span>➶</span> ARROWFALL</button>
        <div className="topbar-status">
          <div className={`level-badge ${levelPulse ? "promoted" : ""}`} aria-label={`Level ${level}`}>
            <strong>LEVEL {level}</strong>
            <span>{level === MAX_LEVEL ? "MAX LEVEL" : `${hitsInLevel}/${HITS_PER_LEVEL} HITS`}</span>
          </div>
          {screen !== "lobby" && <div className="round-pill"><span className="live-dot" /> ROUND 01 · {environmentName}</div>}
        </div>
        <button className={`sound-button ${audioEnabled ? "active" : "muted"}`} onClick={toggleAudio} aria-label={audioEnabled ? "Mute game sound" : "Enable game sound"} aria-pressed={audioEnabled}>{audioEnabled ? "◖))" : "◖×"}</button>
      </header>

      {screen === "lobby" && (
        <section className="lobby-panel">
          <p className="eyebrow">ENTER THE WILDERNESS</p>
          <h1>Master the<br /><em>perfect shot.</em></h1>
          <p className="intro">Five changing worlds. One floating balloon. Draw fully, read the wind, and make it pop.</p>
          <label className="field-label" htmlFor="player-name">ARCHER NAME</label>
          <input id="player-name" className="name-input" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
          <div className="mode-grid">
            <button className={`mode-card ${mode === "solo" ? "selected" : ""}`} onClick={() => setMode("solo")}>
              <span className="mode-icon">◎</span><span><b>Solo Trial</b><small>Sharpen your aim</small></span><i>01</i>
            </button>
            <button className={`mode-card ${mode === "room" ? "selected" : ""}`} onClick={() => setMode("room")}>
              <span className="mode-icon">⌁</span><span><b>Multiplayer</b><small>Challenge a friend</small></span><i>02</i>
            </button>
          </div>
          {mode === "room" && (
            <div className="room-row">
              <input aria-label="Room code" placeholder="ROOM CODE (OPTIONAL)" value={room} onChange={(e) => setRoom(e.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase())} />
              <span>Leave blank to create</span>
            </div>
          )}
          <button className="primary-button" onClick={() => startGame(mode)}>{mode === "solo" ? "BEGIN THE TRIAL" : room ? "JOIN THE RANGE" : "CREATE A RANGE"}<span>→</span></button>
          <div className="lobby-meta"><span>◆ 3D WEBGL</span><span>◆ TOUCH READY</span><span>◆ LIVE ROOMS</span></div>
        </section>
      )}

      {screen === "game" && (
        <>
          <aside className="scoreboard">
            <div className="player active"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span><small>YOU</small><b>{name}</b></span><strong>{score}</strong></div>
            <div className="versus">VS</div>
            <div className="player"><span className="avatar rival">{opponent.name.slice(0, 1).toUpperCase()}</span><span><small>{mode === "room" ? "RIVAL" : "FOREST AI"}</small><b>{opponent.name}</b></span><strong>{opponentScore}</strong></div>
            {mode === "room" && <button className="invite-button" onClick={copyInvite}>{copied ? "INVITE COPIED" : `INVITE · ${room}`}</button>}
          </aside>
          <div className="distance"><small>FLOATING BALLOON</small><strong>38</strong><span>FEET AWAY</span></div>
          <div ref={reticleRef} className={`reticle ${drawing ? "drawing" : ""}`}><span /><i /></div>
          <div className={`wind ${wind.speed >= 5.3 ? "strong" : wind.speed <= 1.8 ? "calm" : ""}`}>
            <span>LIVE WIND</span>
            <b>{wind.direction > 0 ? "↗" : "↖"} {wind.speed.toFixed(1)}</b>
            <small>M/S · {wind.speed >= 5.3 ? "STRONG" : wind.speed <= 1.8 ? "LOW" : "SHIFTING"}</small>
          </div>
          <div className="arrows-left"><span>ARROWS LEFT</span><div>{Array.from({ length: MAX_ARROWS }).map((_, i) => <i key={i} className={i < arrows ? "used" : ""}>➶</i>)}</div></div>
          <div className="shot-hint"><b>{drawing ? (power < 75 ? "KEEP DRAWING" : "RELEASE TO FIRE") : "HOLD TO DRAW"}</b><span>{drawing ? `${Math.round(power)}% POWER · COMPENSATE FOR WIND` : "Full draw required · target changes course"}</span></div>
          {lastShot && (
            <div
              className={`shot-result ${lastShot.points > 0 ? "hit" : "miss"} ${lastShot.points === 10 ? "bullseye" : ""} ${awaitingNextShot ? "awaiting" : ""}`}
              role="status"
              aria-live="polite"
            >
              <i className="result-ripple" aria-hidden="true" />
              <strong>{lastShot.points > 0 ? "HIT!" : "MISS"}</strong>
              {lastShot.points > 0 && <span>{`${lastShot.label} · +${lastShot.points} POINTS`}</span>}
              {awaitingNextShot && <button className="play-again-button" onClick={playAgain}>PLAY AGAIN <i>➜</i></button>}
            </div>
          )}
        </>
      )}

      {screen === "results" && (
        <section className="results-panel">
          <p className="eyebrow">{mode === "solo" ? "SOLO TRIAL COMPLETE" : "MULTIPLAYER MATCH COMPLETE"}</p>
          <div className="result-mark">{mode === "solo" || won ? "★" : "☆"}</div>
          <h2>{mode === "solo" ? (score >= 40 ? "Amazing shooting!" : score >= 20 ? "Great effort!" : "Keep aiming!") : won ? "You won the match!" : `${opponent.name} wins this round!`}</h2>
          <p>{mode === "solo" ? `You completed the trial with ${score} points. Keep popping balloons to climb all five levels!` : won ? "Your focus held when it mattered most." : "Good match! Take another shot and try for the next win."}</p>
          {mode === "solo" ? (
            <div className="final-score solo-summary"><div><small>YOUR SCORE</small><strong>{score}</strong></div><span>★</span><div><small>LEVEL REACHED</small><strong>{level}</strong></div></div>
          ) : (
            <div className="final-score"><div><small>{name}</small><strong>{score}</strong></div><span>VS</span><div><small>{opponent.name}</small><strong>{opponentScore}</strong></div></div>
          )}
          <button className="primary-button" onClick={() => startGame(mode, room, true)}>CONTINUE LEVEL {level} <span>↻</span></button>
          <button className="text-button" onClick={() => setScreen("lobby")}>RETURN TO LOBBY</button>
        </section>
      )}
      <footer><span>WORLD RANGE SERIES · {environmentName}</span><span>Drag to aim · Hold for full power · Release to shoot</span></footer>
    </main>
  );
}
