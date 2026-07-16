"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SIZE = 8;
const TYPES = ["berry", "lemon", "mint", "grape", "orange", "blue"] as const;
type CandyType = (typeof TYPES)[number];
type Candy = { id: string; type: CandyType };
type Position = { row: number; col: number };
type Goals = Record<"berry" | "lemon" | "mint", number>;
type SoundEffect = "tap" | "swap" | "match" | "error" | "hammer" | "shuffle" | "start" | "win" | "lose";

const TARGET = 3000;
const START_MOVES = 18;
const GOAL_TARGETS: Goals = { berry: 12, lemon: 10, mint: 10 };
const LABELS: Record<CandyType, string> = {
  berry: "Berry swirl",
  lemon: "Lemon drop",
  mint: "Mint jelly",
  grape: "Grape gum",
  orange: "Orange lozenge",
  blue: "Blue moon candy",
};

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeBoard(seed = 42): Candy[][] {
  const random = seeded(seed);
  const board: Candy[][] = [];
  for (let row = 0; row < SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < SIZE; col++) {
      const blocked = new Set<CandyType>();
      if (col > 1 && board[row][col - 1].type === board[row][col - 2].type) blocked.add(board[row][col - 1].type);
      if (row > 1 && board[row - 1][col].type === board[row - 2][col].type) blocked.add(board[row - 1][col].type);
      const choices = TYPES.filter((type) => !blocked.has(type));
      const type = choices[Math.floor(random() * choices.length)];
      board[row][col] = { id: `${seed}-${row}-${col}`, type };
    }
  }
  return board;
}

function copyBoard(board: Candy[][]) {
  return board.map((row) => row.map((candy) => ({ ...candy })));
}

function swap(board: Candy[][], first: Position, second: Position) {
  const next = copyBoard(board);
  [next[first.row][first.col], next[second.row][second.col]] = [
    next[second.row][second.col],
    next[first.row][first.col],
  ];
  return next;
}

function matchesFor(board: Candy[][]) {
  const found = new Set<string>();
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE - 2; col++) {
      const type = board[row][col].type;
      if (board[row][col + 1].type === type && board[row][col + 2].type === type) {
        let end = col + 2;
        while (end + 1 < SIZE && board[row][end + 1].type === type) end++;
        for (let x = col; x <= end; x++) found.add(`${row}-${x}`);
        col = end - 1;
      }
    }
  }
  for (let col = 0; col < SIZE; col++) {
    for (let row = 0; row < SIZE - 2; row++) {
      const type = board[row][col].type;
      if (board[row + 1][col].type === type && board[row + 2][col].type === type) {
        let end = row + 2;
        while (end + 1 < SIZE && board[end + 1][col].type === type) end++;
        for (let y = row; y <= end; y++) found.add(`${y}-${col}`);
        row = end - 1;
      }
    }
  }
  return found;
}

