"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Hit = { x: number; y: number; score: number; label: string; color: string };

const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const ROUND_DARTS = 10;

function scoreAt(nx: number, ny: number) {
  const distance = Math.hypot(nx, ny);
  if (distance > 1) return { score: 0, label: "MISS" };
  if (distance < 0.052) return { score: 50, label: "BULLSEYE" };
  if (distance < 0.105) return { score: 25, label: "OUTER BULL" };

  const angle = (Math.atan2(nx, -ny) + Math.PI * 2) % (Math.PI * 2);
  const wedge = Math.floor((angle + Math.PI / 20) / (Math.PI / 10)) % 20;
  const base = NUMBERS[wedge];
  if (distance > 0.87) return { score: base * 2, label: `DOUBLE ${base}` };
  if (distance > 0.49 && distance < 0.59) return { score: base * 3, label: `TRIPLE ${base}` };
  return { score: base, label: `${base}` };
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aimRef = useRef({ x: 0, y: 0 });
  const targetAimRef = useRef({ x: 0, y: 0 });
  const swayRef = useRef({ x: 0, y: 0 });
  const hitsRef = useRef<Hit[]>([]);
  const animationRef = useRef<{ start: number; targetX: number; targetY: number } | null>(null);
  const throwingRef = useRef(false);
  const gameOverRef = useRef(false);
  const [score, setScore] = useState(0);
  const [dartsLeft, setDartsLeft] = useState(ROUND_DARTS);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState("HARD MODE: TRACK THE RETICLE!");
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const playTone = useCallback((frequency: number, duration = .08) => {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * .55), audio.currentTime + duration);
    gain.gain.setValueAtTime(.12, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
    oscillator.addEventListener("ended", () => void audio.close());
  }, [soundOn]);

  const resetGame = useCallback(() => {
    hitsRef.current = [];
    aimRef.current = { x: 0, y: 0 };
    targetAimRef.current = { x: 0, y: 0 };
    swayRef.current = { x: 0, y: 0 };
    animationRef.current = null;
    throwingRef.current = false;
    gameOverRef.current = false;
    setScore(0);
    setDartsLeft(ROUND_DARTS);
    setStreak(0);
    setMessage("HARD MODE: TRACK THE RETICLE!");
    setGameOver(false);
  }, []);

  const throwDart = useCallback(() => {
    if (throwingRef.current || gameOverRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const roundProgress = hitsRef.current.length / ROUND_DARTS;
    const spread = 0.07 + roundProgress * 0.04;
    const spreadAngle = Math.random() * Math.PI * 2;
    const spreadDistance = spread * Math.sqrt(Math.random());
    const targetX = aimRef.current.x + swayRef.current.x + Math.cos(spreadAngle) * spreadDistance;
    const targetY = aimRef.current.y + swayRef.current.y + Math.sin(spreadAngle) * spreadDistance;
    throwingRef.current = true;
    animationRef.current = { start: performance.now(), targetX, targetY };
    setMessage("WHOOSH!");
    playTone(520, .11);
  }, [playTone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let radius = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = rect.width;
      height = rect.height;
      cx = width * 0.51;
      cy = height * 0.46;
      radius = Math.min(width * 0.37, height * 0.39);
    };

    const point = (angle: number, r: number, ox = 0, oy = 0) => ({
      x: cx + ox + Math.sin(angle) * r,
      y: cy + oy - Math.cos(angle) * r,
    });

    const ringSegment = (index: number, inner: number, outer: number, color: string) => {
      const start = index * Math.PI / 10 - Math.PI / 20;
      const end = start + Math.PI / 10;
      const a = point(start, outer);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.arc(cx, cy, outer, start - Math.PI / 2, end - Math.PI / 2);
      const b = point(end, inner);
      ctx.lineTo(b.x, b.y);
      ctx.arc(cx, cy, inner, end - Math.PI / 2, start - Math.PI / 2, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(15,24,22,.52)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawDart = (x: number, y: number, scale: number, angle = -0.18) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#172224";
      ctx.lineWidth = Math.max(1.5, 3 * scale);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(45 * scale, 18 * scale);
      ctx.stroke();
      ctx.strokeStyle = "#f7d041";
      ctx.lineWidth = Math.max(2, 6 * scale);
      ctx.beginPath();
      ctx.moveTo(13 * scale, 5 * scale);
      ctx.lineTo(35 * scale, 14 * scale);
      ctx.stroke();
      ctx.fillStyle = "#ee5149";
      ctx.strokeStyle = "#172224";
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.beginPath();
      ctx.moveTo(34 * scale, 14 * scale);
      ctx.lineTo(50 * scale, 1 * scale);
      ctx.lineTo(48 * scale, 18 * scale);
      ctx.lineTo(58 * scale, 26 * scale);
      ctx.lineTo(36 * scale, 19 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const draw = (now: number) => {
      const frameScale = lastFrame ? Math.min((now - lastFrame) / 16.67, 2) : 1;
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#84d9e9");
      sky.addColorStop(1, "#dff4dc");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255,255,255,.42)";
      for (let i = 0; i < 7; i++) {
        const x = ((i * 213 + now * 0.006) % (width + 170)) - 85;
        const y = 35 + (i % 3) * 82;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.arc(x + 26, y - 7, 31, 0, Math.PI * 2);
        ctx.arc(x + 57, y + 2, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#72bd78";
      ctx.beginPath();
      ctx.moveTo(0, height * .8);
      ctx.quadraticCurveTo(width * .18, height * .64, width * .38, height * .83);
      ctx.quadraticCurveTo(width * .68, height * .64, width, height * .82);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Board shadow and cartoon depth.
      ctx.fillStyle = "rgba(28,55,50,.22)";
      ctx.beginPath();
      ctx.ellipse(cx + radius * .1, cy + radius * 1.04, radius * .76, radius * .16, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let d = 18; d >= 0; d -= 3) {
        ctx.fillStyle = d % 6 === 0 ? "#233b38" : "#35544e";
        ctx.beginPath();
        ctx.arc(cx + d, cy + d * .45, radius * 1.14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f6c84b";
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#172a2b";
      ctx.lineWidth = Math.max(5, radius * .035);
      ctx.stroke();
      ctx.fillStyle = "#203b38";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 20; i++) {
        const light = i % 2 === 0;
        ringSegment(i, radius * .59, radius * .87, light ? "#f6e9c2" : "#263c39");
        ringSegment(i, radius * .105, radius * .49, light ? "#f6e9c2" : "#263c39");
        ringSegment(i, radius * .49, radius * .59, light ? "#ef554d" : "#62b96c");
        ringSegment(i, radius * .87, radius, light ? "#ef554d" : "#62b96c");
      }

      ctx.fillStyle = "#62b96c";
      ctx.beginPath();
      ctx.arc(cx, cy, radius * .105, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef554d";
      ctx.beginPath();
      ctx.arc(cx, cy, radius * .052, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `900 ${Math.max(12, radius * .095)}px Arial Black, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff8db";
      ctx.strokeStyle = "#172a2b";
      ctx.lineWidth = Math.max(2, radius * .015);
      NUMBERS.forEach((number, i) => {
        const p = point(i * Math.PI / 10, radius * 1.065);
        ctx.strokeText(String(number), p.x, p.y);
        ctx.fillText(String(number), p.x, p.y);
      });

      hitsRef.current.forEach((hit) => drawDart(cx + hit.x * radius, cy + hit.y * radius, .5));

      const anim = animationRef.current;
      if (anim) {
        const t = Math.min((now - anim.start) / 430, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const fromX = width * .89;
        const fromY = height * .9;
        const tx = cx + anim.targetX * radius;
        const ty = cy + anim.targetY * radius;
        const x = fromX + (tx - fromX) * eased;
        const y = fromY + (ty - fromY) * eased - Math.sin(t * Math.PI) * 55;
        drawDart(x, y, 1.35 - eased * .85);

        if (t >= 1) {
          const result = scoreAt(anim.targetX, anim.targetY);
          const color = result.score >= 50 ? "#ef554d" : result.score >= 20 ? "#f6c84b" : "#fff8db";
          hitsRef.current.push({ x: anim.targetX, y: anim.targetY, ...result, color });
          playTone(result.score >= 20 ? 760 : 280, result.score >= 20 ? .16 : .08);
          animationRef.current = null;
          throwingRef.current = false;
          setScore((value) => value + result.score);
          setStreak((value) => result.score >= 20 ? value + 1 : 0);
          setDartsLeft((value) => {
            const next = value - 1;
            if (next === 0) {
              gameOverRef.current = true;
              setGameOver(true);
              setMessage("ROUND COMPLETE!");
            } else {
              setMessage(result.label);
            }
            return next;
          });
        }
      } else if (!gameOverRef.current) {
        const roundProgress = hitsRef.current.length / ROUND_DARTS;
        const follow = 1 - Math.pow(.91, frameScale);
        aimRef.current.x += (targetAimRef.current.x - aimRef.current.x) * follow;
        aimRef.current.y += (targetAimRef.current.y - aimRef.current.y) * follow;

        const drift = .052 + roundProgress * .028;
        swayRef.current = {
          x: Math.sin(now * .0037) * drift + Math.sin(now * .0093) * .018 + Math.cos(now * .0011) * .012,
          y: Math.cos(now * .0031) * drift * .84 + Math.sin(now * .0074) * .016,
        };
        const rawX = cx + aimRef.current.x * radius;
        const rawY = cy + aimRef.current.y * radius;
        const ax = cx + (aimRef.current.x + swayRef.current.x) * radius;
        const ay = cy + (aimRef.current.y + swayRef.current.y) * radius;
        const pulse = 10 + Math.sin(now * .008) * 3;

        ctx.strokeStyle = "rgba(255,255,255,.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(rawX, rawY);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath();
        ctx.arc(rawX, rawY, 3, 0, Math.PI * 2);
        ctx.fill();

        const accuracyCone = (.07 + roundProgress * .04) * radius;
        ctx.strokeStyle = "rgba(239,85,77,.52)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.arc(ax, ay, accuracyCone, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ax, ay, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#ef554d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax - 18, ay); ctx.lineTo(ax + 18, ay);
        ctx.moveTo(ax, ay - 18); ctx.lineTo(ax, ay + 18);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    const updateAim = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      targetAimRef.current = {
        x: Math.max(-1.06, Math.min(1.06, (px - cx) / radius)),
        y: Math.max(-1.06, Math.min(1.06, (py - cy) / radius)),
      };
    };
    const onPointerMove = (event: PointerEvent) => updateAim(event.clientX, event.clientY);
    const onPointerDown = (event: PointerEvent) => { updateAim(event.clientX, event.clientY); throwDart(); };
    const onKeyDown = (event: KeyboardEvent) => {
      const step = .045;
      if (event.key === "ArrowLeft") targetAimRef.current.x = Math.max(-1.06, targetAimRef.current.x - step);
      if (event.key === "ArrowRight") targetAimRef.current.x = Math.min(1.06, targetAimRef.current.x + step);
      if (event.key === "ArrowUp") targetAimRef.current.y = Math.max(-1.06, targetAimRef.current.y - step);
      if (event.key === "ArrowDown") targetAimRef.current.y = Math.min(1.06, targetAimRef.current.y + step);
      if (event.code === "Space" || event.key === "Enter") { event.preventDefault(); throwDart(); }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [playTone, throwDart]);

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="Dart Dash home">
          <span>DART</span><strong>DASH!</strong>
        </a>
        <div className="score-pill" aria-live="polite">
          <span>SCORE</span><strong>{String(score).padStart(3, "0")}</strong>
        </div>
        <button
          className="sound-button"
          aria-label={`Sound effects ${soundOn ? "enabled" : "muted"}`}
          aria-pressed={soundOn}
          title="Toggle sound effects"
          onClick={() => setSoundOn((value) => !value)}
        >
          {soundOn ? "♪" : "×"}
        </button>
      </header>

      <section className="game-stage" id="game" aria-label="Dart game area">
        <canvas ref={canvasRef} aria-label="Interactive cartoon dartboard. Move your pointer to aim and tap to throw." />
        <aside className="round-card">
          <span>ROUND</span><strong>1</strong>
          <div className="mini-line" />
          <span>DARTS</span><b>{dartsLeft}</b>
        </aside>
        <div className="message-bubble" aria-live="polite">{message}</div>
        {streak > 1 && <div className="streak">🔥 {streak} HIT STREAK!</div>}
        <div className="difficulty-chip">✦ HARD MODE · WIND ON</div>
        <div className="instruction"><span>✥</span> MOVE TO AIM <b>•</b> TRACK RETICLE <b>•</b> TAP TO THROW</div>

        {gameOver && (
          <div className="game-over" role="dialog" aria-modal="true" aria-label="Round complete">
            <div className="result-card">
              <p>ROUND COMPLETE</p>
              <h1>{score}</h1>
              <span>POINTS SCORED</span>
              <button onClick={resetGame}>PLAY AGAIN <b>↻</b></button>
            </div>
          </div>
        )}
      </section>

      <footer>
        <span>10 DARTS. ONE BIG SCORE.</span>
        <span className="keyboard-hint">ARROW KEYS TO AIM · SPACE TO THROW</span>
      </footer>
    </main>
  );
}
