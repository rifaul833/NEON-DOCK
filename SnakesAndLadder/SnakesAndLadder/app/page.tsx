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
  99: 41,
};

const snakes = [
  { from: 27, to: 5, color: "pink" },
  { from: 40, to: 3, color: "purple" },
  { from: 43, to: 18, color: "orange" },
  { from: 54, to: 31, color: "pink" },
  { from: 66, to: 45, color: "purple" },
  { from: 76, to: 58, color: "orange" },
  { from: 89, to: 53, color: "pink" },
  { from: 99, to: 41, color: "purple" },
];

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

function Connector({ from, to, type, color = "" }: { from: number; to: number; type: "snake" | "ladder"; color?: string }) {
  const a = pointFor(from);
  const b = pointFor(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <div
      className={`${type} ${color}`}
      style={{ left: `${a.x.toFixed(1)}%`, top: `${a.y.toFixed(1)}%`, width: `${length.toFixed(3)}%`, transform: `rotate(${angle.toFixed(3)}deg)` }}
      aria-hidden="true"
    >
      {type === "snake" ? (
        <>
          <span className="snake-tail" />
          {Array.from({ length: 11 }, (_, i) => <i className="snake-segment" key={i} style={{ left: `${i * 8.3}%` }} />)}
          <span className="snake-head"><b className="eye left"><em /></b><b className="eye right"><em /></b><strong className="smile" /><u className="tongue" /></span>
        </>
      ) : (
        <><span className="ladder-rail top" /><span className="ladder-rail bottom" />{Array.from({ length: 8 }, (_, i) => <i className="ladder-rung" key={i} style={{ left: `${8 + i * 12}%` }} />)}</>
      )}
    </div>
  );
}

function Dice({ value, rolling }: { value: number; rolling: boolean }) {
  const dots: Record<number, number[]> = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
  };
  const face = (number: number, className: string) => (
    <div className={`dice-face ${className}`}>
      {Array.from({ length: 9 }, (_, i) => <span key={i} className={dots[number].includes(i) ? "dot" : ""} />)}
    </div>
  );
  const right = value % 6 + 1;
  const top = (value + 2) % 6 + 1;
  return (
    <div className={`dice-wrap ${rolling ? "rolling" : ""}`} aria-label={`Dice shows ${value}`}>
      <div className="dice">
        {face(value, "face-front")}
        {face(7 - value, "face-back")}
        {face(right, "face-right")}
        {face(7 - right, "face-left")}
        {face(top, "face-top")}
        {face(7 - top, "face-bottom")}
      </div>
    </div>
  );
}

function playDiceSound() {
  const AudioEngine = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audio = new AudioEngine();
  const now = audio.currentTime;
  const noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.58), audio.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) {
    const fade = 1 - i / samples.length;
    samples[i] = (Math.random() * 2 - 1) * fade * (0.5 + Math.sin(i * 0.09) * 0.5);
  }
  const tumble = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const tumbleGain = audio.createGain();
  tumble.buffer = noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(780, now);
  filter.frequency.exponentialRampToValueAtTime(260, now + 0.58);
  filter.Q.value = 1.2;
  tumbleGain.gain.setValueAtTime(0.11, now);
  tumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
  tumble.connect(filter).connect(tumbleGain).connect(audio.destination);
  tumble.start(now);

  [0.04, 0.14, 0.25, 0.37, 0.52].forEach((offset, index) => {
    const knock = audio.createOscillator();
    const knockGain = audio.createGain();
    knock.type = "triangle";
    knock.frequency.setValueAtTime(190 - index * 18, now + offset);
    knock.frequency.exponentialRampToValueAtTime(75, now + offset + 0.07);
    knockGain.gain.setValueAtTime(0.0001, now + offset);
    knockGain.gain.exponentialRampToValueAtTime(index === 4 ? 0.2 : 0.11, now + offset + 0.006);
    knockGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.085);
    knock.connect(knockGain).connect(audio.destination);
    knock.start(now + offset);
    knock.stop(now + offset + 0.09);
  });
  window.setTimeout(() => void audio.close(), 850);
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
    const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 659.25, 783.99, 987.77, 783.99, 587.33, 659.25, 783.99, 523.25];
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
    let ticks = 0;
    const spin = window.setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      ticks += 1;
      if (ticks < 7) return;
      window.clearInterval(spin);
      const value = Math.floor(Math.random() * 6) + 1;
      setDice(value);
      setRolling(false);
      setMoving(true);
      setPositions(current => {
        const next = [...current];
        const attempted = next[turn] + value;
        if (attempted > 100) {
          setMessage(`Too far! Player ${turn + 1} stays put.`);
          window.setTimeout(() => {
            setTurn(t => 1 - t);
            setMessage(`Player ${2 - turn}, your turn!`);
            setMoving(false);
          }, 750);
          return next;
        }
        const landed = jumps[attempted] ?? attempted;
        next[turn] = attempted;
        if (attempted === 100) {
          setWinner(turn);
          setMoving(false);
          setMessage(`Player ${turn + 1} wins the crown!`);
        } else if (landed !== attempted) {
          const isLadder = landed > attempted;
          setPawnMotion({ player: turn, type: isLadder ? "climbing" : "bitten" });
          setBoardEvent({
            type: isLadder ? "ladder" : "snake",
            text: isLadder ? `Player ${turn + 1} found a ladder!` : `Snake bite! Player ${turn + 1} slides down!`,
          });
          setMessage(isLadder ? `🪜 Ladder! Climbing from ${attempted} to ${landed}…` : `🐍 Snake bite at ${attempted}! Sliding to ${landed}…`);
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
        } else {
          setMessage(`Player ${turn + 1} moved ${value} spaces.`);
          window.setTimeout(() => {
            setTurn(t => 1 - t);
            setMessage(`Player ${2 - turn}, your turn!`);
            setMoving(false);
          }, 850);
        }
        return next;
      });
    }, 90);
  }, [moving, rolling, turn, winner]);

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
              {ladders.map(([a, b]) => <Connector key={`${a}-${b}`} from={a} to={b} type="ladder" />)}
              {snakes.map(s => <Connector key={s.from} from={s.from} to={s.to} type="snake" color={s.color} />)}
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
