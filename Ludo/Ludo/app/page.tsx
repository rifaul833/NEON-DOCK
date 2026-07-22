"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Color = "red" | "green" | "yellow" | "blue";
type Piece = { color: Color; id: number; progress: number };
type PlayerConfig = { kind: "human" | "computer"; name: string };

const COLORS: Color[] = ["red", "green", "yellow", "blue"];
const LABELS: Record<Color,string> = { red:"Ruby", green:"Emerald", yellow:"Gold", blue:"Sapphire" };
const PALETTE: Record<Color,string> = { red:"#ff4d61", green:"#2dcc79", yellow:"#ffc928", blue:"#3985f7" };
const START: Record<Color,number> = { red:0, green:13, yellow:26, blue:39 };
const SAFE = new Set([0,8,13,21,26,34,39,47]);
const PATH = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
const LANES: Record<Color,number[][]> = {
  red:[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], green:[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow:[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], blue:[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};
const YARDS: Record<Color,number[][]> = {
  red:[[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]], green:[[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  yellow:[[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]], blue:[[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
};
const CENTERS: Record<Color,number[]> = { red:[7.15,6.45],green:[6.45,7.15],yellow:[7.15,7.85],blue:[7.85,7.15] };
const defaultPlayers = ():PlayerConfig[] => [
  {kind:"human",name:"Player 1"},{kind:"computer",name:"Emerald Bot"},{kind:"computer",name:"Gold Bot"},{kind:"computer",name:"Sapphire Bot"},
];
const freshPieces = () => COLORS.flatMap(color => [0,1,2,3].map(id => ({ color, id, progress:-1 })));

export default function Home(){
  const canvasRef=useRef<HTMLCanvasElement>(null); const audioRef=useRef<AudioContext|null>(null); const musicTimer=useRef<ReturnType<typeof setInterval>|null>(null);
  const piecesRef=useRef<Piece[]>(freshPieces()); const currentRef=useRef(0); const dieRef=useRef<number|null>(null); const canMoveRef=useRef(false);
  const configsRef=useRef<PlayerConfig[]>(defaultPlayers());
  const [pieces,setPieces]=useState(piecesRef.current); const [current,setCurrent]=useState(0); const [die,setDie]=useState<number|null>(null); const [rolling,setRolling]=useState(false);
  const [canMove,setCanMove]=useState(false); const [music,setMusic]=useState(true); const musicRef=useRef(true); const [winner,setWinner]=useState<Color|null>(null);
  const [configs,setConfigs]=useState(configsRef.current); const [draft,setDraft]=useState(defaultPlayers()); const [setup,setSetup]=useState(true);
  const [message,setMessage]=useState("Choose your players to begin");

  const tone=useCallback((freq:number,duration:number,type:OscillatorType="sine",volume=.035,delay=0)=>{const ctx=audioRef.current;if(!ctx||ctx.state!=="running")return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime+delay);g.gain.setValueAtTime(volume,ctx.currentTime+delay);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+delay+duration);o.connect(g).connect(ctx.destination);o.start(ctx.currentTime+delay);o.stop(ctx.currentTime+delay+duration);},[]);
  const ensureAudio=useCallback(()=>{if(!audioRef.current)audioRef.current=new AudioContext();void audioRef.current.resume();},[]);
  const stopMusic=useCallback(()=>{if(musicTimer.current)clearInterval(musicTimer.current);musicTimer.current=null;},[]);
  const startMusic=useCallback(()=>{if(musicTimer.current||!musicRef.current)return;const notes=[392,523.3,659.3,523.3,440,587.3,698.5,587.3];let i=0;const play=()=>{tone(notes[i%notes.length],.38,"triangle",.014);if(i%2===0)tone(notes[i%notes.length]/2,.55,"sine",.007);i++;};play();musicTimer.current=setInterval(play,520);},[tone]);
  useEffect(()=>()=>stopMusic(),[stopMusic]);
  const toggleMusic=()=>{ensureAudio();const next=!musicRef.current;musicRef.current=next;setMusic(next);if(next&&!setup)startMusic();else stopMusic();};
  const playerName=(index=currentRef.current)=>configsRef.current[index]?.name||LABELS[COLORS[index]];
  const isHuman=(index=currentRef.current)=>configsRef.current[index]?.kind==="human";
  const movable=useCallback((p:Piece,roll:number)=>p.color===COLORS[currentRef.current]&&((p.progress===-1&&roll===6)||(p.progress>=0&&p.progress<58&&p.progress+roll<=58)),[]);
  const resetBoard=useCallback((intro?:string)=>{const fresh=freshPieces();piecesRef.current=fresh;setPieces(fresh);currentRef.current=0;setCurrent(0);dieRef.current=null;setDie(null);canMoveRef.current=false;setCanMove(false);setWinner(null);setRolling(false);setMessage(intro||`${configsRef.current[0].name}, roll the dice!`);},[]);
  const nextTurn=useCallback((keep=false)=>{if(!keep){currentRef.current=(currentRef.current+1)%4;setCurrent(currentRef.current);}dieRef.current=null;setDie(null);canMoveRef.current=false;setCanMove(false);setMessage(`${configsRef.current[currentRef.current].name}, roll the dice!`);},[]);
  const rollDice=useCallback((automated=false)=>{if(setup||rolling||canMoveRef.current||winner||(!isHuman()&&!automated))return;ensureAudio();startMusic();setRolling(true);setMessage(`${playerName()} is rolling…`);[0,.052,.104,.156,.208,.26,.312].forEach((d,i)=>tone(125+i*38,.048,"square",.032,d));let t=0;const timer=setInterval(()=>{setDie(1+Math.floor(Math.random()*6));if(++t===10){clearInterval(timer);const result=1+Math.floor(Math.random()*6);dieRef.current=result;setDie(result);setRolling(false);tone(result===6?988:580+result*42,.22,"triangle",.06);if(result===6)tone(1318,.32,"sine",.04,.11);const options=piecesRef.current.filter(p=>movable(p,result));if(options.length){canMoveRef.current=true;setCanMove(true);setMessage(isHuman()?(result===6?"Awesome six! Choose a glowing piece":"Choose a glowing piece"):`${playerName()} is choosing…`);}else{setMessage("No legal move — next turn!");setTimeout(()=>nextTurn(result===6),850);}}},55);},[ensureAudio,movable,nextTurn,rolling,setup,startMusic,tone,winner]);
  const positionOf=useCallback((p:Piece):number[]=>{if(p.progress===-1)return YARDS[p.color][p.id];if(p.progress<52)return PATH[(START[p.color]+p.progress)%52];if(p.progress<58)return LANES[p.color][p.progress-52];const c=CENTERS[p.color];return[c[0]+(p.id%2)*.18,c[1]+Math.floor(p.id/2)*.18];},[]);
  const movePiece=useCallback((piece:Piece)=>{const roll=dieRef.current;if(!roll||!canMoveRef.current||!movable(piece,roll))return;ensureAudio();const next=piecesRef.current.map(p=>({...p}));const moving=next.find(p=>p.color===piece.color&&p.id===piece.id)!;moving.progress=moving.progress===-1?0:moving.progress+roll;for(let i=0;i<Math.min(roll,6);i++)tone(360+i*42,.055,"triangle",.028,i*.055);let captured=0;
    if(moving.progress<52){const global=(START[moving.color]+moving.progress)%52;if(!SAFE.has(global)){next.forEach(p=>{if(p.color!==moving.color&&p.progress>=0&&p.progress<52&&(START[p.color]+p.progress)%52===global){p.progress=-1;captured++;}});}}
    if(captured){tone(155,.28,"sawtooth",.055,.24);setMessage(`Boom! Captured ${captured} rival piece${captured>1?"s":""}!`);}else if(moving.progress===58){tone(880,.14,"sine",.05,.22);tone(1174,.3,"sine",.045,.34);setMessage("A piece made it home!");}else setMessage("Great move!");
    piecesRef.current=next;setPieces(next);canMoveRef.current=false;setCanMove(false);const won=next.filter(p=>p.color===moving.color&&p.progress===58).length===4;if(won){setWinner(moving.color);setMessage(`${playerName()} wins!`);tone(523,.16,"triangle",.06);tone(659,.16,"triangle",.06,.17);tone(784,.16,"triangle",.06,.34);tone(1047,.5,"triangle",.06,.51);return;}setTimeout(()=>nextTurn(roll===6||captured>0),650);},[ensureAudio,movable,nextTurn,tone]);

  useEffect(()=>{if(setup||winner||isHuman(current)||rolling)return;const timer=setTimeout(()=>{if(canMove&&die){const options=piecesRef.current.filter(p=>movable(p,die));const score=(p:Piece)=>{const destination=p.progress===-1?0:p.progress+die;if(destination===58)return 1000;let value=p.progress===-1?220:p.progress;if(destination>=0&&destination<52){const target=(START[p.color]+destination)%52;if(!SAFE.has(target)&&piecesRef.current.some(q=>q.color!==p.color&&q.progress>=0&&q.progress<52&&(START[q.color]+q.progress)%52===target))value+=500;}return value;};options.sort((a,b)=>score(b)-score(a));if(options[0])movePiece(options[0]);}else if(die===null)rollDice(true);},700);return()=>clearTimeout(timer);},[canMove,configs,current,die,movePiece,movable,rollDice,rolling,setup,winner]);

  useEffect(()=>{const canvas=canvasRef.current,ctx=canvas?.getContext("2d");if(!canvas||!ctx)return;const dpr=Math.min(devicePixelRatio,2);canvas.width=900*dpr;canvas.height=900*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const S=60;
    const cell=(r:number,c:number,fill="#fffaf0")=>{ctx.fillStyle=fill;ctx.fillRect(c*S,r*S,S,S);ctx.strokeStyle="#6f6478";ctx.lineWidth=1.6;ctx.strokeRect(c*S,r*S,S,S);};
    const circle=(x:number,y:number,r:number,fill:string,stroke="#fff",lw=3)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();};
    const draw=()=>{ctx.clearRect(0,0,900,900);ctx.fillStyle="#fff8e8";ctx.fillRect(0,0,900,900);for(let r=0;r<15;r++)for(let c=0;c<15;c++){const path=PATH.some(([rr,cc])=>rr===r&&cc===c);const lane=COLORS.find(k=>LANES[k].some(([rr,cc])=>rr===r&&cc===c));if(path||lane)cell(r,c,lane?PALETTE[lane]:"#fffaf2");}
      const yards:[Color,number,number][]=[["red",0,0],["green",0,9],["blue",9,0],["yellow",9,9]];yards.forEach(([color,r,c])=>{ctx.fillStyle=PALETTE[color];ctx.fillRect(c*S,r*S,6*S,6*S);ctx.fillStyle="rgba(255,255,255,.94)";ctx.beginPath();ctx.roundRect(c*S+48,r*S+48,264,264,34);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.65)";ctx.lineWidth=8;ctx.stroke();YARDS[color].forEach(([rr,cc])=>circle(cc*S+30,rr*S+30,34,"rgba(255,255,255,.72)",PALETTE[color],6));});
      const cx=450,cy=450;const palace:[Color,number][]=[["red",Math.PI],["green",-Math.PI/2],["yellow",0],["blue",Math.PI/2]];palace.forEach(([color,angle])=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,128,angle-Math.PI/4,angle+Math.PI/4);ctx.closePath();ctx.fillStyle=PALETTE[color];ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.stroke();});circle(cx,cy,39,"#ffd850","#fff",6);ctx.fillStyle="#75521a";ctx.font="bold 25px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("★",cx,cy+1);
      [0,13,26,39].forEach((idx,i)=>{const [r,c]=PATH[idx];cell(r,c,PALETTE[COLORS[i]]);ctx.fillStyle="#fff";ctx.font="25px Arial";ctx.fillText("★",c*S+30,r*S+31);});[8,21,34,47].forEach(idx=>{const [r,c]=PATH[idx];ctx.fillStyle="#ff9d2e";ctx.font="24px Arial";ctx.fillText("★",c*S+30,r*S+31);});
      const groups=new Map<string,Piece[]>();piecesRef.current.forEach(p=>{const [r,c]=positionOf(p),k=`${r},${c}`;groups.set(k,[...(groups.get(k)||[]),p]);});groups.forEach(group=>group.forEach((p,i)=>{const [r,c]=positionOf(p),n=group.length,offsets=n>1?[[-10,-10],[10,-10],[-10,10],[10,10]]:[[0,0]],o=offsets[i]||[0,0],x=c*S+30+o[0],y=r*S+30+o[1],active=canMoveRef.current&&!!dieRef.current&&movable(p,dieRef.current);ctx.save();ctx.shadowColor="rgba(56,39,86,.38)";ctx.shadowBlur=8;ctx.shadowOffsetY=9;circle(x,y+3,n>1?18:24,"#4b3a63","#fff",2);ctx.shadowOffsetY=5;circle(x,y,n>1?18:24,PALETTE[p.color],active?"#fff26a":"#fff",active?7:4);ctx.shadowColor="transparent";circle(x-6,y-7,n>1?5:8,"rgba(255,255,255,.55)","transparent",0);if(active){ctx.beginPath();ctx.arc(x,y,n>1?28:34,0,Math.PI*2);ctx.setLineDash([5,5]);ctx.strokeStyle="#fff34f";ctx.lineWidth=4;ctx.stroke();ctx.setLineDash([]);}ctx.restore();}));raf=requestAnimationFrame(draw);};let raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);},[pieces,canMove,movable,positionOf]);

  const boardClick=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!isHuman()||!canMoveRef.current||!dieRef.current)return;const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*900,y=(e.clientY-r.top)/r.height*900;const candidates=piecesRef.current.filter(p=>movable(p,dieRef.current!));let best:Piece|null=null,dist=48;for(const p of candidates){const [rr,cc]=positionOf(p),d=Math.hypot(x-(cc*60+30),y-(rr*60+30));if(d<dist){best=p;dist=d;}}if(best)movePiece(best);};
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.key===" "||e.key.toLowerCase()==="r")&&!setup){e.preventDefault();rollDice(false);}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[rollDice,setup]);
  const remaining=(color:Color)=>pieces.filter(p=>p.color===color&&p.progress===58).length;
  const updateDraft=(index:number,patch:Partial<PlayerConfig>)=>setDraft(old=>old.map((p,i)=>i===index?{...p,...patch}:p));
  const startGame=()=>{const clean=draft.map((p,i)=>({...p,name:p.name.trim()||(p.kind==="human"?`Player ${i+1}`:`${LABELS[COLORS[i]]} Bot`)}));configsRef.current=clean;setConfigs(clean);resetBoard(`${clean[0].name}, roll the dice!`);setSetup(false);ensureAudio();startMusic();};
  const openSetup=()=>{resetBoard("Choose your players to begin");setDraft(configs.map(p=>({...p})));setSetup(true);};

  return <main className="ludo-shell">
    <div className="sun"/><div className="cloud cloud-one"/><div className="cloud cloud-two"/><div className="bubble bubble-one"/><div className="bubble bubble-two"/>
    <header><div className="logo"><span>★</span><div><strong>ROYAL LUDO</strong><small>RACE • BUMP • WIN!</small></div></div><div className="header-actions"><button onClick={openSetup}>↻ <span>Players</span></button><button className={music?"on":""} onClick={toggleMusic}>{music?"♫":"♩"} <span>{music?"Music on":"Music off"}</span></button></div></header>
    <section className="players" aria-label="Players">{COLORS.map((c,i)=><div key={c} className={`${c} ${current===i&&!winner&&!setup?"active":""}`}><i>{i+1}</i><p><small>{configs[i].kind==="human"?"PLAYER":"COMPUTER"}</small><strong>{configs[i].name}</strong></p><b>{remaining(c)}<small>/4 HOME</small></b></div>)}</section>
    <section className="board-stage"><div className="board-shadow"/><canvas ref={canvasRef} onPointerDown={boardClick} className="ludo-board" aria-label="Interactive four player Ludo board"/><div className="leg one"/><div className="leg two"/></section>
    <aside className={`turn-card ${COLORS[current]}`}><span className="turn-dot"/><div><small>{winner?"GAME COMPLETE":`${configs[current].kind==="human"?"YOUR":"COMPUTER"} TURN`}</small><strong>{message}</strong></div></aside>
    <aside className="dice-panel"><div className={`die d${die||1} ${rolling?"rolling":""}`}>{Array.from({length:9},(_,i)=><i key={i}/>)}</div><div><small>LUCKY DICE</small><strong>{die?`${configs[current].name} rolled ${die}`:isHuman(current)?"Ready to roll!":"Computer thinking…"}</strong><span>{isHuman(current)?(canMove?"Tap a glowing piece":"Roll to move"):"Playing automatically"}</span></div><button onClick={()=>rollDice(false)} disabled={!isHuman(current)||rolling||canMove||!!winner||setup}>ROLL <kbd>R</kbd></button></aside>
    {setup&&<div className="setup-overlay"><section className="setup-card"><div className="setup-title"><span>🎲</span><div><small>GAME SETUP</small><h1>Who’s playing?</h1><p>Choose a player or computer for every color.</p></div></div><div className="setup-grid">{COLORS.map((color,i)=><div className={`setup-player ${color}`} key={color}><div className="color-token">{i+1}</div><div className="setup-fields"><strong>{LABELS[color]}</strong><div className="type-toggle"><button className={draft[i].kind==="human"?"selected":""} onClick={()=>updateDraft(i,{kind:"human"})}>👤 Player</button><button className={draft[i].kind==="computer"?"selected":""} onClick={()=>updateDraft(i,{kind:"computer",name:`${LABELS[color]} Bot`})}>🤖 Computer</button></div>{draft[i].kind==="human"&&<label><span>PLAYER NAME</span><input value={draft[i].name} maxLength={18} placeholder={`Player ${i+1}`} onChange={e=>updateDraft(i,{name:e.target.value})}/></label>}</div></div>)}</div><button className="start-game" onClick={startGame}>START GAME <span>➜</span></button><small className="setup-hint">Human players share this device and take turns.</small></section></div>}
    {winner&&<div className="victory"><div><span>🏆</span><small>SUPERSTAR WINNER</small><h1>{configs[COLORS.indexOf(winner)].name}</h1><p>All four pieces raced home!</p><button onClick={openSetup}>PLAY AGAIN</button></div></div>}
    <footer><span>ROLL A SIX TO LEAVE HOME</span><i/><span>BUMP RIVALS BACK</span><i/><span>GET ALL 4 HOME TO WIN</span></footer>
  </main>;
}