export default function Home() {
  const [board, setBoard] = useState(() => makeBoard(42));
  const [selected, setSelected] = useState<Position | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(START_MOVES);
  const [goals, setGoals] = useState<Goals>({ berry: 0, lemon: 0, mint: 0 });
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState<Set<string>>(new Set());
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState("Make a match of 3!");
  const [soundOn, setSoundOn] = useState(true);
  const [hammer, setHammer] = useState(2);
  const [shuffleCount, setShuffleCount] = useState(2);
  const [hammerMode, setHammerMode] = useState(false);
  const [seed, setSeed] = useState(42);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const idRef = useRef(1);
  const audioRef = useRef<AudioContext | null>(null);
  const musicStepRef = useRef(0);
  const boardRef = useRef(board);
  boardRef.current = board;

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioRef.current) audioRef.current = new AudioContextClass();
    return audioRef.current;
  }, []);

  const voice = useCallback((context: AudioContext, frequency: number, start: number, duration: number, volume: number, type: OscillatorType = "sine") => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }, []);

  const playSound = useCallback((effect: SoundEffect, power = 1) => {
    if (!soundOn) return;
    const context = ensureAudio();
    if (!context) return;
    void context.resume();
    const now = context.currentTime + 0.01;
    const notes: Record<SoundEffect, number[]> = {
      tap: [720],
      swap: [330, 440],
      match: [523, 659, 784, Math.min(1175, 880 + power * 35)],
      error: [220, 165],
      hammer: [180, 620],
      shuffle: [392, 523, 659],
      start: [392, 523, 659, 784],
      win: [523, 659, 784, 1047],
      lose: [392, 330, 262],
    };
    const spacing = effect === "tap" ? 0 : effect === "match" || effect === "win" ? 0.065 : 0.08;
    notes[effect].forEach((note, index) => {
      const isLowHit = effect === "hammer" && index === 0;
      voice(context, note, now + index * spacing, isLowHit ? 0.15 : 0.1, effect === "error" || effect === "lose" ? 0.04 : 0.055, isLowHit ? "square" : "sine");
    });
  }, [ensureAudio, soundOn, voice]);

  useEffect(() => {
    if (!soundOn) {
      if (audioRef.current?.state === "running") void audioRef.current.suspend();
      return;
    }
    const context = ensureAudio();
    if (!context) return;
    const melody = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 880, 784, 494, 587, 698, 587];
    const playMusicStep = () => {
      if (context.state !== "running") return;
      const step = musicStepRef.current++ % melody.length;
      const now = context.currentTime + 0.01;
      voice(context, melody[step], now, 0.24, 0.012, "triangle");
      if (step % 4 === 0) voice(context, melody[step] / 2, now, 0.52, 0.009, "sine");
    };
    playMusicStep();
    const musicTimer = window.setInterval(playMusicStep, 300);
    return () => window.clearInterval(musicTimer);
  }, [ensureAudio, soundOn, voice]);

  useEffect(() => () => {
    if (audioRef.current) void audioRef.current.close();
  }, []);

  const settleBoard = useCallback(async (startingBoard: Candy[][], chain = 1) => {
    const found = matchesFor(startingBoard);
    if (!found.size) {
      setBusy(false);
      setCombo(0);
      setMessage("Sweet! Keep matching.");
      return;
    }

    setBurst(found);
    setCombo(chain);
    setMessage(chain > 1 ? `Sugar rush ×${chain}!` : "Candy blast!");
    playSound("match", chain);
    await new Promise((resolve) => setTimeout(resolve, 280));

    const removed: Partial<Record<CandyType, number>> = {};
    found.forEach((key) => {
      const [row, col] = key.split("-").map(Number);
      const type = startingBoard[row][col].type;
      removed[type] = (removed[type] ?? 0) + 1;
    });
    const gain = found.size * 70 * chain;
    setScore((value) => value + gain);
    setGoals((current) => ({
      berry: Math.min(GOAL_TARGETS.berry, current.berry + (removed.berry ?? 0)),
      lemon: Math.min(GOAL_TARGETS.lemon, current.lemon + (removed.lemon ?? 0)),
      mint: Math.min(GOAL_TARGETS.mint, current.mint + (removed.mint ?? 0)),
    }));

    const next = copyBoard(startingBoard);
    for (let col = 0; col < SIZE; col++) {
      const survivors: Candy[] = [];
      for (let row = SIZE - 1; row >= 0; row--) {
        if (!found.has(`${row}-${col}`)) survivors.push(next[row][col]);
      }
      while (survivors.length < SIZE) {
        const type = TYPES[Math.floor(Math.random() * TYPES.length)];
        survivors.push({ id: `drop-${idRef.current++}`, type });
      }
      for (let row = SIZE - 1, index = 0; row >= 0; row--, index++) next[row][col] = survivors[index];
    }
    setBurst(new Set());
    setBoard(next);
    boardRef.current = next;
    await new Promise((resolve) => setTimeout(resolve, 220));
    await settleBoard(next, chain + 1);
  }, [playSound]);

  const attemptSwap = useCallback(async (first: Position, second: Position) => {
    if (busy || gameState !== "playing") return;
    const distance = Math.abs(first.row - second.row) + Math.abs(first.col - second.col);
    if (distance !== 1) {
      setSelected(second);
      setMessage("Pick a candy right next to it.");
      return;
    }
    setBusy(true);
    setSelected(null);
    const previous = boardRef.current;
    const next = swap(previous, first, second);
    setBoard(next);
    playSound("swap");
    await new Promise((resolve) => setTimeout(resolve, 190));
    if (!matchesFor(next).size) {
      setBoard(previous);
      boardRef.current = previous;
      setMessage("That swap needs a match.");
      playSound("error");
      await new Promise((resolve) => setTimeout(resolve, 180));
      setBusy(false);
      return;
    }
    setMoves((value) => Math.max(0, value - 1));
    boardRef.current = next;
    await settleBoard(next);
  }, [busy, gameState, playSound, settleBoard]);

  const chooseCandy = useCallback((position: Position) => {
    if (busy || gameState !== "playing") return;
    if (hammerMode && hammer > 0) {
      const next = copyBoard(boardRef.current);
      const old = next[position.row][position.col];
      let replacement = TYPES[Math.floor(Math.random() * TYPES.length)];
      while (replacement === old.type) replacement = TYPES[Math.floor(Math.random() * TYPES.length)];
      next[position.row][position.col] = { id: `hammer-${idRef.current++}`, type: replacement };
      setBurst(new Set([`${position.row}-${position.col}`]));
      setBoard(next);
      boardRef.current = next;
      setHammer((value) => value - 1);
      setHammerMode(false);
      setMessage("Bonk! Candy cleared.");
      playSound("hammer");
      window.setTimeout(() => setBurst(new Set()), 260);
      return;
    }
    if (!selected) {
      setSelected(position);
      setMessage("Now pick a neighbor.");
      playSound("tap");
    } else if (selected.row === position.row && selected.col === position.col) {
      setSelected(null);
      setMessage("Make a match of 3!");
      playSound("tap");
    } else {
      void attemptSwap(selected, position);
    }
  }, [attemptSwap, busy, gameState, hammer, hammerMode, playSound, selected]);

  const shuffleBoard = () => {
    if (busy || shuffleCount < 1 || gameState !== "playing") return;
    const nextSeed = seed + 97;
    const next = makeBoard(nextSeed);
    setSeed(nextSeed);
    setBoard(next);
    boardRef.current = next;
    setShuffleCount((value) => value - 1);
    setSelected(null);
    setMessage("Fresh candy mix!");
    playSound("shuffle");
  };

  const startNewGame = () => {
    const nextSeed = seed + 101;
    const next = makeBoard(nextSeed);
    setSeed(nextSeed);
    setBoard(next);
    boardRef.current = next;
    setSelected(null);
    setScore(0);
    setMoves(START_MOVES);
    setGoals({ berry: 0, lemon: 0, mint: 0 });
    setBusy(false);
    setBurst(new Set());
    setCombo(0);
    setMessage("Make a match of 3!");
    setHammer(2);
    setShuffleCount(2);
    setHammerMode(false);
    setGameState("playing");
    playSound("start");
  };

  useEffect(() => {
    const goalsDone = (Object.keys(GOAL_TARGETS) as (keyof Goals)[]).every((key) => goals[key] >= GOAL_TARGETS[key]);
    if (score >= TARGET && goalsDone && gameState === "playing") setGameState("won");
    else if (moves === 0 && !busy && gameState === "playing") setGameState("lost");
  }, [busy, gameState, goals, moves, score]);

  useEffect(() => {
    if (gameState === "won") playSound("win");
    if (gameState === "lost") playSound("lose");
  }, [gameState, playSound]);

  const toggleSound = () => {
    if (!soundOn) {
      const context = ensureAudio();
      if (context) void context.resume();
    }
    setSoundOn((value) => !value);
  };

  const progress = Math.min(100, Math.round((score / TARGET) * 100));

  return (
    <main className="game-shell">
      <div className="sky-decor" aria-hidden="true">
        <span className="cloud cloud-one" /><span className="cloud cloud-two" />
        <span className="lollipop lollipop-one" /><span className="lollipop lollipop-two" />
      </div>

      <header className="game-header">
        <div className="brand-wrap">
          <div className="brand-spark" aria-hidden="true">✦</div>
          <h1><span>Candy</span>Blast!</h1>
          <p>Match • Pop • Smile</p>
        </div>
        <div className="header-actions">
          <div className="level-pill"><span>Level</span><strong>24</strong></div>
          <button className={`round-button sound-button ${soundOn ? "playing" : ""}`} onClick={toggleSound} aria-label={soundOn ? "Mute music and sounds" : "Turn music and sounds on"} aria-pressed={soundOn}>
            <span aria-hidden="true">{soundOn ? "♫" : "×"}</span>
          </button>
          <button className="round-button" onClick={startNewGame} aria-label="Start a new game">↻</button>
        </div>
      </header>

      <section className="game-layout" aria-label="CandyBlast game">
        <aside className="side-panel score-panel">
          <div className="panel-heading"><span className="mini-crown">♛</span><span>Your score</span></div>
          <strong className="big-score">{score.toLocaleString()}</strong>
          <div className="target-row"><span>Target</span><b>{TARGET.toLocaleString()}</b></div>
          <div className="progress-track" aria-label={`${progress}% of target score`}><span style={{ width: `${progress}%` }} /></div>
          <p className="status-message" aria-live="polite">{message}</p>

          <div className="goals-title"><span>Level goals</span><b>{Object.values(goals).reduce((a, b) => a + b, 0)}/{Object.values(GOAL_TARGETS).reduce((a, b) => a + b, 0)}</b></div>
          <div className="goal-list">
            {(Object.keys(GOAL_TARGETS) as (keyof Goals)[]).map((type) => (
              <div className="goal-row" key={type}>
                <span className={`goal-candy candy candy-${type}`} aria-hidden="true" />
                <span className="goal-name">{type === "berry" ? "Berry swirls" : type === "lemon" ? "Lemon drops" : "Mint jellies"}</span>
                <b>{goals[type]}/{GOAL_TARGETS[type]}</b>
              </div>
            ))}
          </div>
        </aside>

        <section className="board-column">
          <div className="board-topline">
            <div className="moves-bubble"><span>Moves</span><strong>{moves}</strong></div>
            <div className={`combo-badge ${combo > 1 ? "show" : ""}`}>Combo ×{combo}</div>
          </div>
          <div className="board-frame">
            <div className="board" role="grid" aria-label="8 by 8 candy board">
              {board.map((row, rowIndex) => row.map((candy, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
                return (
                  <button
                    key={candy.id}
                    className={`candy-cell ${isSelected ? "selected" : ""} ${burst.has(key) ? "burst" : ""}`}
                    onClick={() => chooseCandy({ row: rowIndex, col: colIndex })}
                    disabled={busy}
                    role="gridcell"
                    aria-label={`${LABELS[candy.type]}, row ${rowIndex + 1}, column ${colIndex + 1}${isSelected ? ", selected" : ""}`}
                    aria-pressed={isSelected}
                  >
                    <span className={`candy candy-${candy.type}`} aria-hidden="true"><i /></span>
                  </button>
                );
              }))}
            </div>
          </div>
          <p className="board-tip">Tap two neighboring candies to swap them</p>
        </section>

        <aside className="side-panel booster-panel">
          <div className="panel-heading"><span className="mini-star">★</span><span>Boosters</span></div>
          <p className="panel-copy">Need a little sugar magic?</p>
          <button className={`booster-card ${hammerMode ? "active" : ""}`} onClick={() => hammer > 0 && setHammerMode((value) => !value)} disabled={!hammer || busy}>
            <span className="booster-icon hammer">🔨</span><span><b>Lollipop hammer</b><small>{hammerMode ? "Pick a candy!" : "Clear one candy"}</small></span><em>×{hammer}</em>
          </button>
          <button className="booster-card" onClick={shuffleBoard} disabled={!shuffleCount || busy}>
            <span className="booster-icon shuffle">⤨</span><span><b>Sweet shuffle</b><small>Mix the board</small></span><em>×{shuffleCount}</em>
          </button>
          <div className="sugar-jar" aria-hidden="true"><div className="jar-lid" /><div className="jar-body"><span>★</span><i /><i /><i /></div></div>
          <p className="jar-copy">Fill the jar with<br /><b>spectacular combos!</b></p>
        </aside>
      </section>

      <footer><span>Made with</span> <b>♥</b> <span>and a sprinkle of sugar</span></footer>

      {gameState !== "playing" && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <div className="result-card">
            <div className="result-candy" aria-hidden="true">{gameState === "won" ? "🏆" : "🍭"}</div>
            <h2 id="result-title">{gameState === "won" ? "Sugar spectacular!" : "So close, sweetie!"}</h2>
            <p>{gameState === "won" ? `You conquered Level 24 with ${score.toLocaleString()} points.` : `You scored ${score.toLocaleString()} points. One more try will do it!`}</p>
            <button className="play-again" onClick={startNewGame}>Play again</button>
          </div>
        </div>
      )}
    </main>
  );
}
