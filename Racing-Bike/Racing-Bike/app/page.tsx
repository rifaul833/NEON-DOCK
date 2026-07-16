"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RaceState = "ready" | "racing" | "finished";
const TOTAL = 1200;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const distanceRef = useRef(0);
  const boostRef = useRef(0);
  const laneRef = useRef(0);
  const keysRef = useRef(new Set<string>());
  const [race, setRace] = useState<RaceState>("ready");
  const [distance, setDistance] = useState(0);
  const [roll, setRoll] = useState(3);
  const [rolling, setRolling] = useState(false);
  const [music, setMusic] = useState(true);
  const [message, setMessage] = useState("Roll to power your pedals!");

  const tone = useCallback((freq: number, duration: number, type: OscillatorType = "square", volume = .035, delay = 0) => {
    const ctx = audioRef.current;
    if (!ctx || ctx.state !== "running") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    void audioRef.current.resume();
  }, []);

  const stopMusic = useCallback(() => {
    if (musicTimer.current) clearInterval(musicTimer.current);
    musicTimer.current = null;
  }, []);

  const startMusic = useCallback(() => {
    if (musicTimer.current || !music) return;
    const melody = [392, 523, 659, 523, 440, 587, 698, 587, 349, 440, 523, 659];
    let step = 0;
    const play = () => {
      tone(melody[step % melody.length], .16, "triangle", .024);
      if (step % 2 === 0) tone(melody[step % melody.length] / 2, .12, "sine", .012);
      if (step % 4 === 0) tone(98, .07, "square", .013);
      step++;
    };
    play();
    musicTimer.current = setInterval(play, 230);
  }, [music, tone]);

  useEffect(() => {
    if (race === "racing" && music) startMusic(); else stopMusic();
    return stopMusic;
  }, [music, race, startMusic, stopMusic]);

  const startRace = useCallback(() => {
    ensureAudio();
    distanceRef.current = 0;
    boostRef.current = 0;
    laneRef.current = 0;
    setDistance(0);
    setRoll(3);
    setMessage("Roll the die — bigger rolls mean bigger boosts!");
    setRace("racing");
    tone(523, .1, "square", .04);
    tone(659, .1, "square", .04, .11);
    tone(784, .25, "square", .04, .22);
  }, [ensureAudio, tone]);

  const rollDice = useCallback(() => {
    if (race !== "racing" || rolling) return;
    ensureAudio();
    setRolling(true);
    setMessage("Dice spinning…");
    [0, .07, .14, .21, .28].forEach((d, i) => tone(160 + i * 55, .055, "square", .045, d));
    let ticks = 0;
    const interval = setInterval(() => {
      setRoll(1 + Math.floor(Math.random() * 6));
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        const result = 1 + Math.floor(Math.random() * 6);
        setRoll(result);
        boostRef.current += 48 + result * 34;
        setRolling(false);
        setMessage(result === 6 ? "TURBO SIX! Maximum pedal power!" : `Nice! +${result} pedal power`);
        tone(result === 6 ? 988 : 740, .18, "triangle", .06);
        if (result === 6) tone(1318, .3, "triangle", .045, .12);
      }
    }, 55);
  }, [ensureAudio, race, rolling, tone]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      if (e.key === " " && !e.repeat) rollDice();
      keysRef.current.add(e.key);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [rollDice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    let last = performance.now();
    let roadOffset = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const circle = (x:number,y:number,r:number,fill:string,stroke:string="#17345b",lw=4) => {
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke();
    };
    const drawBike = (x:number,y:number,s:number,lean:number,color:string) => {
      ctx.save(); ctx.translate(x,y); ctx.rotate(lean); ctx.lineCap="round"; ctx.lineJoin="round";
      circle(-29*s,4*s,25*s,"#f7fbef","#17345b",6*s); circle(29*s,4*s,25*s,"#f7fbef","#17345b",6*s);
      ctx.strokeStyle="#17345b"; ctx.lineWidth=7*s; ctx.beginPath(); ctx.moveTo(-29*s,4*s); ctx.lineTo(-7*s,-27*s); ctx.lineTo(16*s,4*s); ctx.lineTo(-29*s,4*s); ctx.lineTo(2*s,4*s); ctx.stroke();
      ctx.strokeStyle=color; ctx.lineWidth=8*s; ctx.beginPath(); ctx.moveTo(-7*s,-27*s); ctx.lineTo(29*s,4*s); ctx.moveTo(-7*s,-27*s); ctx.lineTo(3*s,-45*s); ctx.stroke();
      ctx.strokeStyle="#17345b"; ctx.lineWidth=6*s; ctx.beginPath(); ctx.moveTo(-2*s,-48*s); ctx.lineTo(20*s,-48*s); ctx.moveTo(3*s,-44*s); ctx.lineTo(-5*s,-75*s); ctx.stroke();
      circle(-7*s,-94*s,17*s,"#ffd8b3","#17345b",5*s); ctx.beginPath(); ctx.arc(-7*s,-97*s,17*s,Math.PI,Math.PI*2); ctx.fillStyle="#ff655f"; ctx.fill(); ctx.stroke();
      ctx.fillStyle=color; ctx.strokeStyle="#17345b"; ctx.lineWidth=5*s; ctx.beginPath(); ctx.roundRect(-26*s,-79*s,36*s,38*s,10*s); ctx.fill(); ctx.stroke();
      ctx.restore();
    };
    const drawCloud = (x:number,y:number,s:number) => {
      ctx.fillStyle="rgba(255,255,255,.9)"; ctx.strokeStyle="#17345b"; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(x,y,24*s,Math.PI,Math.PI*2); ctx.arc(x+31*s,y-12*s,30*s,Math.PI,Math.PI*2); ctx.arc(x+66*s,y,23*s,Math.PI,Math.PI*2); ctx.lineTo(x+66*s,y+18*s); ctx.lineTo(x,y+18*s); ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    const frame = (now:number) => {
      const dt = Math.min(.04,(now-last)/1000); last=now;
      const w=canvas.clientWidth,h=canvas.clientHeight;
      if (race === "racing") {
        if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) laneRef.current -= dt*1.4;
        if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) laneRef.current += dt*1.4;
        laneRef.current = Math.max(-1,Math.min(1,laneRef.current));
        const speed = boostRef.current > 0 ? 64 + Math.min(150, boostRef.current*.36) : 18;
        distanceRef.current = Math.min(TOTAL, distanceRef.current + speed*dt);
        boostRef.current = Math.max(0,boostRef.current-dt*48);
        roadOffset += speed*dt;
        setDistance(Math.floor(distanceRef.current));
        if (distanceRef.current >= TOTAL) {
          setRace("finished"); setMessage("Champion of the Toy-Box Trail!"); stopMusic();
          tone(784,.18,"triangle",.06); tone(988,.18,"triangle",.06,.18); tone(1318,.5,"triangle",.06,.36);
        }
      }

      const sky=ctx.createLinearGradient(0,0,0,h); sky.addColorStop(0,"#6edfff"); sky.addColorStop(.52,"#bdf6f0"); sky.addColorStop(1,"#73db9c"); ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
      circle(w*.82,90,48,"#ffe45a","#17345b",5);
      drawCloud(w*.08+Math.sin(now/5000)*18,95,.85); drawCloud(w*.62+Math.sin(now/6500)*14,145,.58);
      ctx.fillStyle="#8a78e7"; ctx.strokeStyle="#17345b"; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-30,h*.47); ctx.lineTo(w*.13,h*.2); ctx.lineTo(w*.29,h*.47); ctx.lineTo(w*.43,h*.25); ctx.lineTo(w*.62,h*.47); ctx.lineTo(w*.78,h*.18); ctx.lineTo(w+30,h*.47); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#53ce79"; ctx.beginPath(); ctx.ellipse(w*.2,h*.54,w*.38,h*.22,0,0,Math.PI*2); ctx.ellipse(w*.82,h*.56,w*.45,h*.24,0,0,Math.PI*2); ctx.fill();

      const horizon=h*.42, bottom=h+40, cx=w/2;
      ctx.fillStyle="#ffd84d"; ctx.beginPath(); ctx.moveTo(cx-55,horizon); ctx.lineTo(cx+55,horizon); ctx.lineTo(w*.92,bottom); ctx.lineTo(w*.08,bottom); ctx.closePath(); ctx.fill(); ctx.strokeStyle="#17345b"; ctx.lineWidth=6; ctx.stroke();
      ctx.fillStyle="#fff9dc"; ctx.beginPath(); ctx.moveTo(cx-42,horizon); ctx.lineTo(cx+42,horizon); ctx.lineTo(w*.83,bottom); ctx.lineTo(w*.17,bottom); ctx.closePath(); ctx.fill();
      for(let i=0;i<11;i++){
        const p=((i/10)+(roadOffset%90)/90)%1; const y=horizon+(bottom-horizon)*p*p; const y2=horizon+(bottom-horizon)*Math.min(1,(p+.05)*(p+.05)); const wide=15+240*p;
        ctx.fillStyle=i%2?"#ff655f":"#ffffff"; ctx.fillRect(cx-wide-22*p,y,26+30*p,Math.max(4,y2-y)); ctx.fillRect(cx+wide-4-30*p,y,26+30*p,Math.max(4,y2-y));
      }
      ctx.strokeStyle="#70d9cf"; ctx.lineWidth=8; ctx.setLineDash([18,22]); ctx.beginPath(); ctx.moveTo(cx,horizon+16); ctx.lineTo(cx,bottom); ctx.stroke(); ctx.setLineDash([]);

      const rivalProgress=Math.min(1,(distanceRef.current+145+Math.sin(now/1200)*65)/TOTAL); const ry=horizon+90+rivalProgress*80; drawBike(cx+110*Math.sin(now/1800),ry,.34,Math.sin(now/800)*.06,"#9a67f1");
      const lean=(keysRef.current.has("ArrowLeft")?-1:keysRef.current.has("ArrowRight")?1:0)*.12; drawBike(cx+laneRef.current*w*.19,h*.82,1,lean,"#ff655f");
      if(boostRef.current>10){ ctx.fillStyle="#ffe45a"; for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(cx+laneRef.current*w*.19-38+i*18,h*.92);ctx.lineTo(cx+laneRef.current*w*.19-24+i*18,h*.98+Math.random()*12);ctx.lineTo(cx+laneRef.current*w*.19-10+i*18,h*.92);ctx.fill();}}
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);ro.disconnect();};
  },[race,stopMusic,tone]);

  const progress=Math.min(100,Math.round(distance/TOTAL*100));
  return <main className="race-shell">
    <canvas ref={canvasRef} className="race-canvas" aria-label="Cartoon 3D bike racing track" />
    <header className="hud-top">
      <div className="logo"><span>⚡</span><div><small>TURBO</small><strong>DICE RIDERS</strong></div></div>
      <div className="race-stats"><div><small>POSITION</small><b>{progress>72?"1st":"2nd"}</b></div><div><small>DISTANCE</small><b>{distance}<em>m</em></b></div><div><small>FINISH</small><b>{progress}%</b></div></div>
      <button className="sound" onClick={()=>{ensureAudio();setMusic(m=>!m)}} aria-label={music?"Mute music":"Play music"}>{music?"♫":"♩"}</button>
    </header>

    <section className="progress-card"><div className="progress-label"><b>TOY-BOX TRAIL</b><span>{TOTAL-distance>0?`${TOTAL-distance}m to finish`:"FINISHED!"}</span></div><div className="track"><i style={{width:`${progress}%`}}/><span style={{left:`calc(${progress}% - 14px)`}}>🚴</span></div></section>

    <section className="dice-panel">
      <div><small>PEDAL POWER</small><b>{message}</b><p>Steer with <kbd>←</kbd> <kbd>→</kbd></p></div>
      <button className={`die die-${roll} ${rolling?"rolling":""}`} onClick={rollDice} disabled={race!=="racing"||rolling} aria-label={`Roll dice, current value ${roll}`}>
        {Array.from({length:9},(_,i)=><i key={i}/>) }
      </button>
      <button className="roll-button" onClick={rollDice} disabled={race!=="racing"||rolling}><span>ROLL</span><small>or press SPACE</small></button>
    </section>

    {race!=="racing"&&<div className="overlay"><div className="start-card"><span className="badge">{race==="finished"?"🏆":"🚲"}</span><small>{race==="finished"?"TRAIL COMPLETE":"A DICE-POWERED BIKE RACE"}</small><h1>{race==="finished"?"YOU WON!":"TURBO DICE RIDERS"}</h1><p>{race==="finished"?"You pedalled past every rival and conquered the Toy-Box Trail.":"Roll the die to charge your bike, dodge across the road, and race to the finish!"}</p><button onClick={startRace}>{race==="finished"?"RACE AGAIN":"START RACE"}<span>➜</span></button><em>Music begins after you start</em></div></div>}
  </main>;
}
