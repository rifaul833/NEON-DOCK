"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type Group = "solids" | "stripes" | null;
type MatchMode = "local" | "computer";
type Ball = {
  id:number; x:number; y:number; vx:number; vy:number; color:string;
  stripe:boolean; pocketed:boolean; spin:number;
};

const W=960, H=500, R=15;
const X0=58, X1=W-58, Y0=58, Y1=H-58;
const POCKETS:[[number,number],[number,number],[number,number],[number,number],[number,number],[number,number]]=[
  [X0,Y0],[W/2,Y0-4],[X1,Y0],[X0,Y1],[W/2,Y1+4],[X1,Y1]
];
const BALL_COLORS=["#ffd400","#1769ff","#f3262d","#8b24d6","#ff7a00","#00a84f","#8e1735","#151515"];

function groupFor(id:number):Group{
  if(id>=1&&id<=7)return "solids";
  if(id>=9&&id<=15)return "stripes";
  return null;
}

function makeBalls():Ball[]{
  const balls:Ball[]=[{id:0,x:267,y:H/2,vx:0,vy:0,color:"#ffffff",stripe:false,pocketed:false,spin:0}];
  let id=1;
  const rack=[1,10,2,3,8,12,11,4,14,7,15,6,9,13,5];
  for(let row=0;row<5;row++){
    for(let col=0;col<=row;col++){
      const n=rack[id-1];
      balls.push({
        id:n,x:655+row*R*1.82,y:H/2+(col-row/2)*R*2.08,
        vx:0,vy:0,color:BALL_COLORS[(n-1)%8],stripe:n>8,pocketed:false,spin:0
      });
      id++;
    }
  }
  return balls;
}

function roundedRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.closePath();
}

function drawBall(ctx:CanvasRenderingContext2D,ball:Ball){
  ctx.save();ctx.translate(ball.x,ball.y);

  ctx.fillStyle="rgba(0,18,12,.38)";
  ctx.beginPath();ctx.ellipse(1,R*.68,R*.9,R*.32,0,0,Math.PI*2);ctx.fill();

  ctx.save();ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=ball.id===0?"#fffef8":ball.color;ctx.fillRect(-R,-R,R*2,R*2);
  ctx.rotate(ball.spin*.72);
  if(ball.stripe){
    ctx.fillStyle="#fffdf5";ctx.fillRect(-R*1.5,-R*.47,R*3,R*.94);
  }
  if(ball.id!==0){
    const patchX=Math.sin(ball.spin*.9)*3.2;
    const patchY=Math.cos(ball.spin*.9)*2.8;
    ctx.fillStyle="#fffef5";ctx.beginPath();ctx.arc(patchX,patchY,7.8,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.12)";ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle="#101712";ctx.font="900 8.5px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(String(ball.id),patchX,patchY+.4);
  }
  ctx.restore();

  const shine=ctx.createRadialGradient(-6,-7,1,0,0,R+1);
  shine.addColorStop(0,"rgba(255,255,255,.98)");shine.addColorStop(.22,"rgba(255,255,255,.2)");shine.addColorStop(.68,"rgba(0,0,0,0)");shine.addColorStop(1,"rgba(0,0,0,.34)");
  ctx.fillStyle=shine;ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#0d2920";ctx.lineWidth=1.8;ctx.stroke();
  ctx.restore();
}

function playerLabel(group:Group){
  if(!group)return "OPEN TABLE";
  return group==="solids"?"SOLIDS 1–7":"STRIPES 9–15";
}

