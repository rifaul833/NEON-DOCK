"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const jumps: Record<number, number> = {
  4: 25,
  13: 46,
  33: 49,
  42: 63,
  50: 69,
  62: 81,
  74: 92,
  27: 5,
  40: 3,
  43: 18,
  54: 31,
  66: 45,
  76: 58,
  89: 53,
  99: 8,
};

const snakes = [
  { from: 27, to: 5, color: "pink" },
  { from: 40, to: 3, color: "purple" },
  { from: 43, to: 18, color: "orange" },
  { from: 54, to: 31, color: "pink" },
  { from: 66, to: 45, color: "purple" },
  { from: 76, to: 58, color: "orange" },
  { from: 89, to: 53, color: "pink" },
  { from: 99, to: 8, color: "green" },
];

const SNAKE_SKIN: Record<string, { dorsal: string; mid: string; belly: string; blotch: string; edge: string }> = {
  pink: { dorsal: "#6b2a24", mid: "#a34a38", belly: "#e8c9a4", blotch: "#3d1612", edge: "#2a100c" },
  purple: { dorsal: "#3d4a28", mid: "#6a7a40", belly: "#d7d0a8", blotch: "#232a14", edge: "#16190c" },
  orange: { dorsal: "#8a5a28", mid: "#c4893c", belly: "#ead4a4", blotch: "#5a3514", edge: "#2e1a0a" },
  green: { dorsal: "#245c32", mid: "#3e8a48", belly: "#d4e0b0", blotch: "#14321c", edge: "#0c1c10" },
};

const ladders = [
  [4, 25], [13, 46], [33, 49], [42, 63], [50, 69], [62, 81], [74, 92],
];

function cellNumber(row: number, col: number) {
  const fromBottom = 9 - row;
  return fromBottom % 2 === 0
    ? fromBottom * 10 + col + 1
    : fromBottom * 10 + (10 - col);
}

function pointFor(position: number) {
  const index = position - 1;
  const rowFromBottom = Math.floor(index / 10);
  const inRow = index % 10;
  const col = rowFromBottom % 2 === 0 ? inRow : 9 - inRow;
  return { x: (col + 0.5) * 10, y: (9 - rowFromBottom + 0.5) * 10 };
}

function Connector({ from, to }: { from: number; to: number }) {
  const a = pointFor(from);
  const b = pointFor(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <div
      className="ladder"
      style={{ left: `${a.x.toFixed(1)}%`, top: `${a.y.toFixed(1)}%`, width: `${length.toFixed(3)}%`, transform: `rotate(${angle.toFixed(3)}deg)` }}
      aria-hidden="true"
    >
      <span className="ladder-rail top" /><span className="ladder-rail bottom" />
      {Array.from({ length: 8 }, (_, i) => <i className="ladder-rung" key={i} style={{ left: `${8 + i * 12}%` }} />)}
    </div>
  );
}

function snakeMesh(from: number, to: number) {
  const a = pointFor(from);
  const b = pointFor(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const waves = from === 99 ? 2.15 : Math.max(1.15, len / 42);
  const amp = from === 99 ? 2.6 : Math.min(2.4, 0.9 + len * 0.028);
  const steps = Math.max(28, Math.round(len * 2.2));
  const center: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const fade = Math.sin(t * Math.PI);
    const wave = Math.sin(t * waves * Math.PI * 2 + 0.4) * amp * fade;
    center.push([a.x + dx * t + px * wave, a.y + dy * t + py * wave]);
  }
  const headW = from === 99 ? 1.55 : 1.15;
  const tailW = 0.18;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  const bellyL: [number, number][] = [];
  const bellyR: [number, number][] = [];
  const marks: { x: number; y: number; nx: number; ny: number; w: number; t: number }[] = [];
  for (let i = 0; i < center.length; i += 1) {
    const p0 = center[Math.max(0, i - 1)];
    const p1 = center[Math.min(center.length - 1, i + 1)];
    const tx = p1[0] - p0[0];
    const ty = p1[1] - p0[1];
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    const t = i / (center.length - 1);
    const w = t < 0.06 ? headW * (0.82 + t * 3) : headW + (tailW - headW) * ((t - 0.06) / 0.94) ** 1.25;
    left.push([center[i][0] + nx * w, center[i][1] + ny * w]);
    right.push([center[i][0] - nx * w, center[i][1] - ny * w]);
    bellyL.push([center[i][0] + nx * w * 0.18, center[i][1] + ny * w * 0.18]);
    bellyR.push([center[i][0] - nx * w * 0.72, center[i][1] - ny * w * 0.72]);
    if (i % 3 === 0 && t > 0.08 && t < 0.92) marks.push({ x: center[i][0], y: center[i][1], nx, ny, w, t });
  }
  const poly = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  const body = `${poly(left)} ${[...right].reverse().map(p => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ")} Z`;
  const belly = `${poly(bellyL)} ${[...bellyR].reverse().map(p => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ")} Z`;
  const headAng = Math.atan2(center[1][1] - center[0][1], center[1][0] - center[0][0]) * (180 / Math.PI);
  const last = center[center.length - 1];
  const prev = center[center.length - 2];
  const tailAng = Math.atan2(last[1] - prev[1], last[0] - prev[0]) * (180 / Math.PI);
  return { body, belly, marks, head: center[0], last, headAng, tailAng, headW };
}

