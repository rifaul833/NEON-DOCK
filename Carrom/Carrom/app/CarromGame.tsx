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

const SIZE = 800;
const WALL_MIN = 78;
const WALL_MAX = 722;
const POCKETS = [
  [76, 76],
  [724, 76],
  [76, 724],
  [724, 724],
] as const;

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
  const phaseRef = useRef<"player" | "moving" | "ai">("player");
  const audioRef = useRef<AudioContext | null>(null);
  const pocketedThisShot = useRef(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [turn, setTurn] = useState<"you" | "milo">("you");
  const [soundOn, setSoundOn] = useState(true);
  const [message, setMessage] = useState("Your turn — drag the striker and let go!");

  const ping = useCallback(
    (frequency: number, duration = 0.05) => {
      if (!soundOn) return;
      try {
        const AudioCtor = window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = audioRef.current || new AudioCtor();
        audioRef.current = ctx;
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
    [soundOn]
  );

  const resetGame = useCallback(() => {
    discsRef.current = makeDiscs();
    phaseRef.current = "player";
    draggingRef.current = null;
    pointerRef.current = null;
    pocketedThisShot.current = 0;
    setPlayerScore(0);
    setAiScore(0);
    setTurn("you");
    setMessage("Fresh board! Drag the striker and let go.");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let calmFrames = 0;

    const drawStar = (x: number, y: number, radius: number) => {
      ctx.beginPath();
      for (let i = 0; i < 16; i += 1) {
        const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
        const rr = i % 2 ? radius * 0.45 : radius;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = "#f4b63f";
      ctx.fill();
      ctx.strokeStyle = "#b63a35";
      ctx.lineWidth = 5;
      ctx.stroke();
    };

    const drawBoard = () => {
      const board = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      board.addColorStop(0, "#f3c369");
      board.addColorStop(0.5, "#ffd986");
      board.addColorStop(1, "#dea34b");
      ctx.fillStyle = board;
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.fillStyle = "#963d2e";
      ctx.fillRect(28, 28, 744, 744);
      ctx.fillStyle = "#5b2630";
      ctx.fillRect(43, 43, 714, 714);
      ctx.fillStyle = "#f8d88e";
      ctx.fillRect(58, 58, 684, 684);
      ctx.strokeStyle = "rgba(117,50,42,.2)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i += 1) {
        ctx.beginPath();
        ctx.moveTo(80, 125 + i * 68);
        ctx.bezierCurveTo(290, 100 + i * 70, 515, 150 + i * 63, 720, 120 + i * 70);
        ctx.stroke();
      }

      POCKETS.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.fillStyle = "#351d2c";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 7, y - 7, 22, 0, Math.PI * 2);
        ctx.fillStyle = "#17111c";
        ctx.fill();
      });

      ctx.strokeStyle = "#b63a35";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(400, 400, 82, 0, Math.PI * 2);
      ctx.stroke();
      drawStar(400, 400, 57);

      [156, 644].forEach((y) => {
        ctx.strokeStyle = "#b63a35";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(174, y);
        ctx.lineTo(626, y);
        ctx.stroke();
        [174, 626].forEach((x) => {
          ctx.beginPath();
          ctx.arc(x, y, 27, 0, Math.PI * 2);
          ctx.stroke();
        });
      });
    };

    const drawDisc = (disc: Disc) => {
      if (!disc.active) return;
      ctx.save();
      ctx.shadowColor = "rgba(48, 22, 38, .42)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 8;
      ctx.beginPath();
      ctx.arc(disc.x, disc.y, disc.r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        disc.x - disc.r * 0.35,
        disc.y - disc.r * 0.45,
        2,
        disc.x,
        disc.y,
        disc.r
      );
      const colors = {
        cream: ["#fff6ce", "#d4aa65"],
        navy: ["#53628d", "#171d3c"],
        queen: ["#ff7970", "#b61f42"],
        striker: ["#bdf7ec", "#36a7a0"],
      } as const;
      grad.addColorStop(0, colors[disc.kind][0]);
      grad.addColorStop(1, colors[disc.kind][1]);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = disc.kind === "striker" ? "#fff" : "rgba(255,255,255,.55)";
      ctx.lineWidth = disc.kind === "striker" ? 5 : 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(disc.x - 6, disc.y - 7, disc.r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.42)";
      ctx.fill();
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
      ctx.setLineDash([14, 11]);
      ctx.strokeStyle = "rgba(43, 33, 70, .72)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(striker.x + nx * 34, striker.y + ny * 34);
      ctx.lineTo(striker.x + nx * (75 + len * 1.2), striker.y + ny * (75 + len * 1.2));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(striker.x, striker.y, 31 + len * 0.03, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,.8)";
      ctx.lineWidth = 4;
      ctx.stroke();
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
        const points = disc.kind === "queen" ? 3 : 1;
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

        if (POCKETS.some(([x, y]) => Math.hypot(disc.x - x, disc.y - y) < 31)) {
          pocket(disc);
          continue;
        }
        if (disc.x - disc.r < WALL_MIN || disc.x + disc.r > WALL_MAX) {
          disc.x = Math.max(WALL_MIN + disc.r, Math.min(WALL_MAX - disc.r, disc.x));
          disc.vx *= -0.86;
          ping(165);
        }
        if (disc.y - disc.r < WALL_MIN || disc.y + disc.r > WALL_MAX) {
          disc.y = Math.max(WALL_MIN + disc.r, Math.min(WALL_MAX - disc.r, disc.y));
          disc.vy *= -0.86;
          ping(165);
        }
      }

      const active = discs.filter((d) => d.active);
      for (let i = 0; i < active.length; i += 1) {
        for (let j = i + 1; j < active.length; j += 1) {
          const a = active[i];
          const b = active[j];
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
          if (relative < 0) {
            a.vx += relative * nx;
            a.vy += relative * ny;
            b.vx -= relative * nx;
            b.vy -= relative * ny;
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
      const moving = update();
      drawBoard();
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

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SIZE,
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "player") return;
    const point = pointFromEvent(event);
    const striker = discsRef.current.find((d) => d.kind === "striker" && d.active);
    if (!striker || Math.hypot(point.x - striker.x, point.y - striker.y) > 65) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = { x: striker.x, y: striker.y };
    pointerRef.current = point;
    setMessage("Pull back for power — release to strike!");
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    pointerRef.current = pointFromEvent(event);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = draggingRef.current;
    if (!start || phaseRef.current !== "player") return;
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
      <div className="confetti confetti-one" aria-hidden="true" />
      <div className="confetti confetti-two" aria-hidden="true" />
      <header className="game-header">
        <a className="brand" href="#game" aria-label="Carrom Pop home">
          <span className="brand-mark">C</span>
          <span>CARROM POP!</span>
        </a>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setSoundOn((v) => !v)} aria-label={soundOn ? "Mute sound" : "Turn sound on"}>
            {soundOn ? "♪" : "×"}
          </button>
          <button className="reset-button" onClick={resetGame}>↻&nbsp; New game</button>
        </div>
      </header>

      <section id="game" className="game-layout" aria-label="Carrom game">
        <aside className="side-panel you-panel">
          <div className="avatar avatar-you" aria-hidden="true">😎</div>
          <p className="eyebrow">PLAYER 1</p>
          <h2>You</h2>
          <div className="score-bubble"><strong>{playerScore}</strong><span>points</span></div>
          <span className={`turn-pill ${turn === "you" ? "active" : ""}`}>Your turn</span>
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
              onPointerCancel={() => { draggingRef.current = null; pointerRef.current = null; }}
              aria-label="Playable carrom board. Drag back from the green striker and release to shoot."
            />
          </div>
          <div className="coach-card" aria-live="polite">
            <span className="coach-icon">☝</span>
            <div><strong>{message}</strong><span>Pull back from the green striker, aim, then release.</span></div>
            <div className="power-legend"><i /><i /><i /><i /><i /></div>
          </div>
        </div>

        <aside className="side-panel milo-panel">
          <div className="avatar avatar-milo" aria-hidden="true">🦊</div>
          <p className="eyebrow">RIVAL</p>
          <h2>Milo</h2>
          <div className="score-bubble"><strong>{aiScore}</strong><span>points</span></div>
          <span className={`turn-pill ${turn === "milo" ? "active" : ""}`}>Milo’s turn</span>
        </aside>
      </section>

      <footer>
        <span>Queen = 3 points</span><b>•</b><span>Every other coin = 1 point</span><b>•</b><span>Most points wins!</span>
      </footer>
    </main>
  );
}