export default function Home(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const ballsRef=useRef<Ball[]>(makeBalls());
  const aimRef=useRef(-.04),powerRef=useRef(58),movingRef=useRef(false),rafRef=useRef<number|null>(null);
  const turnRef=useRef(0),groupsRef=useRef<[Group,Group]>([null,null]);
  const shotPotsRef=useRef<number[]>([]),scratchRef=useRef(false),lastTimeRef=useRef(0),gameOverRef=useRef(false),modeRef=useRef<MatchMode>("computer");
  const aiTimerRef=useRef<number|null>(null);
  const audioCtxRef=useRef<AudioContext|null>(null),musicTimerRef=useRef<number|null>(null),musicStepRef=useRef(0),musicOnRef=useRef(true);
  const [power,setPower]=useState(58),[turn,setTurn]=useState(0),[groups,setGroups]=useState<[Group,Group]>([null,null]);
  const [pocketed,setPocketed]=useState<number[]>([]),[message,setMessage]=useState("Player 1 breaks!");
  const [guide,setGuide]=useState(true),[winner,setWinner]=useState<number|null>(null),[mode,setMode]=useState<MatchMode>("computer"),[computerThinking,setComputerThinking]=useState(false),[turnCycle,setTurnCycle]=useState(0),[musicOn,setMusicOn]=useState(true);
  useEffect(()=>{powerRef.current=power},[power]);

  const playTone=useCallback((ctx:AudioContext,frequency:number,duration:number,volume:number,type:OscillatorType="triangle")=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
    osc.type=type;osc.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.018);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.02);
  },[]);

  const startAudio=useCallback(()=>{
    let ctx=audioCtxRef.current;
    if(!ctx){ctx=new AudioContext();audioCtxRef.current=ctx}
    if(ctx.state==="suspended")void ctx.resume();
    if(musicOnRef.current&&musicTimerRef.current===null){
      const melody=[261.63,329.63,392,523.25,392,329.63,293.66,392,493.88,587.33,493.88,392];
      const tick=()=>{
        const active=audioCtxRef.current;if(!active||!musicOnRef.current)return;
        const step=musicStepRef.current++;
        playTone(active,melody[step%melody.length],.19,.026,step%3===0?"triangle":"sine");
        if(step%4===0)playTone(active,melody[step%melody.length]/2,.34,.018,"square");
      };
      tick();musicTimerRef.current=window.setInterval(tick,230);
    }
  },[playTone]);

  const playCueHit=useCallback((shotPower:number)=>{
    const ctx=audioCtxRef.current;if(!ctx)return;
    const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="sine";osc.frequency.setValueAtTime(210+shotPower*1.4,now);osc.frequency.exponentialRampToValueAtTime(72,now+.095);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.18,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.12);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.13);
    playTone(ctx,1100,.035,.065,"square");
  },[playTone]);

  const toggleMusic=useCallback(()=>{
    const next=!musicOnRef.current;musicOnRef.current=next;setMusicOn(next);
    if(next)startAudio();
    else if(musicTimerRef.current!==null){window.clearInterval(musicTimerRef.current);musicTimerRef.current=null}
  },[startAudio]);

  useEffect(()=>()=>{if(musicTimerRef.current!==null)window.clearInterval(musicTimerRef.current);void audioCtxRef.current?.close()},[]);

  const reset=useCallback(()=>{
    ballsRef.current=makeBalls();aimRef.current=-.04;movingRef.current=false;turnRef.current=0;groupsRef.current=[null,null];
    shotPotsRef.current=[];scratchRef.current=false;gameOverRef.current=false;lastTimeRef.current=0;
    if(aiTimerRef.current)window.clearTimeout(aiTimerRef.current);
    setTurn(0);setGroups([null,null]);setPocketed([]);setWinner(null);setComputerThinking(false);setTurnCycle(0);setMessage("Player 1 breaks!");
  },[]);

  const strike=useCallback((angle:number,shotPower:number)=>{
    const cue=ballsRef.current.find(b=>b.id===0);
    if(!cue||cue.pocketed||movingRef.current||gameOverRef.current)return;
    const speed=360+shotPower*5.7;
    aimRef.current=angle;cue.vx=Math.cos(angle)*speed;cue.vy=Math.sin(angle)*speed;
    playCueHit(shotPower);
    shotPotsRef.current=[];scratchRef.current=false;movingRef.current=true;
    setMessage((modeRef.current==="computer"&&turnRef.current===1?"Computer":"Player "+(turnRef.current+1))+" shoots…");
  },[playCueHit]);

  const shoot=useCallback(()=>{
    if(modeRef.current==="computer"&&turnRef.current===1)return;
    startAudio();
    strike(aimRef.current,powerRef.current);
  },[startAudio,strike]);

  const changeMode=useCallback((next:MatchMode)=>{
    modeRef.current=next;setMode(next);reset();
    setMessage(next==="computer"?"You break — the computer is Player 2":"Player 1 breaks!");
  },[reset]);

  useEffect(()=>{
    if(mode!=="computer"||turn!==1||movingRef.current||gameOverRef.current)return;
    setComputerThinking(true);setMessage("Computer is lining up a shot…");
    aiTimerRef.current=window.setTimeout(()=>{
      const cue=ballsRef.current.find(b=>b.id===0&&!b.pocketed);
      const cpuGroup=groupsRef.current[1];
      let choices=ballsRef.current.filter(b=>!b.pocketed&&b.id!==0&&b.id!==8&&(cpuGroup===null||groupFor(b.id)===cpuGroup));
      if(cpuGroup&&choices.length===0)choices=ballsRef.current.filter(b=>!b.pocketed&&b.id===8);
      if(!cue||choices.length===0){setComputerThinking(false);return}
      let target=choices[0],targetPocket=POCKETS[0],best=Infinity;
      for(const ball of choices){
        for(const pocket of POCKETS){
          const path=Math.hypot(ball.x-cue.x,ball.y-cue.y)+Math.hypot(pocket[0]-ball.x,pocket[1]-ball.y)*.55;
          if(path<best){best=path;target=ball;targetPocket=pocket}
        }
      }
      const pdx=targetPocket[0]-target.x,pdy=targetPocket[1]-target.y,pd=Math.max(1,Math.hypot(pdx,pdy));
      const ghostX=target.x-pdx/pd*(R*2),ghostY=target.y-pdy/pd*(R*2);
      const error=Math.sin(target.id*2.17+pocketed.length*.91)*.024;
      const angle=Math.atan2(ghostY-cue.y,ghostX-cue.x)+error;
      const aiPower=Math.max(43,Math.min(86,42+best/19));
      aimRef.current=angle;powerRef.current=Math.round(aiPower);setPower(Math.round(aiPower));
      setMessage("Computer has chosen the angle…");
      aiTimerRef.current=window.setTimeout(()=>{setComputerThinking(false);strike(angle,aiPower)},450);
    },750);
    return()=>{if(aiTimerRef.current)window.clearTimeout(aiTimerRef.current)};
  },[mode,turn,turnCycle,pocketed.length,strike]);

  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas?.getContext("2d");if(!canvas||!ctx)return;

    const settleShot=()=>{
      const current=turnRef.current,other=current===0?1:0,pots=shotPotsRef.current;
      const eight=pots.includes(8),currentGroup=groupsRef.current[current];
      if(eight){
        const cleared=currentGroup!==null&&!ballsRef.current.some(b=>!b.pocketed&&groupFor(b.id)===currentGroup);
        const victor=cleared&&!scratchRef.current?current:other;
        gameOverRef.current=true;setWinner(victor);setMessage("Player "+(victor+1)+" wins the rack!");
        return;
      }
      let assigned=currentGroup;
      if(!groupsRef.current[0]&&!groupsRef.current[1]){
        const first=pots.find(id=>groupFor(id)!==null);
        if(first){
          assigned=groupFor(first);
          const nextGroups:[Group,Group]=current===0?[assigned,assigned==="solids"?"stripes":"solids"]:[assigned==="solids"?"stripes":"solids",assigned];
          groupsRef.current=nextGroups;setGroups(nextGroups);
        }
      }
      const legalPot=assigned!==null&&pots.some(id=>groupFor(id)===assigned);
      const keepTurn=legalPot&&!scratchRef.current;
      if(scratchRef.current){
        const cue=ballsRef.current.find(b=>b.id===0);
        if(cue){cue.pocketed=false;cue.x=267;cue.y=H/2;cue.vx=0;cue.vy=0;cue.spin=0}
      }
      const next=keepTurn?current:other;turnRef.current=next;setTurn(next);
      setTurnCycle(n=>n+1);
      if(scratchRef.current)setMessage("Scratch — ball in hand for Player "+(next+1));
      else if(keepTurn)setMessage("Nice pot! Player "+(current+1)+" continues");
      else setMessage("Player "+(next+1)+" to shoot");
    };

    const drawTable=()=>{
      ctx.clearRect(0,0,W,H);
      const base=ctx.createLinearGradient(0,0,0,H);base.addColorStop(0,"#116342");base.addColorStop(1,"#073d2b");
      ctx.fillStyle=base;roundedRect(ctx,0,0,W,H,26);ctx.fill();

      const felt=ctx.createRadialGradient(W/2,H/2,40,W/2,H/2,W*.56);
      felt.addColorStop(0,"#168b61");felt.addColorStop(.72,"#0a7450");felt.addColorStop(1,"#075c40");
      ctx.fillStyle=felt;ctx.fillRect(X0,Y0,X1-X0,Y1-Y0);

      const cushion=ctx.createLinearGradient(0,0,0,50);cushion.addColorStop(0,"#1eb078");cushion.addColorStop(1,"#096342");
      ctx.fillStyle=cushion;
      ctx.beginPath();ctx.moveTo(X0+20,Y0);ctx.lineTo(W/2-34,Y0);ctx.lineTo(W/2-24,Y0+22);ctx.lineTo(X0+28,Y0+22);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(W/2+34,Y0);ctx.lineTo(X1-20,Y0);ctx.lineTo(X1-28,Y0+22);ctx.lineTo(W/2+24,Y0+22);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(X0+20,Y1);ctx.lineTo(W/2-34,Y1);ctx.lineTo(W/2-24,Y1-22);ctx.lineTo(X0+28,Y1-22);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(W/2+34,Y1);ctx.lineTo(X1-20,Y1);ctx.lineTo(X1-28,Y1-22);ctx.lineTo(W/2+24,Y1-22);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(X0,Y0+20);ctx.lineTo(X0,Y1-20);ctx.lineTo(X0+22,Y1-28);ctx.lineTo(X0+22,Y0+28);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(X1,Y0+20);ctx.lineTo(X1,Y1-20);ctx.lineTo(X1-22,Y1-28);ctx.lineTo(X1-22,Y0+28);ctx.closePath();ctx.fill();

      ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(W*.25,Y0+22);ctx.lineTo(W*.25,Y1-22);ctx.stroke();
      ctx.beginPath();ctx.arc(W*.25,H/2,48,0,Math.PI*2);ctx.stroke();

      for(const [px,py] of POCKETS){
        ctx.fillStyle="rgba(0,0,0,.24)";ctx.beginPath();ctx.ellipse(px+2,py+5,28,19,0,0,Math.PI*2);ctx.fill();
        const pg=ctx.createRadialGradient(px-5,py-5,3,px,py,28);pg.addColorStop(0,"#020504");pg.addColorStop(.7,"#07130f");pg.addColorStop(1,"#193429");
        ctx.fillStyle=pg;ctx.beginPath();ctx.arc(px,py,27,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#09140f";ctx.lineWidth=4;ctx.stroke();
      }
    };

    const frame=(time:number)=>{
      const rawDt=lastTimeRef.current?(time-lastTimeRef.current)/1000:0;
      lastTimeRef.current=time;const dt=Math.min(rawDt,.024);const balls=ballsRef.current;
      let anyMoving=false;
      for(const b of balls){
        if(b.pocketed)continue;
        const speed=Math.hypot(b.vx,b.vy);
        if(speed>.6){
          b.x+=b.vx*dt;b.y+=b.vy*dt;b.spin+=speed*dt/R;
          const friction=Math.pow(.986,dt*60);b.vx*=friction;b.vy*=friction;
          if(Math.hypot(b.vx,b.vy)<4){b.vx=0;b.vy=0}else anyMoving=true;
        }else{b.vx=0;b.vy=0}

        for(const [px,py] of POCKETS){
          if(Math.hypot(b.x-px,b.y-py)<25){
            b.pocketed=true;b.vx=0;b.vy=0;
            if(b.id===0){scratchRef.current=true}
            else{shotPotsRef.current.push(b.id);setPocketed(ids=>ids.includes(b.id)?ids:[...ids,b.id])}
            break;
          }
        }
        if(b.pocketed)continue;
        if(b.x<X0+R){b.x=X0+R;b.vx=Math.abs(b.vx)*.86}
        if(b.x>X1-R){b.x=X1-R;b.vx=-Math.abs(b.vx)*.86}
        if(b.y<Y0+R){b.y=Y0+R;b.vy=Math.abs(b.vy)*.86}
        if(b.y>Y1-R){b.y=Y1-R;b.vy=-Math.abs(b.vy)*.86}
      }

      for(let i=0;i<balls.length;i++){
        const a=balls[i];if(a.pocketed)continue;
        for(let j=i+1;j<balls.length;j++){
          const b=balls[j];if(b.pocketed)continue;
          const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
          if(dist>0&&dist<R*2){
            const nx=dx/dist,ny=dy/dist,overlap=R*2-dist;
            a.x-=nx*overlap/2;a.y-=ny*overlap/2;b.x+=nx*overlap/2;b.y+=ny*overlap/2;
            const relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
            if(relative>0){const impulse=relative*.96;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;anyMoving=true}
          }
        }
      }

      if(movingRef.current&&!anyMoving){movingRef.current=false;settleShot()}

      drawTable();
      const cue=balls.find(b=>b.id===0);
      if(cue&&!cue.pocketed&&!movingRef.current&&!gameOverRef.current){
        const angle=aimRef.current;
        if(guide){
          ctx.save();ctx.setLineDash([9,8]);ctx.strokeStyle="rgba(255,255,255,.82)";ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(cue.x+Math.cos(angle)*20,cue.y+Math.sin(angle)*20);ctx.lineTo(cue.x+Math.cos(angle)*410,cue.y+Math.sin(angle)*410);ctx.stroke();ctx.restore();
        }
        const back=42+powerRef.current*.32,end=285,x1=cue.x-Math.cos(angle)*back,y1=cue.y-Math.sin(angle)*back,x2=cue.x-Math.cos(angle)*end,y2=cue.y-Math.sin(angle)*end;
        ctx.strokeStyle="rgba(0,0,0,.28)";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x1+2,y1+3);ctx.lineTo(x2+2,y2+3);ctx.stroke();
        const cg=ctx.createLinearGradient(x1,y1,x2,y2);cg.addColorStop(0,"#f5e7b2");cg.addColorStop(.72,"#d29036");cg.addColorStop(.84,"#1a6682");cg.addColorStop(1,"#193a35");
        ctx.strokeStyle=cg;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
      }
      balls.filter(b=>!b.pocketed).sort((a,b)=>a.y-b.y).forEach(b=>drawBall(ctx,b));
      rafRef.current=requestAnimationFrame(frame);
    };
    rafRef.current=requestAnimationFrame(frame);
    return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current)};
  },[guide]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")aimRef.current-=.04;
      if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")aimRef.current+=.04;
      if(e.key===" "||e.key==="Enter"){e.preventDefault();startAudio();shoot()}
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[shoot,startAudio]);

  const pointAim=(clientX:number,clientY:number)=>{
    if(movingRef.current||gameOverRef.current||(modeRef.current==="computer"&&turnRef.current===1))return;
    const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return;
    const x=(clientX-rect.left)*(W/rect.width),y=(clientY-rect.top)*(H/rect.height);
    const cue=ballsRef.current.find(b=>b.id===0);if(cue)aimRef.current=Math.atan2(y-cue.y,x-cue.x);
  };
  const remaining=(group:Group)=>group?ballsRef.current.filter(b=>!b.pocketed&&groupFor(b.id)===group).length:7;
  const computerTurn=mode==="computer"&&turn===1;
  const winnerName=winner===1&&mode==="computer"?"COMPUTER":"PLAYER "+((winner??0)+1);

  return <main className="game-shell" onPointerDown={startAudio}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark">8</span><span><b>HAPPY</b><strong>BREAK!</strong></span></div>
      <div className="mode-switch" aria-label="Match mode">
        <button className={mode==="computer"?"active":""} onClick={()=>changeMode("computer")}>VS COMPUTER</button>
        <button className={mode==="local"?"active":""} onClick={()=>changeMode("local")}>2 PLAYERS</button>
      </div>
      <div className="header-actions">
        <button className={"music-btn "+(musicOn?"on":"")} aria-label={musicOn?"Turn music off":"Turn music on"} onPointerDown={e=>e.stopPropagation()} onClick={toggleMusic}><span>♫</span>{musicOn?"ON":"OFF"}</button>
        <button className="reset-btn" onClick={()=>{startAudio();reset()}}><span>↻</span> NEW RACK</button>
      </div>
    </header>

    <section className="match-strip" aria-label="Match status">
      {[0,1].map(player=><div key={player} className={"player-score "+(turn===player?"active ":"")+(mode==="computer"&&player===1?"computer":"")}>
        <div className={"player-avatar p"+(player+1)}>{mode==="computer"&&player===1?"AI":player+1}</div>
        <div><small>{mode==="computer"&&player===1?"COMPUTER":"PLAYER "+(player+1)}</small><strong>{playerLabel(groups[player])}</strong></div>
        <div className="remaining"><b>{remaining(groups[player])}</b><small>LEFT</small></div>
      </div>)}
      <div className="turn-callout"><small>CURRENT TURN</small><b>{computerTurn?"COMPUTER":"PLAYER "+(turn+1)}</b><span>{computerThinking&&<i/>}{message}</span></div>
    </section>

    <section className="play-area">
      <div className="rays" aria-hidden="true"/>
      <aside className="ball-tray">
        <span>POCKETED</span>
        <div>{pocketed.length?[...pocketed].sort((a,b)=>a-b).map(id=><i key={id} className={"mini-ball "+(id>8?"stripe":"")} style={{"--ball":BALL_COLORS[(id-1)%8]} as CSSProperties}>{id}</i>):<small>None yet</small>}</div>
      </aside>
      <div className="table-wrap">
        <div className="table-shadow"/>
        <div className="table-frame">
          <div className="rail-markers top"><i/><i/><i/><i/><i/><i/></div>
          <canvas ref={canvasRef} width={W} height={H} aria-label="Two-player pool table. Move to aim and click to shoot." onPointerMove={e=>pointAim(e.clientX,e.clientY)} onPointerDown={e=>{pointAim(e.clientX,e.clientY);shoot()}}/>
          <div className="rail-markers bottom"><i/><i/><i/><i/><i/><i/></div>
        </div>
        <div className="table-apron"><span>HAPPY BREAK CLUB</span></div>
        <div className="table-legs"><i/><i/><i/><i/></div>
      </div>
      <button className={"guide-toggle "+(guide?"on":"")} onClick={()=>setGuide(!guide)}><i/> AIM GUIDE</button>
    </section>

    <section className="controls" aria-label="Shot controls">
      <div className={"turn-badge "+(computerTurn?"ai":"")}>{computerTurn?"AI":"P"+(turn+1)}</div>
      <div className={"power-control "+(computerTurn?"disabled":"")}><div className="power-label"><span>{computerTurn?"COMPUTER POWER":"SHOT POWER"}</span><b>{power}%</b></div><input disabled={computerTurn} aria-label="Shot power" type="range" min="15" max="100" value={power} onChange={e=>setPower(Number(e.target.value))}/><div className="ticks"><span>SOFT</span><i/><i/><i/><i/><span>BREAK</span></div></div>
      <button className="shoot-btn" disabled={computerTurn} onClick={shoot}><span>{computerTurn?"●":"➤"}</span><b>{computerTurn?"THINKING":"SHOOT"}</b><small>{computerTurn?"PLEASE WAIT":"SPACE"}</small></button>
    </section>
    <footer>MOVE TO AIM &nbsp;•&nbsp; CLICK TO SHOOT &nbsp;•&nbsp; POT YOUR GROUP, THEN THE 8 BALL</footer>

    {winner!==null&&<div className="winner-screen" role="dialog" aria-modal="true" aria-label="Game over"><div className="winner-card"><span className="winner-ball">8</span><small>RACK COMPLETE</small><h1>{winnerName} WINS!</h1><p>Great game. Ready for a rematch?</p><button onClick={reset}>PLAY AGAIN</button></div></div>}
  </main>
}
