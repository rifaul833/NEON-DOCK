"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Disc = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: "cream" | "navy" | "queen" | "striker";
  active: boolean;
};

type PointerInteraction = {
  mode: "pending" | "position" | "aim";
  startX: number;
  startY: number;
  strikerX: number;
};

const SIZE = 800;
const WALL_MIN = 78;
const WALL_MAX = 722;
const POCKETS = [
  [76, 76],
  [724, 76],
  [76, 724],
  [724, 724],
] as const;
const POCKET_RADIUS = 44;
const TOKEN_POINTS: Record<Disc["kind"], number> = {
  navy: 10,
  cream: 20,
  queen: 50,
  striker: 0,
};
const SHOT_SECONDS = 30;

function makeDiscs(): Disc[] {
  const discs: Disc[] = [];
  let id = 0;
  const gap = 39;
  const rows = [3, 4, 5, 4, 3];
  rows.forEach((count, row) => {
    const y = 400 + (row - 2) * 34;
    for (let col = 0; col < count; col += 1) {
      const x = 400 + (col - (count - 1) / 2) * gap;
      const center = row === 2 && col === 2;
      discs.push({
        id: id++,
        x,
        y,
        vx: 0,
        vy: 0,
        r: 18,
        kind: center ? "queen" : (id + row) % 2 ? "cream" : "navy",
        active: true,
      });
    }
  });
  discs.push({
    id: 99,
    x: 400,
    y: 648,
    vx: 0,
    vy: 0,
    r: 23,
    kind: "striker",
    active: true,
  });
  return discs;
}