function SnakeGraphic({ from, to, color }: { from: number; to: number; color: string }) {
  const skin = SNAKE_SKIN[color] || SNAKE_SKIN.green;
  const { body, belly, marks, head, last, headAng, tailAng, headW } = snakeMesh(from, to);
  const id = `sn${from}`;
  const s = from === 99 ? 1.18 : 1;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skin.dorsal} />
          <stop offset="45%" stopColor={skin.mid} />
          <stop offset="100%" stopColor={skin.dorsal} />
        </linearGradient>
        <radialGradient id={`${id}-h`} cx="38%" cy="40%" r="70%">
          <stop offset="0%" stopColor={skin.mid} />
          <stop offset="70%" stopColor={skin.dorsal} />
          <stop offset="100%" stopColor={skin.edge} />
        </radialGradient>
        <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.35" dy="0.55" stdDeviation="0.35" floodColor="#1a120c" floodOpacity="0.35" />
        </filter>
      </defs>
      <path d={body} fill={`url(#${id}-g)`} stroke={skin.edge} strokeWidth={0.18} filter={`url(#${id}-s)`} />
      <path d={belly} fill={skin.belly} opacity={0.92} />
      {marks.map((m, i) => {
        const hw = m.w * 0.72;
        const hl = m.w * (i % 2 ? 1.15 : 1.45);
        const qx = -m.ny;
        const qy = m.nx;
        const d = `M ${(m.x + qx * hl).toFixed(2)} ${(m.y + qy * hl).toFixed(2)} L ${(m.x + m.nx * hw).toFixed(2)} ${(m.y + m.ny * hw).toFixed(2)} L ${(m.x - qx * hl * 0.7).toFixed(2)} ${(m.y - qy * hl * 0.7).toFixed(2)} L ${(m.x - m.nx * hw * 0.35).toFixed(2)} ${(m.y - m.ny * hw * 0.35).toFixed(2)} Z`;
        return <path key={i} d={d} fill={skin.blotch} opacity={0.72} />;
      })}
      <g transform={`translate(${last[0].toFixed(2)} ${last[1].toFixed(2)}) rotate(${tailAng.toFixed(2)})`}>
        <polygon points="0,-0.22 2.1,0 0,0.22" fill={skin.dorsal} />
      </g>
      <g transform={`translate(${head[0].toFixed(2)} ${head[1].toFixed(2)}) rotate(${headAng.toFixed(2)}) scale(${s})`}>
        <path d={`M ${headW * 0.2} ${-headW * 0.92} C ${-headW * 0.4} ${-headW * 1.15} ${-headW * 1.55} ${-headW * 0.55} ${-headW * 2.05} ${-headW * 0.12} C ${-headW * 2.22} 0 ${-headW * 2.22} 0 ${-headW * 2.05} ${headW * 0.12} C ${-headW * 1.55} ${headW * 0.55} ${-headW * 0.4} ${headW * 1.15} ${headW * 0.2} ${headW * 0.92} C ${headW * 0.95} ${headW * 0.38} ${headW * 0.95} ${-headW * 0.38} ${headW * 0.2} ${-headW * 0.92} Z`} fill={`url(#${id}-h)`} stroke={skin.edge} strokeWidth={0.16} />
        <path d={`M ${-headW * 0.15} 0 L ${-headW * 1.85} ${-headW * 0.08} L ${-headW * 1.85} ${headW * 0.08} Z`} fill={skin.belly} opacity={0.7} />
        <ellipse cx={-headW * 0.55} cy={-headW * 0.42} rx={headW * 0.22} ry={headW * 0.16} fill="#1c1610" />
        <ellipse cx={-headW * 0.55} cy={headW * 0.42} rx={headW * 0.22} ry={headW * 0.16} fill="#1c1610" />
        <ellipse cx={-headW * 0.5} cy={-headW * 0.4} rx={headW * 0.09} ry={headW * 0.08} fill="#c9a24a" />
        <ellipse cx={-headW * 0.5} cy={headW * 0.4} rx={headW * 0.09} ry={headW * 0.08} fill="#c9a24a" />
        <circle cx={-headW * 0.47} cy={-headW * 0.38} r={headW * 0.04} fill="#f3efe6" />
        <circle cx={-headW * 0.47} cy={headW * 0.38} r={headW * 0.04} fill="#f3efe6" />
        <ellipse cx={-headW * 1.92} cy={-headW * 0.07} rx={0.08} ry={0.05} fill="#1c1610" />
        <ellipse cx={-headW * 1.92} cy={headW * 0.07} rx={0.08} ry={0.05} fill="#1c1610" />
      </g>
    </g>
  );
}

