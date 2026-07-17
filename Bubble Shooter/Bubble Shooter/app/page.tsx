"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Bubble = { row: number; col: number; color: number };
type Flying = { x: number; y: number; vx: number; vy: number; color: number };

const COLORS = ["#ff5f79", "#ffc933", "#42d6a4", "#36a8ff", "#9b6bff"];
const SHADOWS = ["#be2949", "#db8f00", "#128b69", "#1761c4", "#5632b7"];
const COLS = 10;
const TAU = Math.PI * 2;

function seedBoard(): Bubble[] {
  const bubbles: Bubble[] = [];
  for (let row = 0; row < 6; row++) {
    const count = row % 2 ? COLS - 1 : COLS;
    for (let col = 0; col < count; col++) {
      if (row > 3 && Math.random() > 0.72) continue;
      const base = Math.floor(col / 2 + row * 0.7) % COLORS.length;
      bubbles.push({ row, col, color: Math.random() > 0.28 ? base : Math.floor(Math.random() * COLORS.length) });
    }
  }
  return bubbles;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<Bubble[]>(seedBoard());
  const flyingRef = useRef<Flying | null>(null);
  const aimRef = useRef({ x: 0, y: -1 });
  const nextRef = useRef(1);
  const shotRef = useRef(3);
  const runningRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(1);
  const [shots, setShots] = useState(0);
  const [music, setMusic] = useState(true);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");

  useEffect(() => {
    setBest(Number(localStorage.getItem("bubble-best") || 0));
  }, []);

  const playTone = useCallback((frequency: number, duration = 0.12, type: OscillatorType = "sine", volume = 0.045) => {
    const ctx = audioRef.current;
    if (!ctx || ctx.state !== "running") return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    musicTimerRef.current = null;
  }, []);

  const startMusic = useCallback(() => {
    if (musicTimerRef.current) return;
    const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23, 440, 587.33, 440, 349.23];
    let step = 0;
    playTone(notes[step], 0.22, "triangle", 0.025);
    musicTimerRef.current = setInterval(() => {
      step = (step + 1) % notes.length;
      playTone(notes[step], 0.22, "triangle", 0.025);
      if (step % 4 === 0) playTone(notes[step] / 2, 0.18, "sine", 0.012);
    }, 310);
  }, [playTone]);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    void audioRef.current.resume();
  }, []);

  useEffect(() => {
    if (started && music) startMusic();
    else stopMusic();
    return stopMusic;
  }, [music, started, startMusic, stopMusic]);

  const resetGame = useCallback(() => {
    boardRef.current = seedBoard();
    flyingRef.current = null;
    nextRef.current = Math.floor(Math.random() * COLORS.length);
    shotRef.current = Math.floor(Math.random() * COLORS.length);
    aimRef.current = { x: 0, y: -1 };
    runningRef.current = true;
    setScore(0);
    setCombo(1);
    setShots(0);
    setStatus("playing");
  }, []);

  const begin = () => {
    ensureAudio();
    resetGame();
    setStarted(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let width = 0;
    let height = 0;
    let radius = 22;
    let top = 34;
    let cannonY = 0;

    const metrics = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      radius = Math.min(24, Math.max(15, (width - 32) / (COLS * 2 + 1)));
      top = radius + 10;
      cannonY = height - Math.max(62, radius * 2.8);
    };

    const pos = (row: number, col: number) => ({
      x: radius + 8 + col * radius * 2 + (row % 2 ? radius : 0),
      y: top + row * radius * 1.72,
    });

    const drawBubble = (x: number, y: number, color: number, scale = 1, alpha = 1) => {
      const r = radius * scale;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = "rgba(48, 31, 84, .28)";
      ctx.shadowBlur = r * 0.38;
      ctx.shadowOffsetY = r * 0.22;
      const grad = ctx.createRadialGradient(x - r * 0.38, y - r * 0.45, r * 0.05, x, y, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.14, COLORS[color]);
      grad.addColorStop(0.78, COLORS[color]);
      grad.addColorStop(1, SHADOWS[color]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(255,255,255,.52)";
      ctx.lineWidth = Math.max(1.5, r * 0.09);
      ctx.beginPath();
      ctx.arc(x, y, r - ctx.lineWidth / 2, Math.PI * 0.9, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.beginPath();
      ctx.ellipse(x - r * .34, y - r * .4, r * .18, r * .11, -0.7, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    const key = (b: Bubble) => `${b.row}:${b.col}`;
    const neighbors = (b: Bubble) => {
      const offsets = b.row % 2
        ? [[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]]
        : [[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];
      return offsets.map(([dr, dc]) => boardRef.current.find(q => q.row === b.row + dr && q.col === b.col + dc)).filter(Boolean) as Bubble[];
    };

    const addRow = () => {
      const shifted = boardRef.current.map(b => ({ ...b, row: b.row + 1 }));
      const fresh: Bubble[] = [];
      for (let col = 0; col < COLS; col++) fresh.push({ row: 0, col, color: Math.floor(Math.random() * COLORS.length) });
      boardRef.current = [...fresh, ...shifted];
      playTone(130.81, .35, "sawtooth", .025);
    };

    const attach = (fly: Flying) => {
      let row = Math.max(0, Math.round((fly.y - top) / (radius * 1.72)));
      let col = Math.round((fly.x - radius - 8 - (row % 2 ? radius : 0)) / (radius * 2));
      col = Math.max(0, Math.min(row % 2 ? COLS - 2 : COLS - 1, col));
      const occupied = (r: number, c: number) => boardRef.current.some(b => b.row === r && b.col === c);
      if (occupied(row, col)) {
        const options: [number, number][] = [];
        for (let rr = Math.max(0, row - 1); rr <= row + 1; rr++) {
          const max = rr % 2 ? COLS - 2 : COLS - 1;
          for (let cc = Math.max(0, col - 1); cc <= Math.min(max, col + 1); cc++) if (!occupied(rr, cc)) options.push([rr, cc]);
        }
        options.sort((a, b) => {
          const pa = pos(a[0], a[1]); const pb = pos(b[0], b[1]);
          return Math.hypot(pa.x - fly.x, pa.y - fly.y) - Math.hypot(pb.x - fly.x, pb.y - fly.y);
        });
        if (options[0]) [row, col] = options[0];
      }
      const placed = { row, col, color: fly.color };
      boardRef.current.push(placed);

      const group: Bubble[] = [];
      const seen = new Set<string>();
      const stack = [placed];
      while (stack.length) {
        const b = stack.pop()!;
        if (seen.has(key(b)) || b.color !== placed.color) continue;
        seen.add(key(b)); group.push(b); stack.push(...neighbors(b));
      }

      if (group.length >= 3) {
        const popped = new Set(group.map(key));
        boardRef.current = boardRef.current.filter(b => !popped.has(key(b)));
        const anchored = new Set<string>();
        const anchorStack = boardRef.current.filter(b => b.row === 0);
        while (anchorStack.length) {
          const b = anchorStack.pop()!;
          if (anchored.has(key(b))) continue;
          anchored.add(key(b)); anchorStack.push(...neighbors(b));
        }
        const floaters = boardRef.current.filter(b => !anchored.has(key(b)));
        boardRef.current = boardRef.current.filter(b => anchored.has(key(b)));
        const gained = group.length * 100 * combo + floaters.length * 250;
        setScore(s => {
          const updated = s + gained;
          setBest(old => { const next = Math.max(old, updated); localStorage.setItem("bubble-best", String(next)); return next; });
          return updated;
        });
        setCombo(c => Math.min(5, c + 1));
        playTone(659.25, .14, "sine", .06);
        setTimeout(() => playTone(880, .18, "sine", .045), 70);
      } else {
        setCombo(1);
        if ((shots + 1) % 5 === 0) addRow();
        playTone(196, .1, "triangle", .035);
      }
      setShots(s => s + 1);
      if (!boardRef.current.length) { runningRef.current = false; setStatus("won"); playTone(1046.5, .6, "triangle", .07); }
      else if (boardRef.current.some(b => pos(b.row, b.col).y + radius > cannonY - radius * 2.15)) { runningRef.current = false; setStatus("lost"); playTone(110, .7, "sawtooth", .05); }
    };

    const aimFromEvent = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const dx = clientX - rect.left - width / 2;
      const dy = Math.min(-12, clientY - rect.top - cannonY);
      const len = Math.hypot(dx, dy) || 1;
      const x = Math.max(-.9, Math.min(.9, dx / len));
      aimRef.current = { x, y: -Math.sqrt(1 - x * x) };
    };

    const pointerMove = (e: PointerEvent) => aimFromEvent(e.clientX, e.clientY);
    const pointerDown = (e: PointerEvent) => {
      aimFromEvent(e.clientX, e.clientY);
      if (!runningRef.current || flyingRef.current) return;
      ensureAudio();
      const speed = Math.max(480, height * .72);
      flyingRef.current = { x: width / 2, y: cannonY, vx: aimRef.current.x * speed, vy: aimRef.current.y * speed, color: shotRef.current };
      shotRef.current = nextRef.current;
      nextRef.current = Math.floor(Math.random() * COLORS.length);
      playTone(392, .08, "square", .03);
    };
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") aimRef.current = { x: Math.max(-.9, aimRef.current.x - .06), y: 0 };
      if (e.key === "ArrowRight") aimRef.current = { x: Math.min(.9, aimRef.current.x + .06), y: 0 };
      aimRef.current.y = -Math.sqrt(1 - aimRef.current.x ** 2);
      if ((e.key === " " || e.key === "Enter") && runningRef.current && !flyingRef.current) {
        e.preventDefault(); pointerDown(new PointerEvent("pointerdown", { clientX: width / 2 + aimRef.current.x * 200, clientY: 0 }));
      }
    };
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerdown", pointerDown);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("resize", metrics);
    metrics();

    const frame = (now: number) => {
      const dt = Math.min(.025, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.58)";
      ctx.lineWidth = Math.max(3, radius * .16);
      ctx.setLineDash([2, radius * .72]);
      ctx.lineCap = "round";
      ctx.beginPath();
      let px = width / 2, py = cannonY, vx = aimRef.current.x, vy = aimRef.current.y;
      ctx.moveTo(px, py);
      for (let i = 0; i < 90; i++) {
        px += vx * radius * .17; py += vy * radius * .17;
        if (px < radius) { px = radius; vx = Math.abs(vx); }
        if (px > width - radius) { px = width - radius; vx = -Math.abs(vx); }
        ctx.lineTo(px, py);
        if (py < top || i > 42) break;
      }
      ctx.stroke(); ctx.restore();

      for (const b of boardRef.current) { const p = pos(b.row, b.col); drawBubble(p.x, p.y, b.color); }
      const flying = flyingRef.current;
      if (flying) {
        flying.x += flying.vx * dt; flying.y += flying.vy * dt;
        if (flying.x <= radius) { flying.x = radius; flying.vx = Math.abs(flying.vx); playTone(280, .035, "sine", .018); }
        if (flying.x >= width - radius) { flying.x = width - radius; flying.vx = -Math.abs(flying.vx); playTone(280, .035, "sine", .018); }
        const hit = flying.y <= top || boardRef.current.some(b => { const p = pos(b.row, b.col); return Math.hypot(p.x - flying.x, p.y - flying.y) < radius * 1.82; });
        if (hit) { attach(flying); flyingRef.current = null; }
        else drawBubble(flying.x, flying.y, flying.color, 1.03);
      }

      ctx.save();
      ctx.translate(width / 2, cannonY + radius * .55);
      ctx.rotate(Math.atan2(aimRef.current.y, aimRef.current.x) + Math.PI / 2);
      const barrel = ctx.createLinearGradient(-radius, 0, radius, 0);
      barrel.addColorStop(0, "#40306f"); barrel.addColorStop(.5, "#8577bd"); barrel.addColorStop(1, "#302258");
      ctx.fillStyle = barrel;
      ctx.beginPath(); ctx.roundRect(-radius * .48, -radius * 2.05, radius * .96, radius * 2.15, radius * .4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(50,38,91,.25)"; ctx.beginPath(); ctx.ellipse(width / 2, cannonY + radius * 1.45, radius * 1.45, radius * .42, 0, 0, TAU); ctx.fill();
      drawBubble(width / 2, cannonY, shotRef.current, 1.05);
      drawBubble(width / 2 + radius * 2.25, cannonY + radius * 1.12, nextRef.current, .62);
      ctx.fillStyle = "rgba(38,29,69,.72)"; ctx.font = `800 ${Math.max(9, radius * .47)}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("NEXT", width / 2 + radius * 2.25, cannonY + radius * 2.12);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("resize", metrics);
    };
  }, [combo, ensureAudio, playTone, shots]);

  return (
    <main className="game-shell">
      <div className="sky-decor" aria-hidden="true"><i /><i /><i /></div>
      <header className="topbar">
        <div className="brand"><span className="brand-orb">B</span><div><b>Bubble</b><strong>BOOM!</strong></div></div>
        <div className="stats" aria-label="Game statistics">
          <div><span>Score</span><b>{score.toLocaleString()}</b></div>
          <div><span>Best</span><b>{best.toLocaleString()}</b></div>
        </div>
        <div className="top-actions">
          <button className="sound-button" onClick={() => { ensureAudio(); setMusic(m => !m); }} aria-label={music ? "Mute music" : "Play music"}>{music ? "♫" : "♪"}</button>
          <button className="restart-button" onClick={() => { ensureAudio(); resetGame(); setStarted(true); }}>↻ <span>Restart</span></button>
        </div>
      </header>

      <section className="game-stage" aria-label="Bubble shooter game">
        <div className="side-card mission"><span className="eyebrow">Current mission</span><b>Clear the sky!</b><p>Match 3 or more bubbles of the same color.</p><div className="shot-pips">{[0,1,2,3,4].map(i => <i key={i} className={i < shots % 5 ? "used" : ""} />)}</div><small>{5 - (shots % 5)} shots until drop</small></div>
        <div className="board-wrap">
          <div className="rope" aria-hidden="true" />
          <canvas ref={canvasRef} className="game-canvas" aria-label="Aim with your pointer and click to shoot bubbles. Use arrow keys and Space on a keyboard." />
          <div className="hint">Move to aim <span>•</span> Click to shoot</div>
          {!started && <div className="game-modal intro"><span className="modal-bubble">★</span><h1>Ready to pop?</h1><p>Aim, bounce, and match 3 bubbles to make the sky sparkle.</p><button onClick={begin}>Play now <span>▶</span></button><small>Music starts when you play</small></div>}
          {started && status !== "playing" && <div className="game-modal result"><span className="modal-bubble">{status === "won" ? "★" : "!"}</span><h2>{status === "won" ? "Sky cleared!" : "So close!"}</h2><p>{status === "won" ? `Amazing! You scored ${score.toLocaleString()} points.` : "The bubbles reached the launcher. Give it another go!"}</p><button onClick={resetGame}>Play again <span>↻</span></button></div>}
        </div>
        <div className="side-stack">
          <div className="side-card combo-card"><span className="eyebrow">Pop streak</span><div className="combo-number">×{combo}</div><b>{combo > 2 ? "Blazing!" : combo > 1 ? "Nice combo!" : "Build a combo"}</b></div>
          <div className="side-card tip-card"><span className="tip-icon">↗</span><div><span className="eyebrow">Pro tip</span><p>Bounce shots off the sides to reach tricky clusters.</p></div></div>
        </div>
      </section>

      <footer><span>Bubble Boom!</span><p>Made for happy little breaks.</p><div><kbd>←</kbd><kbd>→</kbd> aim <kbd>Space</kbd> shoot</div></footer>
    </main>
  );
}