export function CarromGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const discsRef = useRef<Disc[]>(makeDiscs());
  const draggingRef = useRef<{ x: number; y: number } | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const interactionRef = useRef<PointerInteraction | null>(null);
  const phaseRef = useRef<"player" | "moving" | "ai">("player");
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);
  const pocketedThisShot = useRef(0);
  const expireTurnRef = useRef(false);
  const [shotLeft, setShotLeft] = useState(SHOT_SECONDS);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [turn, setTurn] = useState<"you" | "milo">("you");
  const [soundOn, setSoundOn] = useState(true);
  const [message, setMessage] = useState("Your turn — drag the striker and let go!");

  const getAudioContext = useCallback(() => {
    const AudioCtor = window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioRef.current || new AudioCtor();
    audioRef.current = ctx;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }, []);

  const playMusicNote = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
      const step = musicStepRef.current % melody.length;
      musicStepRef.current += 1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = melody[step];
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);

      if (step % 4 === 0) {
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = "sine";
        bass.frequency.value = step === 0 ? 130.81 : 146.83;
        bassGain.gain.setValueAtTime(0.018, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
        bass.connect(bassGain).connect(ctx.destination);
        bass.start();
        bass.stop(ctx.currentTime + 0.67);
      }
    } catch {
      // Music is a progressive enhancement.
    }
  }, [getAudioContext]);

  const startMusic = useCallback(() => {
    if (musicTimerRef.current !== null) return;
    playMusicNote();
    musicTimerRef.current = window.setInterval(playMusicNote, 360);
  }, [playMusicNote]);

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current !== null) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopMusic(), [stopMusic]);

  const ping = useCallback(
    (frequency: number, duration = 0.05) => {
      if (!soundOn) return;
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio is optional; the game remains fully playable without it.
      }
    },
    [getAudioContext, soundOn]
  );

  const toggleSound = useCallback(() => {
    if (soundOn) {
      stopMusic();
      setSoundOn(false);
    } else {
      setSoundOn(true);
      startMusic();
    }
  }, [soundOn, startMusic, stopMusic]);

  const resetGame = useCallback(() => {
    discsRef.current = makeDiscs();
    phaseRef.current = "player";
    draggingRef.current = null;
    pointerRef.current = null;
    interactionRef.current = null;
    pocketedThisShot.current = 0;
    expireTurnRef.current = false;
    setShotLeft(SHOT_SECONDS);
    setPlayerScore(0);
    setAiScore(0);
    setTurn("you");
    setMessage("Fresh board! Slide the striker, then pull back to shoot.");
    if (soundOn) startMusic();
  }, [soundOn, startMusic]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let calmFrames = 0;

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(ang - 0.45) * 14, y2 - Math.sin(ang - 0.45) * 14);
      ctx.lineTo(x2 - Math.cos(ang + 0.45) * 14, y2 - Math.sin(ang + 0.45) * 14);
      ctx.closePath();
      ctx.fill();
    };

    const drawBoard = () => {
      const frame = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      frame.addColorStop(0, "#6b3a1f");
      frame.addColorStop(0.35, "#4a2412");
      frame.addColorStop(0.7, "#3a1c0e");
      frame.addColorStop(1, "#5c3018");
      ctx.fillStyle = frame;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = "rgba(255,210,140,.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, i * 21);
        ctx.lineTo(SIZE, i * 21 + 6);
        ctx.stroke();
      }

      ctx.fillStyle = "#2a140a";
      ctx.fillRect(22, 22, 756, 756);
      const ply = ctx.createLinearGradient(58, 58, 742, 120);
      ply.addColorStop(0, "#c48a4a");
      ply.addColorStop(0.22, "#b07538");
      ply.addColorStop(0.5, "#d49a55");
      ply.addColorStop(0.78, "#a86a32");
      ply.addColorStop(1, "#c08040");
      ctx.fillStyle = ply;
      ctx.fillRect(58, 58, 684, 684);
      ctx.save();
      ctx.beginPath();
      ctx.rect(58, 58, 684, 684);
      ctx.clip();
      for (let i = 0; i < 90; i += 1) {
        ctx.strokeStyle = i % 7 === 0 ? "rgba(70,32,10,.16)" : "rgba(255,220,160,.07)";
        ctx.lineWidth = i % 11 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(58 + i * 7.7, 58);
        ctx.lineTo(58 + i * 7.7 + 8, 742);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "#8a4e24";
      ctx.lineWidth = 8;
      ctx.strokeRect(54, 54, 692, 692);
      ctx.strokeStyle = "rgba(255,200,120,.22)";
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 50, 700, 700);
      [[18, 18], [782, 18], [18, 782], [782, 782]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#c9a36a";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#5a3a18";
        ctx.fill();
      });

      const ink = "#9c1c1c";
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(400, 400, 92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(400, 400, 78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#b42222";
      ctx.beginPath();
      ctx.arc(400, 400, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f3e6c8";
      ctx.lineWidth = 2;
      ctx.stroke();

      const arrows: [number, number, number, number][] = [
        [118, 118, 250, 250],
        [682, 118, 550, 250],
        [118, 682, 250, 550],
        [682, 682, 550, 550],
      ];
      arrows.forEach(([x1, y1, x2, y2]) => drawArrow(x1, y1, x2, y2, ink));

      [156, 644].forEach((y) => {
        ctx.strokeStyle = "#f0e2c4";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(174, y);
        ctx.lineTo(626, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(174, y + (y < 400 ? 16 : -16));
        ctx.lineTo(626, y + (y < 400 ? 16 : -16));
        ctx.stroke();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        [174, 626].forEach((x) => {
          ctx.beginPath();
          ctx.arc(x, y, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();
        });
        if (y === 156) {
          drawArrow(174, 130, 118, 90, ink);
          drawArrow(626, 130, 682, 90, ink);
        } else {
          drawArrow(174, 670, 118, 710, ink);
          drawArrow(626, 670, 682, 710, ink);
        }
      });
      [156, 644].forEach((x) => {
        ctx.strokeStyle = "#f0e2c4";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x, 174);
        ctx.lineTo(x, 626);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + (x < 400 ? 16 : -16), 174);
        ctx.lineTo(x + (x < 400 ? 16 : -16), 626);
        ctx.stroke();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        [174, 626].forEach((y) => {
          ctx.beginPath();
          ctx.arc(x, y, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();
        });
        if (x === 156) {
          drawArrow(130, 174, 90, 118, ink);
          drawArrow(130, 626, 90, 682, ink);
        } else {
          drawArrow(670, 174, 710, 118, ink);
          drawArrow(670, 626, 710, 682, ink);
        }
      });

      POCKETS.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 42, 0, Math.PI * 2);
        ctx.fillStyle = "#1a0c08";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 42, 0, Math.PI * 2);
        ctx.strokeStyle = "#c9a36a";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 33, 0, Math.PI * 2);
        ctx.fillStyle = "#050304";
        ctx.fill();
        ctx.strokeStyle = "rgba(180,140,80,.25)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i += 1) {
          const a = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * 32, y + Math.sin(a) * 32);
          ctx.stroke();
        }
      });
    };

    const drawDisc = (disc: Disc) => {
      if (!disc.active) return;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, .45)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 5;
      ctx.beginPath();
      ctx.arc(disc.x, disc.y, disc.r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        disc.x - disc.r * 0.32,
        disc.y - disc.r * 0.38,
        1,
        disc.x,
        disc.y,
        disc.r
      );
      const colors = {
        cream: ["#f7f1e3", "#cfc3a6"],
        navy: ["#3a3a3a", "#111111"],
        queen: ["#e23b3b", "#8e1212"],
        striker: ["#f8f4ea", "#d5cbb4"],
      } as const;
      grad.addColorStop(0, colors[disc.kind][0]);
      grad.addColorStop(1, colors[disc.kind][1]);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = "transparent";
      const ring = (scale: number, color: string, width: number) => {
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, disc.r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      if (disc.kind === "striker") {
        ring(0.96, "#9c1c1c", 2.4);
        ring(0.72, "#9c1c1c", 1.8);
        ring(0.48, "#9c1c1c", 1.6);
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, disc.r * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = "#9c1c1c";
        ctx.fill();
      } else if (disc.kind === "queen") {
        ring(0.96, "#f3e6c8", 2.2);
        ring(0.72, "rgba(255,236,200,.75)", 1.6);
        ring(0.48, "rgba(255,236,200,.55)", 1.3);
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, disc.r * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = "#f3e6c8";
        ctx.fill();
      } else if (disc.kind === "cream") {
        ring(0.84, "rgba(110,80,40,.45)", 1.5);
        ring(0.62, "rgba(110,80,40,.35)", 1.2);
        ring(0.38, "rgba(110,80,40,.3)", 1);
      } else {
        ring(0.84, "rgba(210,210,210,.28)", 1.5);
        ring(0.62, "rgba(210,210,210,.22)", 1.2);
        ring(0.38, "rgba(210,210,210,.18)", 1);
      }
      ctx.restore();
    };

    const drawAim = () => {
      const start = draggingRef.current;
      const current = pointerRef.current;
      const striker = discsRef.current.find((d) => d.kind === "striker");
      if (!start || !current || !striker || phaseRef.current !== "player") return;
      const dx = start.x - current.x;
      const dy = start.y - current.y;
      const len = Math.min(170, Math.hypot(dx, dy));
      if (len < 4) return;
      const nx = dx / Math.hypot(dx, dy);
      const ny = dy / Math.hypot(dx, dy);
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = "rgba(243, 230, 200, .85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(striker.x + nx * 34, striker.y + ny * 34);
      ctx.lineTo(striker.x + nx * (75 + len * 1.2), striker.y + ny * (75 + len * 1.2));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(striker.x, striker.y, 31 + len * 0.03, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(243,230,200,.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    const drawPlacementGuide = () => {
      if (phaseRef.current !== "player") return;
      const striker = discsRef.current.find((d) => d.kind === "striker" && d.active);
      if (!striker) return;
      ctx.save();
      ctx.strokeStyle = "rgba(243, 230, 200, .55)";
      ctx.lineWidth = 3;
      ctx.setLineDash([9, 9]);
      ctx.beginPath();
      ctx.moveTo(205, 680);
      ctx.lineTo(595, 680);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(243, 230, 200, .8)";
      ctx.beginPath();
      ctx.moveTo(190, 680);
      ctx.lineTo(211, 668);
      ctx.lineTo(211, 692);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(610, 680);
      ctx.lineTo(589, 668);
      ctx.lineTo(589, 692);
      ctx.closePath();
      ctx.fill();
      if (interactionRef.current?.mode === "position") {
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, 34, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = 5;
        ctx.stroke();
      }
      ctx.restore();
    };

    const pocket = (disc: Disc) => {
      disc.active = false;
      disc.vx = 0;
      disc.vy = 0;
      ping(disc.kind === "queen" ? 720 : 540, 0.12);
      if (disc.kind === "striker") {
        setMessage("Oops — striker foul! Milo gets the next shot.");
      } else {
        const points = TOKEN_POINTS[disc.kind] || 0;
        pocketedThisShot.current += points;
        if (turn === "you") setPlayerScore((v) => v + points);
        else setAiScore((v) => v + points);
      }
    };

    const update = () => {
      const discs = discsRef.current;
      let moving = false;
      for (const disc of discs) {
        if (!disc.active) continue;
        disc.x += disc.vx;
        disc.y += disc.vy;
        disc.vx *= 0.986;
        disc.vy *= 0.986;
        if (Math.hypot(disc.vx, disc.vy) < 0.035) {
          disc.vx = 0;
          disc.vy = 0;
        } else moving = true;

        const nearestPocket = POCKETS.reduce(
          (best, [x, y]) => {
            const d = Math.hypot(disc.x - x, disc.y - y);
            return d < best.d ? { d, x, y } : best;
          },
          { d: Infinity, x: 0, y: 0 },
        );
        if (nearestPocket.d < POCKET_RADIUS + 10) {
          disc.vx += ((nearestPocket.x - disc.x) / Math.max(8, nearestPocket.d)) * 0.55;
          disc.vy += ((nearestPocket.y - disc.y) / Math.max(8, nearestPocket.d)) * 0.55;
        }
        if (nearestPocket.d < POCKET_RADIUS) {
          pocket(disc);
          continue;
        }
        const inPocketMouth = nearestPocket.d < POCKET_RADIUS + disc.r + 8;
        if (!inPocketMouth && (disc.x - disc.r < WALL_MIN || disc.x + disc.r > WALL_MAX)) {
          disc.x = Math.max(WALL_MIN + disc.r, Math.min(WALL_MAX - disc.r, disc.x));
          disc.vx *= -0.86;
          ping(165);
        }
        if (!inPocketMouth && (disc.y - disc.r < WALL_MIN || disc.y + disc.r > WALL_MAX)) {
          disc.y = Math.max(WALL_MIN + disc.r, Math.min(WALL_MAX - disc.r, disc.y));
          disc.vy *= -0.86;
          ping(165);
        }
      }

      const active = discs.filter((d) => d.active);
      const strikerIsIdle = phaseRef.current !== "moving";
      for (let i = 0; i < active.length; i += 1) {
        for (let j = i + 1; j < active.length; j += 1) {
          const a = active[i];
          const b = active[j];
          if (strikerIsIdle && (a.kind === "striker" || b.kind === "striker")) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 0.1;
          const minDistance = a.r + b.r;
          if (distance >= minDistance) continue;
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minDistance - distance;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative <= 0) {
            const bounce = Math.min(-0.35, relative) * 1.08;
            a.vx += bounce * nx;
            a.vy += bounce * ny;
            b.vx -= bounce * nx;
            b.vy -= bounce * ny;
            ping(240 + Math.min(180, Math.abs(relative) * 15));
          }
        }
      }
      return moving;
    };

    const placeStriker = (side: "you" | "milo") => {
      const striker = discsRef.current.find((d) => d.kind === "striker")!;
      striker.active = true;
      striker.x = 400;
      striker.y = side === "you" ? 648 : 152;
      striker.vx = 0;
      striker.vy = 0;
    };

    const aiShoot = () => {
      const striker = discsRef.current.find((d) => d.kind === "striker")!;
      const targets = discsRef.current.filter((d) => d.active && d.kind !== "striker");
      if (!targets.length) return;
      const target = targets[Math.floor(Math.random() * targets.length)];
      const dx = target.x - striker.x + (Math.random() - 0.5) * 55;
      const dy = target.y - striker.y;
      const length = Math.hypot(dx, dy) || 1;
      striker.vx = (dx / length) * (11.5 + Math.random() * 3);
      striker.vy = (dy / length) * (11.5 + Math.random() * 3);
      phaseRef.current = "moving";
      pocketedThisShot.current = 0;
      setMessage("Milo takes a cheeky shot…");
      ping(330, 0.08);
    };

    const finishTurn = () => {
      const coinsLeft = discsRef.current.some((d) => d.active && d.kind !== "striker");
      if (!coinsLeft) {
        phaseRef.current = "ai";
        setMessage("Board cleared! What a match — play again?");
        return;
      }
      if (turn === "you") {
        placeStriker("milo");
        setTurn("milo");
        phaseRef.current = "ai";
        setMessage(pocketedThisShot.current ? "Sweet pocket! Milo is lining up…" : "Milo is lining up…");
        window.setTimeout(aiShoot, 700);
      } else {
        placeStriker("you");
        setTurn("you");
        phaseRef.current = "player";
        setMessage(pocketedThisShot.current ? "Milo scored. Your comeback starts now!" : "Your turn — show Milo how it’s done!");
      }
    };

    const frame = () => {
      if (expireTurnRef.current && phaseRef.current === "player") {
        expireTurnRef.current = false;
        pocketedThisShot.current = 0;
        setMessage("Time’s up — Milo takes the shot.");
        finishTurn();
      }
      const moving = update();
      drawBoard();
      drawPlacementGuide();
      discsRef.current.forEach(drawDisc);
      drawAim();
      if (phaseRef.current === "moving") {
        calmFrames = moving ? 0 : calmFrames + 1;
        if (calmFrames > 18) {
          calmFrames = 0;
          finishTurn();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [ping, turn]);

  useEffect(() => {
    if (turn !== "you") {
      setShotLeft(SHOT_SECONDS);
      return;
    }
    setShotLeft(SHOT_SECONDS);
    expireTurnRef.current = false;
    const id = window.setInterval(() => {
      if (phaseRef.current !== "player") return;
      setShotLeft((seconds) => {
        if (seconds <= 1) {
          expireTurnRef.current = true;
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [turn]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SIZE,
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "player") return;
    if (soundOn) startMusic();
    const point = pointFromEvent(event);
    const striker = discsRef.current.find((d) => d.kind === "striker" && d.active);
    if (!striker) return;
    const onStriker = Math.hypot(point.x - striker.x, point.y - striker.y) <= 65;
    const onBaseline = point.y >= 600 && point.y <= 700 && point.x >= 174 && point.x <= 626;
    if (!onStriker && !onBaseline) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      mode: onStriker ? "pending" : "position",
      startX: point.x,
      startY: point.y,
      strikerX: striker.x,
    };
    if (onBaseline && !onStriker) {
      striker.x = Math.max(202, Math.min(598, point.x));
      interactionRef.current.strikerX = striker.x;
      setMessage("Great angle! Slide to fine-tune, then drag from the striker to shoot.");
    } else {
      setMessage("Slide sideways to place — or pull away to aim!");
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || phaseRef.current !== "player") return;
    const point = pointFromEvent(event);
    const striker = discsRef.current.find((d) => d.kind === "striker" && d.active);
    if (!striker) return;
    const dx = point.x - interaction.startX;
    const dy = point.y - interaction.startY;
    if (interaction.mode === "pending" && Math.hypot(dx, dy) > 9) {
      interaction.mode = Math.abs(dx) > Math.abs(dy) * 1.25 && Math.abs(dy) < 38 ? "position" : "aim";
      if (interaction.mode === "aim") {
        draggingRef.current = { x: striker.x, y: striker.y };
        setMessage("Pull back for power — release to strike!");
      }
    }
    if (interaction.mode === "position") {
      striker.x = Math.max(202, Math.min(598, interaction.strikerX + dx));
      striker.y = 648;
      pointerRef.current = null;
      setMessage("Move left or right to choose your angle.");
    } else if (interaction.mode === "aim") {
      pointerRef.current = point;
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const interaction = interactionRef.current;
    interactionRef.current = null;
    if (!interaction || phaseRef.current !== "player") return;
    if (interaction.mode === "position" || interaction.mode === "pending") {
      draggingRef.current = null;
      pointerRef.current = null;
      setMessage("Position set! Now pull back from the striker to aim.");
      return;
    }
    const start = draggingRef.current;
    if (!start) return;
    const end = pointFromEvent(event);
    const dx = start.x - end.x;
    const dy = start.y - end.y;
    const length = Math.hypot(dx, dy);
    draggingRef.current = null;
    pointerRef.current = null;
    if (length < 10) {
      setMessage("Give it a bigger pull — you’ve got this!");
      return;
    }
    const striker = discsRef.current.find((d) => d.kind === "striker")!;
    const power = Math.min(17, 5 + length * 0.075);
    striker.vx = (dx / length) * power;
    striker.vy = (dy / length) * power;
    phaseRef.current = "moving";
    pocketedThisShot.current = 0;
    setMessage("Kaboom! Watch it roll…");
    ping(360, 0.08);
  };

  return (
    <main className="game-shell">
      <header className="game-header">
        <a className="brand" href="#game" aria-label="Carrom home">
          <span className="brand-mark" />
          <span>CARROM</span>
        </a>
        <div className="header-actions">
          <button className={`icon-button ${soundOn ? "sound-active" : ""}`} onClick={toggleSound} aria-label={soundOn ? "Mute music and sound effects" : "Turn music and sound effects on"} title={soundOn ? "Music and sound on" : "Music and sound off"}>
            {soundOn ? "♫" : "×"}
          </button>
          <button className="reset-button" onClick={resetGame}>New game</button>
        </div>
      </header>

      <section id="game" className="game-layout" aria-label="Carrom game">
        <aside className="side-panel you-panel">
          <p className="eyebrow">PLAYER 1</p>
          <h2>You</h2>
          <div className="score-bubble"><strong>{playerScore}</strong><span>points</span></div>
          <span className={`turn-pill ${turn === "you" ? "active" : ""}`}>
            {turn === "you" ? `${shotLeft}s to shoot` : "Waiting"}
          </span>
        </aside>

        <div className="board-column">
          <div className="board-stage">
            <div className="board-shadow" />
            <canvas
              ref={canvasRef}
              className="carrom-board"
              width={SIZE}
              height={SIZE}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { draggingRef.current = null; pointerRef.current = null; interactionRef.current = null; }}
              aria-label="Carrom board. Slide the striker along the baseline, then pull back and release to shoot."
            />
          </div>
          <div className="coach-card" aria-live="polite">
            <div><strong>{message}</strong><span>Slide to position. Pull back to aim. Release to shoot.</span></div>
          </div>
        </div>

        <aside className="side-panel milo-panel">
          <p className="eyebrow">PLAYER 2</p>
          <h2>Milo</h2>
          <div className="score-bubble"><strong>{aiScore}</strong><span>points</span></div>
          <span className={`turn-pill ${turn === "milo" ? "active" : ""}`}>Milo’s turn</span>
        </aside>
      </section>

      <footer>
        <span>Queen 50</span><b>•</b><span>White 20</span><b>•</b><span>Black 10</span><b>•</b><span>30s shot clock</span>
      </footer>
    </main>
  );
}
