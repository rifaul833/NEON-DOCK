"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Ball = { id:number; x:number; y:number; vx:number; vy:number; color:string; stripe?:boolean; pocketed?:boolean };
const W=900, H=460, R=13;
const POCKETS=[[20,20],[W/2,12],[W-20,20],[20,H-20],[W/2,H-12],[W-20,H-20]];
const COLORS=["#f7d433","#3f85e8","#f0553d","#8a55d7","#f48b2d","#37a56b","#b62f46","#1f2837"];

function makeBalls():Ball[]{
  const balls:Ball[]=[{id:0,x:235,y:H/2,vx:0,vy:0,color:"#fff9e8"}];
  let id=1;
  for(let row=0;row<5;row++) for(let col=0;col<=row;col++){
    const n=id++; balls.push({id:n,x:628+row*R*1.82,y:H/2+(col-row/2)*R*2.08,vx:0,vy:0,color:COLORS[(n-1)%COLORS.length],stripe:n>8});
  }
  return balls;
}

function drawBall(ctx:CanvasRenderingContext2D,ball:Ball){
  ctx.save(); ctx.translate(ball.x,ball.y);
  ctx.fillStyle="rgba(16,39,31,.24)"; ctx.beginPath(); ctx.ellipse(4,R+5,R*.92,R*.46,0,0,Math.PI*2); ctx.fill();
  const g=ctx.createRadialGradient(-5,-7,1,0,0,R+2); g.addColorStop(0,"#fff"); g.addColorStop(.18,ball.color); g.addColorStop(1,ball.id===0?"#c9c2ad":"#253531");
  ctx.fillStyle=g; ctx.strokeStyle="rgba(19,33,31,.65)"; ctx.lineWidth=1.5; ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(ball.stripe){ctx.fillStyle="#fff9e8";ctx.beginPath();ctx.ellipse(0,0,R*.98,R*.47,0,0,Math.PI*2);ctx.fill();}
  if(ball.id!==0){ctx.fillStyle="#fffdf4";ctx.beginPath();ctx.arc(0,0,6.8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#263932";ctx.font="bold 7px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(ball.id),0,.6);}
  ctx.restore();
}

export default function Home(){
  const canvasRef=useRef<HTMLCanvasElement>(null), ballsRef=useRef<Ball[]>(makeBalls()), aimRef=useRef(-.08), powerRef=useRef(62), playingRef=useRef(false), rafRef=useRef<number|null>(null);
  const [power,setPower]=useState(62),[score,setScore]=useState(0),[best,setBest]=useState(1240),[shot,setShot]=useState(3),[message,setMessage]=useState("Line up your shot!"),[sound,setSound]=useState(true),[guide,setGuide]=useState(true);
  useEffect(()=>{powerRef.current=power},[power]);

  const reset=useCallback(()=>{ballsRef.current=makeBalls();playingRef.current=false;aimRef.current=-.08;setScore(0);setShot(3);setMessage("Fresh rack — break 'em up!");},[]);
  const shoot=useCallback(()=>{const cue=ballsRef.current[0];if(!cue||cue.pocketed||playingRef.current)return;const force=7+powerRef.current*.14;cue.vx=Math.cos(aimRef.current)*force;cue.vy=Math.sin(aimRef.current)*force;playingRef.current=true;setShot(n=>n+1);setMessage("Nice hit!");},[]);

  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas?.getContext("2d");if(!canvas||!ctx)return;
    const frame=()=>{
      const balls=ballsRef.current;let moving=false;
      for(const b of balls){
        if(b.pocketed)continue;b.x+=b.vx;b.y+=b.vy;b.vx*=.988;b.vy*=.988;if(Math.abs(b.vx)<.025)b.vx=0;if(Math.abs(b.vy)<.025)b.vy=0;if(b.vx||b.vy)moving=true;
        for(const [px,py] of POCKETS)if(Math.hypot(b.x-px,b.y-py)<23){b.pocketed=true;b.vx=b.vy=0;if(b.id===0){setMessage("Scratch! Cue ball returned.");window.setTimeout(()=>{b.pocketed=false;b.x=235;b.y=H/2},700)}else{setScore(s=>{const next=s+(b.id===8?250:100);setBest(old=>Math.max(old,next));return next});setMessage(b.id===8?"Eight ball! What a shot!":"Ball "+b.id+" sunk! +100")}}
        if(b.x<31+R){b.x=31+R;b.vx=Math.abs(b.vx)*.88}if(b.x>W-31-R){b.x=W-31-R;b.vx=-Math.abs(b.vx)*.88}if(b.y<28+R){b.y=28+R;b.vy=Math.abs(b.vy)*.88}if(b.y>H-28-R){b.y=H-28-R;b.vy=-Math.abs(b.vy)*.88}
      }
      for(let i=0;i<balls.length;i++){const a=balls[i];if(a.pocketed)continue;for(let j=i+1;j<balls.length;j++){const b=balls[j];if(b.pocketed)continue;const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);if(dist>0&&dist<R*2){const nx=dx/dist,ny=dy/dist,o=R*2-dist;a.x-=nx*o/2;a.y-=ny*o/2;b.x+=nx*o/2;b.y+=ny*o/2;const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rel>0){const impulse=rel*.94;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny}}}}
      if(playingRef.current&&!moving){playingRef.current=false;setMessage(m=>m.includes("sunk")?m:"Your turn — take aim!")}
      ctx.clearRect(0,0,W,H+92);ctx.save();ctx.translate(0,51);ctx.scale(1,.78);
      const felt=ctx.createLinearGradient(0,0,0,H);felt.addColorStop(0,"#55c987");felt.addColorStop(1,"#15905d");ctx.fillStyle=felt;ctx.fillRect(0,0,W,H);
      ctx.strokeStyle="rgba(255,255,255,.09)";for(let x=70;x<W;x+=85){ctx.beginPath();ctx.moveTo(x,32);ctx.lineTo(x-30,H-30);ctx.stroke()}
      for(const [px,py] of POCKETS){const g=ctx.createRadialGradient(px,py,3,px,py,25);g.addColorStop(0,"#071d17");g.addColorStop(.7,"#0d2820");g.addColorStop(1,"#164f39");ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,25,0,Math.PI*2);ctx.fill()}
      const cue=balls[0];if(cue&&!cue.pocketed&&!playingRef.current){const angle=aimRef.current;if(guide){ctx.save();ctx.setLineDash([10,10]);ctx.strokeStyle="rgba(255,255,226,.7)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cue.x+Math.cos(angle)*18,cue.y+Math.sin(angle)*18);ctx.lineTo(cue.x+Math.cos(angle)*360,cue.y+Math.sin(angle)*360);ctx.stroke();ctx.restore()}
        const back=43+power*.34,end=310,x1=cue.x-Math.cos(angle)*back,y1=cue.y-Math.sin(angle)*back,x2=cue.x-Math.cos(angle)*end,y2=cue.y-Math.sin(angle)*end,cg=ctx.createLinearGradient(x1,y1,x2,y2);cg.addColorStop(0,"#fbf0c9");cg.addColorStop(.68,"#d79b46");cg.addColorStop(.86,"#764627");cg.addColorStop(1,"#4c2d26");ctx.strokeStyle="rgba(0,0,0,.2)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x1+3,y1+5);ctx.lineTo(x2+3,y2+5);ctx.stroke();ctx.strokeStyle=cg;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
      [...balls].filter(b=>!b.pocketed).sort((a,b)=>a.y-b.y).forEach(b=>drawBall(ctx,b));ctx.restore();rafRef.current=requestAnimationFrame(frame);
    };frame();return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current)};
  },[guide,power]);

  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")aimRef.current-=.045;if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")aimRef.current+=.045;if(e.key===" "||e.key==="Enter"){e.preventDefault();shoot()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[shoot]);
  const pointAim=(clientX:number,clientY:number)=>{if(playingRef.current)return;const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return;const x=(clientX-rect.left)*(W/rect.width),y=((clientY-rect.top)*((H+92)/rect.height)-51)/.78,cue=ballsRef.current[0];aimRef.current=Math.atan2(y-cue.y,x-cue.x)};

  return <main className="game-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">8</span><span><b>HAPPY</b><strong>BREAK!</strong></span></div><div className="score-pill"><span>SCORE</span><b>{String(score).padStart(4,"0")}</b></div><div className="top-actions"><button className="icon-btn" aria-label="Toggle sound" onClick={()=>setSound(!sound)}>{sound?"♫":"×"}</button><button className="reset-btn" onClick={reset}><span>↻</span> NEW GAME</button></div></header>
    <section className="play-area"><div className="rays" aria-hidden="true"/>
      <div className="side-panel left-panel"><div className="speech">{message}<i/></div><div className="avatar-card"><div className="avatar"><span className="hair"/><span className="face"><i/><i/></span><span className="shirt">★</span></div><div><b>YOU</b><small>POOL ROOKIE</small></div></div><div className="stat"><span>BEST</span><b>{best}</b></div></div>
      <div className="table-wrap"><div className="table-shadow"/><div className="table-frame"><span className="diamond d1"/><span className="diamond d2"/><span className="diamond d3"/><span className="diamond d4"/><canvas ref={canvasRef} width={W} height={H+92} aria-label="Playable cartoon 3D pool table. Move pointer to aim and click to shoot." onPointerMove={e=>pointAim(e.clientX,e.clientY)} onPointerDown={e=>{pointAim(e.clientX,e.clientY);shoot()}}/></div><div className="table-legs"><i/><i/></div></div>
      <div className="side-panel right-panel"><div className="shot-card"><span>SHOT</span><b>#{shot}</b><small>KEEP IT UP!</small></div><button className={"guide-toggle "+(guide?"on":"")} onClick={()=>setGuide(!guide)}><i/> AIM GUIDE</button><div className="hint"><span>↔</span><p><b>AIM</b>Move your mouse</p></div><div className="hint"><span>●</span><p><b>SHOOT</b>Click or press space</p></div></div>
    </section>
    <section className="controls" aria-label="Shot power controls"><div className="cue-ball-mini"/><div className="power-control"><div className="power-label"><span>POWER</span><b>{power}%</b></div><input aria-label="Shot power" type="range" min="15" max="100" value={power} onChange={e=>setPower(Number(e.target.value))}/><div className="ticks"><span>SOFT</span><i/><i/><i/><i/><span>SMASH!</span></div></div><button className="shoot-btn" onClick={shoot}><span>➤</span><b>SHOOT!</b><small>SPACE</small></button></section>
    <footer>MOVE TO AIM &nbsp;•&nbsp; CLICK TO SHOOT &nbsp;•&nbsp; CLEAR THE TABLE</footer>
  </main>
}