function Dice({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className="die-scene" aria-label={`Dice shows ${value}`}>
      <div className={`die d${value || 1} ${rolling ? "rolling" : ""}`}>
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <div key={face} className={`die-face f${face}`}>
            {Array.from({ length: 9 }, (_, i) => <i key={i} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function playHopSound() {
  const AudioEngine = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audio = new AudioEngine();
  const now = audio.currentTime;
  const knock = audio.createOscillator();
  const gain = audio.createGain();
  knock.type = "triangle";
  knock.frequency.setValueAtTime(520, now);
  knock.frequency.exponentialRampToValueAtTime(180, now + 0.09);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  knock.connect(gain).connect(audio.destination);
  knock.start(now);
  knock.stop(now + 0.11);
  window.setTimeout(() => void audio.close(), 180);
}

function playDiceSound() {
  const clip = new Audio("/dice-roll.mp3");
  clip.currentTime = 0;
  void clip.play();
}

export default function Home() {
  const [players, setPlayers] = useState(2);
  const [positions, setPositions] = useState([1, 1]);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [message, setMessage] = useState("Player 1, roll the dice!");
  const [musicOn, setMusicOn] = useState(false);
  const [moving, setMoving] = useState(false);
  const [pawnMotion, setPawnMotion] = useState<{ player: number; type: "climbing" | "bitten" } | null>(null);
  const [boardEvent, setBoardEvent] = useState<{ type: "ladder" | "snake"; text: string } | null>(null);

  const board = useMemo(() => Array.from({ length: 100 }, (_, i) => {
    const row = Math.floor(i / 10);
    const col = i % 10;
    return cellNumber(row, col);
  }), []);

  useEffect(() => {
    if (!musicOn) return;
    const AudioEngine = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audio = new AudioEngine();
    const melody = [392, 493.88, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, 587.33, 493.88];
    let step = 0;
    const playNote = () => {
      if (audio.state === "suspended") void audio.resume();
      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = step % 4 === 3 ? "triangle" : "sine";
      oscillator.frequency.value = melody[step % melody.length];
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.25);
      step += 1;
    };
    playNote();
    const loop = window.setInterval(playNote, 290);
    return () => { window.clearInterval(loop); void audio.close(); };
  }, [musicOn]);

  const reset = useCallback((count = players) => {
    setPlayers(count);
    setPositions([1, 1]);
    setTurn(0);
    setDice(1);
    setWinner(null);
    setRolling(false);
    setMoving(false);
    setPawnMotion(null);
    setBoardEvent(null);
    setMessage("Player 1, roll the dice!");
  }, [players]);

  const roll = useCallback(() => {
    if (rolling || moving || winner !== null) return;
    playDiceSound();
    setRolling(true);
    setMessage("Wheee… rolling!");
    window.setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setDice(value);
      setRolling(false);
      setMoving(true);
      const start = positions[turn];
      const attempted = start + value;
      if (attempted > 100) {
        setMessage(`Too far! Player ${turn + 1} stays put.`);
        window.setTimeout(() => {
          setTurn(t => 1 - t);
          setMessage(`Player ${2 - turn}, your turn!`);
          setMoving(false);
        }, 750);
        return;
      }
      let step = 0;
      const finishMove = (square: number) => {
        const landed = jumps[square] ?? square;
        if (square === 100) {
          setWinner(turn);
          setMoving(false);
          setMessage(`Player ${turn + 1} wins the crown!`);
          return;
        }
        if (landed !== square) {
          const isLadder = landed > square;
          setPawnMotion({ player: turn, type: isLadder ? "climbing" : "bitten" });
          setBoardEvent({
            type: isLadder ? "ladder" : "snake",
            text: isLadder ? `Player ${turn + 1} found a ladder!` : `Snake bite! Player ${turn + 1} slides down!`,
          });
          setMessage(isLadder ? `🪜 Ladder! Climbing from ${square} to ${landed}…` : `🐍 Snake bite at ${square}! Sliding to ${landed}…`);
          window.setTimeout(() => {
            setPositions(latest => {
              const moved = [...latest];
              moved[turn] = landed;
              return moved;
            });
          }, 600);
          window.setTimeout(() => {
            setPawnMotion(null);
            setBoardEvent(null);
            setTurn(t => 1 - t);
            setMessage(`Player ${2 - turn}, your turn!`);
            setMoving(false);
          }, 1900);
          return;
        }
        setMessage(`Player ${turn + 1} moved ${value} spaces.`);
        window.setTimeout(() => {
          setTurn(t => 1 - t);
          setMessage(`Player ${2 - turn}, your turn!`);
          setMoving(false);
        }, 400);
      };
      const advance = () => {
        step += 1;
        playHopSound();
        setPositions(latest => {
          const moved = [...latest];
          moved[turn] = start + step;
          return moved;
        });
        if (step < value) window.setTimeout(advance, 240);
        else finishMove(start + value);
      };
      window.setTimeout(advance, 80);
    }, 960);
  }, [moving, positions, rolling, turn, winner]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code === "Space") { event.preventDefault(); roll(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [roll]);

  return (
    <main>
      <div className="sky-decor cloud one" /><div className="sky-decor cloud two" />
      <header className="topbar">
        <a className="brand" href="#game" aria-label="Snake and Ladder home"><span className="brand-snake">S</span><strong>Snake &amp; Ladder</strong></a>
        <nav aria-label="Game menu"><button className={musicOn ? "music-active" : ""} onClick={() => setMusicOn(on => !on)} aria-pressed={musicOn}>{musicOn ? "♫ Music On" : "♪ Music Off"}</button><button onClick={() => reset()}>↻ New Game</button><button onClick={() => document.getElementById("rules")?.showModal()}>? How to Play</button></nav>
      </header>

      <section className="hero" id="game">
        <div className="intro">
          <p className="eyebrow">THE CLASSIC CLIMB</p>
          <h1>Race to the<br /><span>top!</span></h1>
          <p className="subtitle">Climb ladders, dodge sneaky snakes, and be first to reach the golden crown.</p>
          <div className="player-switch" aria-label="Number of players">
            <button className={players === 2 ? "active" : ""} onClick={() => reset(2)}>2 Players</button>
            <span>Pass &amp; play</span>
          </div>
          <div className="status-card">
            <div className={`player-badge red ${turn === 0 ? "current" : ""}`}><span className="pawn-mini" />Player 1<small>Square {positions[0]}</small></div>
            <div className="versus">VS</div>
            <div className={`player-badge blue ${turn === 1 ? "current" : ""}`}><span className="pawn-mini" />Player 2<small>Square {positions[1]}</small></div>
          </div>
          <div className="roll-zone">
            <Dice value={dice} rolling={rolling} />
            <div><button className="roll-button" onClick={roll} disabled={rolling || moving || winner !== null}>{rolling ? "Rolling…" : moving ? "Moving…" : "Roll Dice"}</button><p>or press spacebar</p></div>
          </div>
          <p className="game-message" aria-live="polite">{message}</p>
        </div>

        <div className="board-scene">
          <div className="crown" aria-hidden="true">♛</div>
          <div className="board-shadow" />
          <div className="board-shell">
            <div className="board-grid">
              {board.map((n, i) => <div key={n} className={`cell c${(Math.floor(i / 10) + i) % 4}`}><span>{n}</span>{n === 100 && <b>★</b>}</div>)}
            </div>
            <div className="connectors">
              {ladders.map(([a, b]) => <Connector key={`${a}-${b}`} from={a} to={b} />)}
              <svg className="snakes-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {snakes.map(s => <SnakeGraphic key={s.from} from={s.from} to={s.to} color={s.color} />)}
              </svg>
              {positions.map((p, i) => {
                const point = pointFor(p);
                const motion = pawnMotion?.player === i ? pawnMotion.type : "";
                return <div key={i} className={`pawn p${i + 1} ${motion}`} style={{ left: `${point.x + (i === 0 ? -1.7 : 1.7)}%`, top: `${point.y}%` }}><span /></div>;
              })}
            </div>
          </div>
          {boardEvent && <div className={`board-event ${boardEvent.type}`} aria-live="assertive"><span>{boardEvent.type === "ladder" ? "🪜" : "🐍"}</span><strong>{boardEvent.text}</strong></div>}
          <div className="island left" /><div className="island right" />
        </div>
      </section>

      {winner !== null && <div className="win-card" role="dialog" aria-modal="true"><div>🎉</div><h2>Player {winner + 1} wins!</h2><p>You reached the golden crown.</p><button onClick={() => reset()}>Play Again</button></div>}

      <dialog id="rules" className="rules"><button className="close" onClick={() => document.getElementById("rules")?.close()} aria-label="Close">×</button><h2>How to play</h2><ol><li>Take turns rolling the dice.</li><li>Land on a ladder to climb up.</li><li>Land on a snake to slide down.</li><li>You need an exact roll to reach square 100.</li></ol><button onClick={() => document.getElementById("rules")?.close()}>Let’s play!</button></dialog>
    </main>
  );
}
