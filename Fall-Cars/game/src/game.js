/**
 * Fall Cars - Complete Edition
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CFG = {
  GRID: 6, TILE: 3.2, GAP: 0.2, TILE_H: 0.5, PLATFORM_Y: 0,
  ROUND_TIME: 10, ANNOUNCE_MS: 2500, NUM_BOTS: 7,
  ENGINE_FORCE: 12, BRAKE_FORCE: 24, STEER_MAX: 1.2, STEER_SMOOTH: 8,
  LATERAL_GRIP: 7, DRIFT_GRIP: 2.2, ROLL_RESIST: 1.5, MAX_SPEED: 9, BOOST_MULT: 1.4,
  CAM_DIST: 3.5, CAM_HEIGHT: 2.2, CAM_FOV: 65, CAM_LAG: 5, CAM_LOOK_AHEAD: 2,
  COL_RADIUS: 1.2, COL_RESTITUTION: 0.7, COL_FRICTION: 0.3, COL_COOLDOWN: 0.25, COL_SPIN_FACTOR: 0.15,
  BOT_ENGINE: 0.85, BOT_REACT_DELAY: 0.3, BOT_STEER_SPEED: 6,
  ENGINE_BASE_FREQ: 55, ENGINE_TOP_FREQ: 160, CAR_SCALE: 0.5,
  TA_GRID: 8, TA_TIME: 10, // Time Attack
};

const COLORS = [
  { name:'Red', hex:0xe74c3c, css:'#e74c3c', dark:0xc0392b },
  { name:'Blue', hex:0x3498db, css:'#3498db', dark:0x2980b9 },
  { name:'Green', hex:0x2ecc71, css:'#2ecc71', dark:0x27ae60 },
  { name:'Yellow', hex:0xf1c40f, css:'#f1c40f', dark:0xf39c12 },
  { name:'Purple', hex:0x9b59b6, css:'#9b59b6', dark:0x8e44ad },
  { name:'Orange', hex:0xe67e22, css:'#e67e22', dark:0xd35400 },
  { name:'Pink', hex:0xff69b4, css:'#ff69b4', dark:0xc71585 },
  { name:'Cyan', hex:0x1abc9c, css:'#1abc9c', dark:0x16a085 },
];

const CAR_TINTS = [0xffffff,0xff4444,0x4488ff,0x44ee66,0xffaa00,0xcc44ff,0xff44cc,0x44ffee];
const CAR_MODELS = [
  'hatchback-sports','sedan-sports','sedan','race','race-future',
  'suv','suv-luxury','taxi','van','ambulance','delivery',
  'firetruck','garbage-truck','police','tractor','truck'
];
const carModelCache = {};
const BOT_NAMES = ['Nova','Blaze','Viper','Ghost','Storm','Echo','Titan'];
const BOT_FLAGS = ['🇺🇸','🇬🇧','🇯🇵','🇰🇷','🇫🇷','🇩🇪','🇧🇷','🇮🇳','🇨🇳','🇮🇹','🇪🇸','🇲🇽','🇷🇺','🇫🇷'];
const BOT_GENDERS = ['male','female'];

const AVATARS = [
  { id:'default',emoji:'🚗',name:'Rookie',free:true,cost:0 },{ id:'racer',emoji:'🏎️',name:'Racer',free:true,cost:0 },
  { id:'truck',emoji:'🚛',name:'Trucker',free:true,cost:0 },{ id:'taxi',emoji:'🚕',name:'Cabbie',free:true,cost:0 },
  { id:'police',emoji:'🚓',name:'Officer',free:false,cost:100 },{ id:'ambulance',emoji:'🚑',name:'Medic',free:false,cost:150 },
  { id:'fire',emoji:'🚒',name:'Firefighter',free:false,cost:200 },{ id:'rocket',emoji:'🚀',name:'Astro',free:false,cost:300 },
  { id:'ufo',emoji:'🛸',name:'Alien',free:false,cost:400 },{ id:'crown',emoji:'👑',name:'King',free:false,cost:500 },
  { id:'dragon',emoji:'🐉',name:'Dragon',free:false,cost:750 },{ id:'unicorn',emoji:'🦄',name:'Unicorn',free:false,cost:1000 },
];
const SHOP_CARS = [
  { id:'hatchback-sports',name:'Hatchback Sports',cost:0,model:'hatchback-sports' },
  { id:'sedan-sports',name:'Sports Sedan',cost:100,model:'sedan-sports' },
  { id:'sedan',name:'Classic Sedan',cost:200,model:'sedan' },
  { id:'race',name:'Race Car',cost:300,model:'race' },
  { id:'suv',name:'SUV',cost:400,model:'suv' },
  { id:'taxi',name:'Taxi',cost:150,model:'taxi' },
  { id:'van',name:'Van',cost:250,model:'van' },
  { id:'delivery',name:'Delivery Truck',cost:350,model:'delivery' },
  { id:'truck',name:'Pickup Truck',cost:300,model:'truck' },
  { id:'tractor',name:'Tractor',cost:200,model:'tractor' },
  { id:'race-future',name:'Future Racer',cost:500,model:'race-future' },
  { id:'suv-luxury',name:'Luxury SUV',cost:600,model:'suv-luxury' },
  { id:'police',name:'Police Car',cost:550,model:'police' },
  { id:'ambulance',name:'Ambulance',cost:350,model:'ambulance' },
  { id:'firetruck',name:'Fire Truck',cost:700,model:'firetruck' },
  { id:'garbage-truck',name:'Garbage Truck',cost:500,model:'garbage-truck' },
];
const ACHIEVEMENTS = [
  { id:'first_game',name:'First Ride',desc:'Play your first game',icon:'🏁',coins:10,check:s=>s.totalGamesPlayed>=1 },
  { id:'survive_3',name:'Survivor',desc:'Survive 3 rounds',icon:'🛡️',coins:20,check:s=>s.maxRoundsSurvived>=3 },
  { id:'win_game',name:'Champion',desc:'Win a game',icon:'🏆',coins:50,check:s=>s.totalWins>=1 },
  { id:'win_5',name:'Dominant',desc:'Win 5 games',icon:'💎',coins:100,check:s=>s.totalWins>=5 },
  { id:'play_10',name:'Veteran',desc:'Play 10 games',icon:'⭐',coins:30,check:s=>s.totalGamesPlayed>=10 },
  { id:'survive_5',name:'Unstoppable',desc:'Survive 5 rounds',icon:'🔥',coins:40,check:s=>s.maxRoundsSurvived>=5 },
  { id:'coins_500',name:'Rich',desc:'Accumulate 500 coins',icon:'💰',coins:15,check:s=>s.coins>=500 },
  { id:'buy_car',name:'Collector',desc:'Buy a new car',icon:'🛒',coins:10,check:s=>s.ownedCars.length>1 },
];
const TITLES = [
  { level:1,title:'Rookie',icon:'🟢' },{ level:5,title:'Apprentice',icon:'🔵' },
  { level:10,title:'Veteran',icon:'🟣' },{ level:20,title:'Elite',icon:'🔶' },
  { level:30,title:'Champion',icon:'🔴' },{ level:50,title:'Legend',icon:'🟤' },
  { level:75,title:'Mythic',icon:'⚜️' },{ level:100,title:'Immortal',icon:'💀' },
];
const MILESTONE_REWARDS = [
  { id:'win_10',icon:'🚘',name:'10 Wins',check:s=>s.totalWins>=10,model:'police',carName:'Police Car' },
  { id:'win_25',icon:'🏎️',name:'25 Wins',check:s=>s.totalWins>=25,model:'ambulance',carName:'Ambulance' },
  { id:'win_50',icon:'👑',name:'50 Wins',check:s=>s.totalWins>=50,model:'firetruck',carName:'Fire Truck' },
  { id:'win_100',icon:'💎',name:'100 Wins',check:s=>s.totalWins>=100,model:'garbage-truck',carName:'Garbage Truck' },
  { id:'lvl_25',icon:'⚡',name:'Level 25',check:s=>s.level>=25,model:'race-future',carName:'Future Racer' },
  { id:'lvl_50',icon:'🔥',name:'Level 50',check:s=>s.level>=50,model:'suv-luxury',carName:'Luxury SUV' },
  { id:'games_50',icon:'🎯',name:'50 Games',check:s=>s.totalGamesPlayed>=50,model:'truck',carName:'Pickup Truck' },
];

const ALL_QUESTS = [
  { id:'q_survive1',desc:'Survive 1 round',icon:'🛡️',need:1,key:'rounds',reward:20 },
  { id:'q_survive3',desc:'Survive 3 rounds',icon:'🔥',need:3,key:'rounds',reward:40 },
  { id:'q_win1',desc:'Win a game',icon:'🏆',need:1,key:'wins',reward:50 },
  { id:'q_play2',desc:'Play 2 games',icon:'🎮',need:2,key:'games',reward:30 },
  { id:'q_coins50',desc:'Earn 50 coins',icon:'<span class="coin-icon"></span>',need:50,key:'coins',reward:30 },
  { id:'q_bump3',desc:'Bump 3 cars',icon:'💥',need:3,key:'bumps',reward:25 },
  { id:'q_boost5',desc:'Use boost 5 times',icon:'⚡',need:5,key:'boost',reward:20 },
  { id:'q_drift10',desc:'Drift 10 times',icon:'🔄',need:10,key:'drifts',reward:25 },
  { id:'q_elim5',desc:'Eliminate 5 bots',icon:'💀',need:5,key:'kills',reward:35 },
  { id:'q_distance',desc:'Drive 200m',icon:'🏎️',need:200,key:'distance',reward:40 },
  { id:'q_lvl5',desc:'Reach level 5',icon:'⭐',need:5,key:'level',reward:45 },
  { id:'q_win3',desc:'Win 3 games total',icon:'👑',need:3,key:'totalWins',reward:55 },
  { id:'q_survive5',desc:'Survive 5 rounds total',icon:'💪',need:5,key:'totalRounds',reward:50 },
  { id:'q_play10',desc:'Play 10 games total',icon:'🎯',need:10,key:'totalGames',reward:60 },
];
const QUEST_KEYS = { rounds:'sessionRounds',wins:'sessionWins',games:'sessionGames',coins:'sessionCoins',
  bumps:'sessionBumps',boost:'sessionBoost',drifts:'sessionDrifts',kills:'sessionKills',
  distance:'sessionDistance',level:'level',totalWins:'totalWins',totalRounds:'maxRoundsSurvived',totalGames:'totalGamesPlayed' };

const DEFAULT_CONTROLS = { forward:'KeyW',backward:'KeyS',left:'KeyA',right:'KeyD',boost:'ShiftLeft',handbrake:'Space' };
const CTRL_LABELS = { forward:'Forward',backward:'Reverse',left:'Left',right:'Right',boost:'Boost',handbrake:'Handbrake/Drift' };

const LOADING_ART = ['🏎️','🏆','🚗','⭐','🔥','💎','👑','🛡️','🚀','🎯','💪','🌟','⚡','🎮'];
const LOADING_TIPS = [
  'Stay on the correct color when the timer runs out!',
  'Use Space to drift around tight corners.',
  'Hold Shift for a speed boost (uses more fuel).',
  'Bump other cars off the platform to eliminate them!',
  'Earn coins by surviving rounds and winning games.',
  'Complete daily quests for bonus coins!',
  'Unlock new cars and avatars in the shop.',
  'Higher levels unlock prestigious titles.',
  'Wrong color tiles fall — don\'t get caught on them!',
  'The platform shrinks as rounds progress.',
];

const DEFAULT_SAVE = {
  playerName:'',coins:50,selectedCar:'hatchback-sports',selectedAvatar:'default',
  ownedCars:['hatchback-sports'],ownedAvatars:['default','racer','truck','taxi'],
  achievements:[],totalGamesPlayed:0,totalWins:0,totalRoundsSurvived:0,
  maxRoundsSurvived:0,tutorialDone:false,
  xp:0,level:1,highScore:0,lastLoginDate:'',
  unlockedTitles:['Rookie'],selectedTitle:'Rookie',
  unlockedMilestones:[],
  dailyQuestDate:'',dailyQuests:[],dailyQuestProgress:{},
  shakeEnabled:true,controls:{...DEFAULT_CONTROLS},
  newItems:{shop:false,avatars:false,achievements:false},
  ratingDone:false,
  matchHistory:[],
};

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════

let saveData;
const G = {
  phase:'loading',round:1,color:null,players:[],keys:{},
  timerLeft:CFG.ROUND_TIME,activeColors:[],gameEnded:false,
  elimCheckDone:false,tileSize:CFG.TILE,coinsEarned:0,paused:false,
  mode:'classic', // classic | timeattack | suddendeath
  taFound:false, // time attack: found the unique tile?
  sdBroken:false, // sudden death: has player made a mistake?
  elimReason:'', // why the player was eliminated
  cameraPan:0, // pan timer for intro camera
  cameraPanFrom:null, // start position of pan
};
const SESSION = { roundsSurvived:0,gamesPlayed:0,gamesWon:0,coinsEarned:0,
  distanceDriven:0,carsBumped:0,boostUsed:0,driftsDone:0,kills:0,distance:0 };

// ═══════════════════════════════════════════════
//  SAVE SYSTEM
// ═══════════════════════════════════════════════

function loadSave() {
  try {
    const raw = localStorage.getItem('fallcars_save');
    saveData = raw ? JSON.parse(raw) : { ...DEFAULT_SAVE };
    // Merge defaults for any missing keys
    for (const k of Object.keys(DEFAULT_SAVE)) {
      if (!(k in saveData)) saveData[k] = DEFAULT_SAVE[k];
    }
    if (!saveData.controls) saveData.controls = { ...DEFAULT_CONTROLS };
    for (const k of Object.keys(DEFAULT_CONTROLS)) {
      if (!saveData.controls[k]) saveData.controls[k] = DEFAULT_CONTROLS[k];
    }
  } catch { saveData = JSON.parse(JSON.stringify(DEFAULT_SAVE)); }
}

function writeSave() {
  localStorage.setItem('fallcars_save', JSON.stringify(saveData));
  showSaveIndicator();
}

function showSaveIndicator() {
  const el = document.getElementById('save-indicator');
  if (!el) return;
  el.style.opacity = '1';
  el.style.animation = 'spin .5s linear 2';
  clearTimeout(el._saveTimer);
  el._saveTimer = setTimeout(() => { el.style.opacity = '0'; el.style.animation = ''; }, 1000);
}

function addCoins(n, showFloat = true) {
  saveData.coins += n; writeSave(); updateMenuCoins();
  if (showFloat && n > 0) spawnFloatingNumber(`+${n}`, 30+Math.random()*40, 40+Math.random()*20, '#ffd700');
}

function updateMenuCoins() {
  ['menu-coins','menu-wins','menu-level','menu-highscore'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const map = { 'menu-coins':saveData.coins, 'menu-wins':saveData.totalWins, 'menu-level':saveData.level, 'menu-highscore':saveData.highScore };
    el.textContent = map[id] ?? 0;
  });
  // Update avatar circle emoji
  const avPreview = document.getElementById('avatar-emoji-preview');
  if (avPreview) {
    const av = AVATARS.find(a => a.id === saveData.selectedAvatar);
    avPreview.textContent = av ? av.emoji : '🚗';
  }
}

// ═══════════════════════════════════════════════
//  XP / LEVEL
// ═══════════════════════════════════════════════

function addXP(amount) {
  saveData.xp += amount;
  spawnFloatingNumber(`+${amount} XP`, 45+Math.random()*10, 55+Math.random()*10, '#a78bfa');
  while (saveData.xp >= 100) {
    saveData.xp -= 100; saveData.level++;
    for (const t of TITLES) {
      if (saveData.level >= t.level && !saveData.unlockedTitles.includes(t.title)) {
        saveData.unlockedTitles.push(t.title);
        showToast(t.icon, `Title Unlocked: ${t.title}!`); playUnlock();
      }
    }
    const banner = document.getElementById('levelup-banner');
    if (banner) {
      banner.querySelector('.lvl-number').textContent = saveData.level;
      banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
      playWin();
    }
  }
  checkQuestProgress('level');
  writeSave(); updateMenuCoins();
}

// ═══════════════════════════════════════════════
//  HIGH SCORE / DAILY LOGIN
// ═══════════════════════════════════════════════

function checkHighScore(rounds) {
  if (rounds > saveData.highScore) {
    saveData.highScore = rounds; writeSave();
    showToast('🏆', `New High Score: ${rounds} rounds!`);
    // Show New Record banner
    const nr = document.getElementById('new-record-banner');
    const ns = document.getElementById('nr-score');
    if(nr&&ns){
      ns.textContent = `${rounds} rounds`;
      nr.classList.remove('show'); void nr.offsetWidth; nr.classList.add('show');
      setTimeout(()=>nr.classList.remove('show'),3000);
    }
    spawnConfetti(40);
    return true;
  } return false;
}

function checkDailyLogin() {
  const today = new Date().toISOString().slice(0,10);
  if (saveData.lastLoginDate !== today) {
    saveData.lastLoginDate = today; addCoins(100);
    showToast('🎁', 'Daily Login Bonus: +100 coins!'); playCoin(); return true;
  } return false;
}

// ═══════════════════════════════════════════════
//  ACHIEVEMENTS / MILESTONES
// ═══════════════════════════════════════════════

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (saveData.achievements.includes(a.id)) return;
    if (a.check(saveData)) {
      saveData.achievements.push(a.id); saveData.coins += a.coins; writeSave();
      showToast(a.icon, `${a.name} unlocked! +${a.coins} coins`); playUnlock();
      markNewItem('achievements');
    }
  });
}

function checkMilestones() {
  MILESTONE_REWARDS.forEach(m => {
    if (saveData.unlockedMilestones.includes(m.id)) return;
    if (m.check(saveData)) {
      saveData.unlockedMilestones.push(m.id);
      if (m.model && !saveData.ownedCars.includes(m.model)) {
        saveData.ownedCars.push(m.model);
      }
      addCoins(50); writeSave();
      showToast(m.icon, `Milestone: ${m.name} — ${m.carName||'Car'} unlocked!`); playUnlock();
      markNewItem('shop');
    }
  });
}

// ═══════════════════════════════════════════════
//  DAILY QUESTS
// ═══════════════════════════════════════════════

function seededRandom(seed) {
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() { s = (s*16807)%2147483647; return (s-1)/2147483646; };
}

function getDailyQuests() {
  const today = new Date().toISOString().slice(0,10);
  const seed = today.split('-').reduce((a,b) => a*31+parseInt(b), 0);
  const rng = seededRandom(seed);
  return [...ALL_QUESTS].sort(() => rng()-0.5).slice(0, 3);
}

function initDailyQuests() {
  const today = new Date().toISOString().slice(0,10);
  if (saveData.dailyQuestDate !== today) {
    saveData.dailyQuestDate = today;
    saveData.dailyQuests = getDailyQuests();
    saveData.dailyQuestProgress = {};
    saveData.dailyQuests.forEach(q => saveData.dailyQuestProgress[q.id]=0);
    writeSave();
  }
}

function checkQuestProgress(key, amount = 1) {
  if (!saveData.dailyQuestProgress) return;
  let dirty=false;
  saveData.dailyQuests.forEach(q => {
    if (saveData.dailyQuestProgress[q.id] >= q.need) return;
    if (q.key === key || (q.key==='level'&&key==='level') || (q.key==='totalWins'&&key==='totalWins') ||
        (q.key==='totalRounds'&&key==='totalRounds') || (q.key==='totalGames'&&key==='totalGames')) {
      saveData.dailyQuestProgress[q.id] = Math.min(q.need, (saveData.dailyQuestProgress[q.id]||0)+amount);
      dirty=true;
      if (saveData.dailyQuestProgress[q.id] >= q.need) {
        addCoins(q.reward);
        showToast('✅', `Quest complete: ${q.desc}! +${q.reward} coins`); playCoin();
      }
    }
  });
  if(dirty){writeSave();renderQuestScreen();}
}

// ═══════════════════════════════════════════════
//  THREE.JS SETUP
// ═══════════════════════════════════════════════

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.insertBefore(renderer.domElement, document.body.firstChild);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d2b);
scene.fog = new THREE.FogExp2(0x0d0d2b, 0.03);

const camera = new THREE.PerspectiveCamera(CFG.CAM_FOV, innerWidth/innerHeight, 0.1, 500);
const camState = { pos:new THREE.Vector3(0,CFG.CAM_HEIGHT,CFG.CAM_DIST), look:new THREE.Vector3(), yaw:0 };

window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ═══════════════════════════════════════════════
//  LIGHTS
// ═══════════════════════════════════════════════

function buildLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
  sun.position.set(12,25,15); sun.castShadow = true;
  Object.assign(sun.shadow.mapSize, {width:2048,height:2048});
  Object.assign(sun.shadow.camera, {left:-40,right:40,top:40,bottom:-40,near:0.5,far:100});
  sun.shadow.bias = -0.001; scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x3355aa, 0x111122, 0.6));
}

// ═══════════════════════════════════════════════
//  PLATFORM
// ═══════════════════════════════════════════════

const tiles = [];
const tileRoot = new THREE.Group();

function buildPlatform(numColors, tileSize) {
  numColors = numColors || COLORS.length;
  tileSize = tileSize || CFG.TILE;
  G.tileSize = tileSize; G.activeColors = [];
  for (let i = 0; i < numColors; i++) G.activeColors.push(i);
  const gap = CFG.GAP, step = tileSize + gap;
  const offset = (CFG.GRID - 1) * step * 0.5;
  const indices = [];
  const perColor = Math.ceil(CFG.GRID * CFG.GRID / numColors);
  for (let c = 0; c < numColors; c++) for (let k = 0; k < perColor; k++) indices.push(c);
  for (let i = indices.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [indices[i],indices[j]] = [indices[j],indices[i]]; }
  let n = 0;
  for (let row = 0; row < CFG.GRID; row++) {
    for (let col = 0; col < CFG.GRID; col++) {
      const ci = indices[n++ % indices.length];
      const c = COLORS[ci], wx = col*step-offset, wz = row*step-offset;
      const geo = new THREE.BoxGeometry(tileSize, CFG.TILE_H, tileSize);
      const mat = new THREE.MeshStandardMaterial({color:c.hex,roughness:0.3,metalness:0.15});
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wx, CFG.PLATFORM_Y+CFG.TILE_H*0.5, wz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      tileRoot.add(mesh);
      tiles.push({mesh,colorIdx:ci,worldX:wx,worldZ:wz,falling:false,fallen:false,fallVel:0});
    }
  }
  scene.add(tileRoot);
}

// Time Attack: build a large grid with ONE tile of a different color
function buildTimeAttackPlatform() {
  const grid = CFG.TA_GRID;
  // Tile size grows each round: round 1 = 1.5x, round 2 = 3.5x, round 3 = 5.5x...
  G.tileSize = CFG.TILE * (1.5 + (G.round - 1) * 2.0);
  const gap = CFG.GAP * 0.5, step = G.tileSize + gap;
  const offset = (grid-1) * step * 0.5;
  // Pick 2 colors: main color and the odd one
  const mainIdx = Math.floor(Math.random() * COLORS.length);
  let oddIdx;
  do { oddIdx = Math.floor(Math.random() * COLORS.length); } while (oddIdx === mainIdx);
  const oddPos = { row: Math.floor(Math.random()*grid), col: Math.floor(Math.random()*grid) };
  G.color = oddIdx; // The target
  G.activeColors = [mainIdx, oddIdx];
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      const isOdd = row === oddPos.row && col === oddPos.col;
      const ci = isOdd ? oddIdx : mainIdx;
      const c = COLORS[ci], wx = col*step-offset, wz = row*step-offset;
      const geo = new THREE.BoxGeometry(G.tileSize, CFG.TILE_H, G.tileSize);
      const mat = new THREE.MeshStandardMaterial({color:c.hex,roughness:0.3,metalness:0.15});
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wx, CFG.PLATFORM_Y+CFG.TILE_H*0.5, wz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      tileRoot.add(mesh);
      tiles.push({mesh,colorIdx:ci,worldX:wx,worldZ:wz,falling:false,fallen:false,fallVel:0});
    }
  }
  scene.add(tileRoot);
}

function resetTiles() {
  tiles.length = 0;
  while (tileRoot.children.length) tileRoot.remove(tileRoot.children[0]);
  if (G.mode === 'timeattack') { buildTimeAttackPlatform(); return; }
  const numColors = Math.min(3+Math.floor(G.round/2), COLORS.length);
  const tileSize = Math.max(4.0-(G.round-1)*0.25, 2.5);
  buildPlatform(numColors, tileSize);
}

function getTilesByColor(ci) { return tiles.filter(t => t.colorIdx===ci && !t.fallen); }

function dropWrongTiles(safeIdx) {
  if (G.mode === 'suddendeath') {
    // In sudden death: all wrong tiles drop immediately
    tiles.forEach(t => {
      if (t.colorIdx !== safeIdx && !t.fallen && !t.falling) {
        t.falling = true;
        G.players.forEach(p => {
          if (p.eliminated || !p.onPlatform) return;
          const dx = Math.abs(p.group.position.x-t.worldX), dz = Math.abs(p.group.position.z-t.worldZ);
          if (dx<G.tileSize*0.5 && dz<G.tileSize*0.5) {
            const pt = getPlayerTile(p);
            if (pt && pt.colorIdx !== safeIdx) triggerFall(p);
          }
        });
      }
    });
    return;
  }
  tiles.forEach(t => {
    if (t.colorIdx !== safeIdx && !t.fallen && !t.falling) {
      setTimeout(() => {
        t.falling = true;
        G.players.forEach(p => {
          if (p.eliminated || !p.onPlatform) return;
          const dx = Math.abs(p.group.position.x-t.worldX), dz = Math.abs(p.group.position.z-t.worldZ);
          if (dx<G.tileSize*0.5 && dz<G.tileSize*0.5) {
            const pt = getPlayerTile(p);
            if (pt && pt.colorIdx !== safeIdx) triggerFall(p);
          }
        });
      }, Math.random()*900);
    }
  });
}

function updateTiles(dt) {
  tiles.forEach(t => {
    if (!t.falling || t.fallen) return;
    t.fallVel += 18*dt;
    t.mesh.position.y -= t.fallVel*dt;
    t.mesh.rotation.x += 0.6*dt; t.mesh.rotation.z += 0.35*dt;
    if (t.mesh.position.y < -30) { t.fallen = true; t.mesh.visible = false; }
  });
}

// ═══════════════════════════════════════════════
//  SKYBOX
// ═══════════════════════════════════════════════

function buildSkybox() {
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(2000*3);
  for (let i = 0; i < 2000; i++) {
    const r = 200+Math.random()*80, t = Math.random()*Math.PI*2, p = Math.random()*Math.PI;
    sp[i*3]=r*Math.sin(p)*Math.cos(t); sp[i*3+1]=r*Math.cos(p); sp[i*3+2]=r*Math.sin(p)*Math.sin(t);
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff,size:0.5,sizeAttenuation:true})));
}

// ═══════════════════════════════════════════════
//  CAR / LABEL
// ═══════════════════════════════════════════════

async function loadCarModels() {
  const loader = new GLTFLoader();
  const base = 'assets/models/';
  const fixModelMaterials = (root) => {
    root.traverse(child => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(mat => {
        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      });
    });
  };
  await Promise.allSettled(CAR_MODELS.map(name => new Promise(resolve => {
    loader.load(`${base}${name}.glb`, gltf => {
      fixModelMaterials(gltf.scene);
      carModelCache[name] = gltf.scene;
      resolve();
    }, undefined, () => resolve());
  })));
}

function makeCar(isPlayer, modelName, tintHex = 0xffffff) {
  if (!modelName || !carModelCache[modelName]) {
    if (modelName && !carModelCache[modelName]) modelName = null;
    modelName = modelName || Object.keys(carModelCache)[0] || null;
  }
  const original = carModelCache[modelName];
  if (!original) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(1,0.5,2), new THREE.MeshStandardMaterial({color:0xffffff}));
    m.position.y=0.25; g.add(m);
    return g;
  }

  // Deep clone so each car has unique materials (needed for wheel rotation, per-car state)
  const root = original.clone(true);
  const wheelMeshes = [];

  root.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      const lname = child.name.toLowerCase();
      if (lname.includes('wheel') || lname.includes('tire')) {
        wheelMeshes.push(child);
      } else if (lname.includes('body')) {
        child.material = child.material.clone();
        child.material.color.setHex(tintHex);
      }
    }
  });
  root.userData.wheelMeshes = wheelMeshes;

  return root;
}

function getPlayerTitle() {
  let best = 'Rookie';
  for (const t of TITLES) { if (saveData.unlockedTitles.includes(t.title)) best = t.title; }
  return best;
}

function createNameSprite(name, flag, gender, tintHex, title) {
  const canvas = document.createElement('canvas');
  canvas.width=320; canvas.height=72;
  const ctx = canvas.getContext('2d');
  const tc = '#'+tintHex.toString(16).padStart(6,'0');
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.beginPath(); ctx.roundRect(6,8,308,56,24); ctx.fill();
  ctx.strokeStyle=tc; ctx.lineWidth=2; ctx.stroke();
  const gi=gender==='male'?'♂':'♀', gc=gender==='male'?'#6cb4ff':'#ff88cc';
  const dn=title?`${title} ${name}`:name;
  ctx.font='bold 20px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#fff'; ctx.fillText(`${flag} ${dn} ${gi}`,160,36);
  const tw=ctx.measureText(`${flag} ${dn}`).width;
  ctx.fillStyle=gc; ctx.fillText(gi,160+tw/2+10,36);
  const tex=new THREE.CanvasTexture(canvas); tex.minFilter=THREE.LinearFilter;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  sp.scale.set(2.4,0.54,1); sp.position.y=1.8;
  return sp;
}

// ═══════════════════════════════════════════════
//  PLAYER / SPAWN
// ═══════════════════════════════════════════════

function makePlayer(id, name, modelName, isHuman, px, pz) {
  const group = new THREE.Group();
  group.position.set(px, CFG.PLATFORM_Y+CFG.TILE_H, pz);
  scene.add(group);
  const modelIdx = CAR_MODELS.indexOf(modelName);
  const tint = CAR_TINTS[modelIdx >= 0 ? modelIdx % CAR_TINTS.length : 0];
  const carMesh = makeCar(isHuman, modelName, tint);
  carMesh.scale.setScalar(CFG.CAR_SCALE);
  group.add(carMesh);
  // Drop shadow (dark oval on the ground)
  const shadowGeo = new THREE.CircleGeometry(0.7, 16);
  const shadowMat = new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.3,depthWrite:false});
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI/2;
  shadow.position.y = -CFG.TILE_H * 0.4;
  group.add(shadow);
  return {
    id,name,tint,isHuman,group,carMesh,
    heading:0,steer:0,speed:0,velX:0,velZ:0,
    eliminated:false,onPlatform:true,roundSafe:false,
    fallVel:0,fallAngVelX:(Math.random()-0.5)*3,fallAngVelZ:(Math.random()-0.5)*3,
    botTarget:null,botTimer:Math.random()*CFG.BOT_REACT_DELAY,
    engineNode:null,engineGain:null,lastSpeed:0,colCooldown:0,
    label:null,flag:'',gender:'',title:'',
  };
}

function spawnPositions(n) {
  const total = CFG.GRID*(CFG.TILE+CFG.GAP);
  const r = total*0.3;
  return Array.from({length:n}, (_,i)=>{const a=(i/n)*Math.PI*2; return {x:Math.cos(a)*r,z:Math.sin(a)*r};});
}

function spawnPlayers() {
  G.players.forEach(p => { scene.remove(p.group); if(p.label) p.group.remove(p.label); });
  G.players.length = 0;
  const numBots = G.mode === 'timeattack' ? 0 : CFG.NUM_BOTS;
  const total = numBots + 1;
  const pos = spawnPositions(total);
  const playerModel = SHOP_CARS.find(c=>c.id===saveData.selectedCar)?.model||'hatchback-sports';
  G.players.push(makePlayer(0, saveData.playerName||'YOU', playerModel, true, pos[0].x, pos[0].z));
  for (let i = 0; i < numBots; i++) {
    const p = pos[i+1];
    const bot = makePlayer(i+1, BOT_NAMES[i], CAR_MODELS[i % CAR_MODELS.length], false, p.x, p.z);
    bot.flag = BOT_FLAGS[Math.floor(Math.random()*BOT_FLAGS.length)];
    bot.gender = BOT_GENDERS[Math.floor(Math.random()*BOT_GENDERS.length)];
    const bt = TITLES.map(t=>t.title);
    bot.title = bt[Math.floor(Math.random()*bt.length)];
    const label = createNameSprite(bot.name, bot.flag, bot.gender, bot.tint, bot.title);
    bot.group.add(label); bot.label = label;
    G.players.push(bot);
  }
  updateLeaderboard();
}

function respawnAlive() {
  const alive = G.players.filter(p=>!p.eliminated);
  const pos = spawnPositions(alive.length);
  alive.forEach((p,i)=>{
    p.group.position.set(pos[i].x, CFG.PLATFORM_Y+CFG.TILE_H, pos[i].z);
    p.group.rotation.set(0,0,0);
    p.speed=0; p.velX=0; p.velZ=0; p.steer=0;
    p.onPlatform=true; p.fallVel=0; p.roundSafe=false;
    p.botTarget=null; p.botTimer=Math.random()*CFG.BOT_REACT_DELAY;
    p.group.visible=true;
  });
}

// ═══════════════════════════════════════════════
//  AUDIO
// ═══════════════════════════════════════════════

const AC = new (window.AudioContext||window.webkitAudioContext)();
let masterGain, sfxGain, musicGain;

function initAudio() {
  masterGain = AC.createGain(); masterGain.gain.value = 0.7; masterGain.connect(AC.destination);
  sfxGain = AC.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(masterGain);
  musicGain = AC.createGain(); musicGain.gain.value = 0.7; musicGain.connect(masterGain);
  // Apply saved volumes
  if (masterGain) masterGain.gain.value = (saveData.masterVol??0.7)*0.7;
  if (sfxGain) sfxGain.gain.value = (saveData.sfxVol??0.7)*0.7;
  if (musicGain) musicGain.gain.value = (saveData.musicVol??0.7)*0.7;
}

function resumeAC() { if (AC.state === 'suspended') AC.resume(); }

function beep(freq=440,dur=0.12,type='sine',vol=0.3) {
  resumeAC();
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(vol, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime+dur);
  o.connect(g); g.connect(sfxGain); o.start(); o.stop(AC.currentTime+dur);
}

function startEngine(player) {
  resumeAC();
  const vol=player.isHuman?0.12:0.05;
  const o1=AC.createOscillator(); o1.type='sawtooth';
  const o2=AC.createOscillator(); o2.type='triangle';
  const o3=AC.createOscillator(); o3.type='square';
  const g=AC.createGain();
  o1.frequency.value=CFG.ENGINE_BASE_FREQ; o2.frequency.value=CFG.ENGINE_BASE_FREQ*2; o3.frequency.value=CFG.ENGINE_BASE_FREQ*0.5;
  g.gain.value=vol; o1.connect(g); o2.connect(g); o3.connect(g);
  g.connect(musicGain); o1.start(); o2.start(); o3.start();
  player.engineNode=[o1,o2,o3]; player.engineFreqNode=o1.frequency; player.engineFreqNode2=o2.frequency; player.engineFreqNode3=o3.frequency;
  player.engineGain=g;
}

function stopEngine(player) {
  if (!player.engineNode) return;
  player.engineGain.gain.setTargetAtTime(0.001, AC.currentTime, 0.08);
  player.engineNode.forEach(o=>{try{o.stop(AC.currentTime+0.3);}catch(e){}});
  player.engineNode=null;
}

function updateEngineSound(player) {
  if (!player.engineNode) return;
  const spd=Math.abs(player.speed)/CFG.MAX_SPEED;
  const tf=CFG.ENGINE_BASE_FREQ+spd*(CFG.ENGINE_TOP_FREQ-CFG.ENGINE_BASE_FREQ);
  player.engineFreqNode.setTargetAtTime(tf, AC.currentTime, 0.05);
  player.engineFreqNode2.setTargetAtTime(tf*2, AC.currentTime, 0.05);
  player.engineFreqNode3.setTargetAtTime(tf*0.5+2, AC.currentTime, 0.05);
  const acc=Math.abs(player.speed-(player.lastSpeed||0));
  player.engineGain.gain.setTargetAtTime((player.isHuman?0.12:0.05)+Math.min(acc*0.08,0.12), AC.currentTime, 0.03);
}

function playCrash(vol=0.6) {
  resumeAC();
  const buf=AC.createBuffer(1, AC.sampleRate*0.3, AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
  const src=AC.createBufferSource(), g=AC.createGain(), flt=AC.createBiquadFilter();
  flt.type='lowpass'; flt.frequency.value=600; src.buffer=buf;
  g.gain.setValueAtTime(vol, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime+0.35);
  src.connect(flt); flt.connect(g); g.connect(sfxGain); src.start();
}

function playBump(impactSpeed) {
  if (impactSpeed<2) { beep(800,0.05,'sine',0.2); }
  else if (impactSpeed<5) { beep(400,0.1,'square',0.3); playCrash(0.3); }
  else { playCrash(0.7); }
}

function playCountdown(n) {
  if(n===0)[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.15,'sine',0.45),i*65));
  else beep(n===1?300:420,0.22,'sine',0.55);
}
function playAnnounce(){beep(880,0.08,'sine',0.4);setTimeout(()=>beep(1047,0.14,'sine',0.4),110);}
function playSafe(){[523,659,784].forEach((f,i)=>setTimeout(()=>beep(f,0.13,'sine',0.35),i*75));}
function playElim(){[200,175,155,130].forEach((f,i)=>setTimeout(()=>beep(f,0.15,'sawtooth',0.55),i*85));}
function playWin(){[523,659,784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>beep(f,0.22,'sine',0.5),i*110));}
function playClick(){beep(600,0.06,'sine',0.3);}
function playCoin(){beep(1200,0.08,'sine',0.3);setTimeout(()=>beep(1600,0.1,'sine',0.3),80);}
function playUnlock(){[800,1000,1200,1600].forEach((f,i)=>setTimeout(()=>beep(f,0.12,'sine',0.4),i*80));}
function playHover(){beep(800,0.02,'sine',0.06);}
function playChaChing(){setTimeout(()=>beep(1047,0.08,'sine',0.25),0);setTimeout(()=>beep(1319,0.12,'sine',0.3),100);setTimeout(()=>beep(1568,0.2,'sine',0.35),200);}

// ═══════════════════════════════════════════════
//  BACKGROUND MUSIC
// ═══════════════════════════════════════════════

let bgMusicNodes = null;

// ═══════════════════════════════════════════════
//  CAR PREVIEW (separate renderer on UI canvas)
// ═══════════════════════════════════════════════

let previewRenderer = null, previewScene = null, previewCamera = null, previewCar = null;

function initPreviewRenderer() {
  const canvas = document.getElementById('car-preview-canvas');
  if (!canvas) return;
  previewRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  previewRenderer.setSize(400, 280);
  previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  previewRenderer.toneMappingExposure = 1.2;

  previewScene = new THREE.Scene();
  previewCamera = new THREE.PerspectiveCamera(35, 400/280, 0.1, 100);
  previewCamera.position.set(3, 2.5, 4);
  previewCamera.lookAt(0, 0.5, 0);

  // Lighting for preview
  previewScene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl = new THREE.DirectionalLight(0xfff4e0, 1.8);
  dl.position.set(5, 8, 5);
  previewScene.add(dl);
  previewScene.add(new THREE.HemisphereLight(0x3355aa, 0x111122, 0.4));

  // Ground circle
  const groundGeo = new THREE.CircleGeometry(1.5, 32);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.8, transparent: true, opacity: 0.3 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -0.01;
  previewScene.add(ground);

  createPreviewCar();
}

function createPreviewCar() {
  if (!previewScene) return;
  if (previewCar) { previewScene.remove(previewCar); previewCar = null; }
  const modelName = SHOP_CARS.find(c => c.id === saveData.selectedCar)?.model || 'hatchback-sports';
  previewCar = makeCar(false, modelName);
  previewCar.scale.setScalar(1.1);
  previewScene.add(previewCar);
}

function updatePreviewCar() { createPreviewCar(); }

function renderPreviewCar(t) {
  if (!previewRenderer || !previewCar) return;
  previewCar.rotation.y = t * 1.2;
  previewCar.position.y = 0.5 + Math.sin(t * 1.5) * 0.08;
  previewRenderer.render(previewScene, previewCamera);
}

// ═══════════════════════════════════════════════
//  PRE-RENDERED CAR SPRITES (for garage grid)
// ═══════════════════════════════════════════════

const CAR_SPRITES={}; // { modelName: [canvas, canvas, ...] }
const CAR_SPRITE_SIZE=100;
const CAR_SPRITE_FRAMES=8;

function preRenderCarSprites(){
  const w=CAR_SPRITE_SIZE,h=Math.round(CAR_SPRITE_SIZE*0.6);
  const offCanvas=document.createElement('canvas');
  offCanvas.width=w; offCanvas.height=h;
  const r=new THREE.WebGLRenderer({canvas:offCanvas,alpha:true,antialias:true});
  r.setSize(w,h);
  r.toneMapping=THREE.ACESFilmicToneMapping;
  r.toneMappingExposure=1.2;

  const sc=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(30,w/h,0.1,100);
  cam.position.set(2.5,1.8,3.2);
  cam.lookAt(0,0.25,0);

  sc.add(new THREE.AmbientLight(0xffffff,0.7));
  const dl=new THREE.DirectionalLight(0xfff4e0,2.0);
  dl.position.set(4,6,4); sc.add(dl);
  sc.add(new THREE.HemisphereLight(0x3355aa,0x111122,0.5));

  CAR_MODELS.forEach(name=>{
    const frames=[];
    const car=makeCar(false,name);
    car.scale.setScalar(0.45);
    car.position.y=0.3;
    sc.add(car);

    for(let i=0;i<CAR_SPRITE_FRAMES;i++){
      car.rotation.y=(i/CAR_SPRITE_FRAMES)*Math.PI*2;
      r.render(sc,cam);
      const fc=document.createElement('canvas');
      fc.width=w; fc.height=h;
      fc.getContext('2d').drawImage(offCanvas,0,0);
      frames.push(fc);
    }
    sc.remove(car);
    CAR_SPRITES[name]=frames;
  });
  r.dispose();
}

let shopIntervals=[];

function startShopAnimations(){
  stopShopAnimations();
  const grids=document.querySelectorAll('.shop-grid canvas[data-model]');
  grids.forEach(cv=>{
    const model=cv.dataset.model;
    const frames=CAR_SPRITES[model];
    if(!frames||!frames.length)return;
    let f=0;
    const ctx=cv.getContext('2d');
    const iv=setInterval(()=>{
      if(document.getElementById('shop-screen')?.classList.contains('hidden'))return;
      ctx.clearRect(0,0,cv.width,cv.height);
      ctx.drawImage(frames[f%frames.length],0,0,cv.width,cv.height);
      f++;
    },120);
    shopIntervals.push(iv);
  });
}

function stopShopAnimations(){
  shopIntervals.forEach(iv=>clearInterval(iv));
  shopIntervals=[];
}

function startBgMusic() {
  if (bgMusicNodes) return;
  resumeAC();
  // Create a simple ambient pad
  const pad1 = AC.createOscillator(); pad1.type='sawtooth'; pad1.frequency.value=55;
  const pad2 = AC.createOscillator(); pad2.type='triangle'; pad2.frequency.value=110;
  const pad3 = AC.createOscillator(); pad3.type='sine'; pad3.frequency.value=165;
  const filter = AC.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=300; filter.Q.value=1;
  const gain = AC.createGain(); gain.gain.value=0.04;
  pad1.connect(filter); pad2.connect(filter); pad3.connect(filter);
  filter.connect(gain); gain.connect(musicGain);
  // Subtle rhythmic pulse
  const pulse = AC.createOscillator(); pulse.type='sine'; pulse.frequency.value=2;
  const pulseGain = AC.createGain(); pulseGain.gain.value=0.015;
  const lfo = AC.createGain();
  pulse.connect(lfo); lfo.gain.value=0.03;
  lfo.connect(gain.gain);
  pulseGain.connect(musicGain);
  const noise = AC.createBufferSource();
  const nb = AC.createBuffer(1, AC.sampleRate*4, AC.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i=0;i<nd.length;i++) nd[i]=(Math.random()-0.5)*0.003;
  noise.buffer=nb; noise.loop=true;
  const nf = AC.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=200; nf.Q.value=0.5;
  noise.connect(nf); nf.connect(musicGain);
  pad1.start(); pad2.start(); pad3.start(); pulse.start(); noise.start();
  bgMusicNodes = {pad1,pad2,pad3,pulse,noise,gain,filter,nf,pulseGain,lfo};
}

function stopBgMusic() {
  if (!bgMusicNodes) return;
  Object.values(bgMusicNodes).forEach(n=>{try{if(n.stop)n.stop();if(n.disconnect)n.disconnect();}catch(e){}});
  bgMusicNodes = null;
}

// ═══════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════

const particles = [];

function explosion(x,y,z,color) {
  for(let i=0;i<20;i++){
    const size=0.12+Math.random()*0.25;
    const geo=new THREE.BoxGeometry(size,size,size);
    const mat=new THREE.MeshStandardMaterial({color:Math.random()>0.45?color:0xff8800,emissive:Math.random()>0.45?color:0xff5500,emissiveIntensity:2});
    const mesh=new THREE.Mesh(geo,mat); mesh.position.set(x,y,z); scene.add(mesh);
    const vel=new THREE.Vector3((Math.random()-0.5)*12,3+Math.random()*8,(Math.random()-0.5)*12);
    const ang=new THREE.Vector3((Math.random()-0.5)*15,(Math.random()-0.5)*15,(Math.random()-0.5)*15);
    particles.push({mesh,vel,ang,life:0,max:0.8+Math.random()*0.6});
  }
  const fl=new THREE.PointLight(0xff6600,6,14); fl.position.set(x,y+1,z); scene.add(fl);
  setTimeout(()=>scene.remove(fl),220);
}

function driftSmoke(x,y,z) {
  const geo=new THREE.SphereGeometry(0.08,4,4);
  const mat=new THREE.MeshBasicMaterial({color:0xcccccc,transparent:true,opacity:0.6});
  const mesh=new THREE.Mesh(geo,mat); mesh.position.set(x,y,z); scene.add(mesh);
  particles.push({mesh,vel:new THREE.Vector3((Math.random()-0.5)*2,1+Math.random(),(Math.random()-0.5)*2),ang:new THREE.Vector3(),life:0,max:0.5});
}

function updateParticles(dt) {
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; p.life+=dt; const t=p.life/p.max;
    if(t>=1){scene.remove(p.mesh);p.mesh.geometry.dispose();particles.splice(i,1);continue;}
    p.vel.y-=14*dt; p.mesh.position.addScaledVector(p.vel,dt);
    p.mesh.rotation.x+=p.ang.x*dt; p.mesh.rotation.y+=p.ang.y*dt; p.mesh.rotation.z+=p.ang.z*dt;
    p.mesh.material.opacity=1-t; p.mesh.material.transparent=true; p.mesh.scale.setScalar(1-t*0.5);
  }
}

// ═══════════════════════════════════════════════
//  PHYSICS
// ═══════════════════════════════════════════════

function physicsStep(p, dt, throttle, brake, steerInput, handbrake) {
  if (!p.onPlatform || p.eliminated) return;
  const sf = 1 - Math.abs(p.speed)/CFG.MAX_SPEED*0.4;
  const st = steerInput*CFG.STEER_MAX*sf;
  p.steer += (st-p.steer)*Math.min(1, dt*CFG.STEER_SMOOTH);
  p.heading += p.speed*p.steer*dt*0.65;
  const fx=Math.sin(p.heading), fz=Math.cos(p.heading);
  p.speed += throttle*CFG.ENGINE_FORCE*dt;
  p.speed -= brake*CFG.BRAKE_FORCE*dt*Math.sign(p.speed||1);
  p.speed *= Math.pow(1-CFG.ROLL_RESIST*dt, 1);
  const ms=CFG.MAX_SPEED*(handbrake?0.5:1);
  if (p.speed>ms) p.speed=ms; if (p.speed<-ms*0.85) p.speed=-ms*0.85;
  const ivx=fx*p.speed, ivz=fz*p.speed;
  const grip=handbrake?CFG.DRIFT_GRIP:CFG.LATERAL_GRIP;
  const lr=Math.min(1,grip*dt);
  p.velX+=(ivx-p.velX)*lr; p.velZ+=(ivz-p.velZ)*lr;
  p.group.position.x+=p.velX*dt; p.group.position.z+=p.velZ*dt;
  const acc=throttle-brake*Math.sign(p.speed||1)*0.5;
  p.carMesh.rotation.x=THREE.MathUtils.lerp(p.carMesh.rotation.x, -acc*0.04, dt*8);
  p.carMesh.rotation.z=THREE.MathUtils.lerp(p.carMesh.rotation.z, -steerInput*Math.abs(p.speed)*0.02, dt*8);
  p.carMesh.rotation.y=p.heading;
  if (p.carMesh.userData?.wheelMeshes) {
    const spin=p.speed*2.5*dt;
    p.carMesh.userData.wheelMeshes.forEach(w=>w.rotation.x+=spin);
  }
  if (handbrake && Math.abs(p.speed)>3 && p.isHuman && Math.random()<0.4) {
    driftSmoke(p.group.position.x+(Math.random()-0.5)*0.5, CFG.PLATFORM_Y+CFG.TILE_H+0.1, p.group.position.z+(Math.random()-0.5)*0.5);
    if(!p._lastDriftFrame||p._lastDriftFrame<performance.now()-100){SESSION.driftsDone=(SESSION.driftsDone||0)+1;p._lastDriftFrame=performance.now();}
  }
  // Session tracking
  if (p.isHuman) {
    if (throttle>1 && (!p._boosted||p._boosted<performance.now()-100)){SESSION.boostUsed=(SESSION.boostUsed||0)+1;p._boosted=performance.now();}
    if (Math.abs(throttle)>0||Math.abs(brake)>0) {
      SESSION.distance=(SESSION.distance||0)+Math.hypot(p.velX,p.velZ)*dt;
      checkQuestProgress('distance', Math.hypot(p.velX,p.velZ)*dt);
    }
  }
  const gridSize = G.mode === 'timeattack' ? CFG.TA_GRID : CFG.GRID;
  const half=(gridSize*(G.tileSize+CFG.GAP))*0.5+0.5;
  if (Math.abs(p.group.position.x)>half || Math.abs(p.group.position.z)>half) triggerFall(p);
  if (p.onPlatform) p.group.position.y=CFG.PLATFORM_Y+CFG.TILE_H;
  updateEngineSound(p); p.lastSpeed=p.speed;
}

// ═══════════════════════════════════════════════
//  COLLISIONS
// ═══════════════════════════════════════════════

function handleCollisions(dt) {
  const alive=G.players.filter(p=>p.onPlatform&&!p.eliminated);
  if(alive.length<2)return;
  alive.forEach(p=>{p.colCooldown=Math.max(0,p.colCooldown-dt);});
  for(let i=0;i<alive.length;i++){
    for(let j=i+1;j<alive.length;j++){
      const a=alive[i],b=alive[j];
      if(a.colCooldown>0||b.colCooldown>0)continue;
      const dx=b.group.position.x-a.group.position.x,dz=b.group.position.z-a.group.position.z;
      const dist=Math.hypot(dx,dz);
      if(dist<CFG.COL_RADIUS&&dist>0.01){
        const nx=dx/dist,nz=dz/dist;
        const rvx=b.velX-a.velX,rvz=b.velZ-a.velZ;
        const rvn=rvx*nx+rvz*nz;
        if(rvn<0){
          const imp=Math.abs(rvn);
          const impulse=-(1+CFG.COL_RESTITUTION)*rvn/2;
          a.velX-=impulse*nx; a.velZ-=impulse*nz;
          b.velX+=impulse*nx; b.velZ+=impulse*nz;
          const tx=-nz,tz=nx, rvt=rvx*tx+rvz*tz, fric=rvt*CFG.COL_FRICTION;
          a.velX+=fric*tx; a.velZ+=fric*tz;
          b.velX-=fric*tx; b.velZ-=fric*tz;
          const sa=imp*CFG.COL_SPIN_FACTOR;
          a.heading+=(Math.random()-0.5)*sa; b.heading+=(Math.random()-0.5)*sa;
          a.speed*=0.92; b.speed*=0.92;
          const overlap=CFG.COL_RADIUS-dist;
          a.group.position.x-=nx*overlap*0.5; a.group.position.z-=nz*overlap*0.5;
          b.group.position.x+=nx*overlap*0.5; b.group.position.z+=nz*overlap*0.5;
          a.colCooldown=CFG.COL_COOLDOWN; b.colCooldown=CFG.COL_COOLDOWN;
          playBump(imp);
          const human=G.players.find(p=>p.isHuman);
          // If human bumps a bot hard, mark for kill tracking
          if(human&&a!==human&&imp>4){a._bumpedByHuman=true;a._bumpTime=performance.now();}
          if(human&&b!==human&&imp>4){b._bumpedByHuman=true;b._bumpTime=performance.now();}
          if(human&&human.group.visible&&(a===human||b===human)&&imp>3){triggerShake(imp*0.6);if(imp>6)triggerFlash();}
          if(imp>5){const mx=(a.group.position.x+b.group.position.x)/2,mz=(a.group.position.z+b.group.position.z)/2;explosion(mx,CFG.PLATFORM_Y+CFG.TILE_H+0.3,mz,0xffaa00);}
          SESSION.carsBumped=(SESSION.carsBumped||0)+1; checkQuestProgress('bumps');
          // Sudden Death: any collision = loss
          if (G.mode==='suddendeath' && human && (a===human||b===human) && imp>2) {
            triggerFall(human);
          }
        }
      }
    }
  }
}

function triggerFall(p) {
  if (!p.onPlatform) return;
  p.onPlatform = false;
  const speed=Math.hypot(p.velX,p.velZ);
  if(p.isHuman){triggerShake(Math.min(speed*0.8+4,12));triggerFlash();}
  const fx=Math.sin(p.heading),fz=Math.cos(p.heading);
  const df=p.velX*fx+p.velZ*fz, dl=p.velX*(-fz)+p.velZ*fx;
  p.fallAngVelX=(df>0?-1:1)*(2+Math.abs(df)*0.5);
  p.fallAngVelZ=(dl>0?1:-1)*(2+Math.abs(dl)*0.5);
  p.group.rotation.y=p.heading;
  p.fallVel=5+speed*0.4;
  // Sudden Death: falling = instant game over
  if (G.mode==='suddendeath' && p.isHuman) {
    G.sdBroken = true;
    setTimeout(() => {
      if (!p.eliminated) eliminatePlayer(p, 'suddendeath');
      endGame(G.players.find(q=>q.isHuman&&!q.eliminated));
    }, 400);
  }
}

function updateFalling(p, dt) {
  if(p.onPlatform)return;
  if(p.group.position.y<-10&&p.eliminated)return;
  p.fallVel+=22*dt; p.group.position.y-=p.fallVel*dt;
  p.group.rotation.x+=p.fallAngVelX*dt; p.group.rotation.z+=p.fallAngVelZ*dt;
  p.speed*=0.92;
  if(p.group.position.y<-30){
    if(p.roundSafe){
      // Already won the round — falling doesn't eliminate, next round resets position
      p.onPlatform = false; // keep falling visually
      p.group.visible = true; // stay visible
    } else if(!p.eliminated){
      eliminatePlayer(p,'fell');
      p.group.visible=false;
      stopEngine(p);
    }
  }
}

// ═══════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════

function setupInput() {
  window.addEventListener('keydown', e => { G.keys[e.code]=true; resumeAC(); });
  window.addEventListener('keyup', e => { G.keys[e.code]=false; });
  window.addEventListener('keydown', e => {
    if (e.code==='Escape') {
      e.preventDefault();
      if (G.phase==='playing'||G.phase==='eliminating'||G.phase==='announce') {
        if (G.paused) resumeGame(); else pauseGame();
      }
    }
  });
}

function humanInput(player) {
  const k = G.keys;
  const c = saveData.controls || DEFAULT_CONTROLS;
  // Support both custom keys and arrow keys
  const forward = k[c.forward] || k.ArrowUp;
  const backward = k[c.backward] || k.ArrowDown;
  const boost = k[c.boost] || k.ShiftLeft;
  const left = k[c.left] || k.ArrowLeft;
  const right = k[c.right] || k.ArrowRight;
  const handbrake = k[c.handbrake] || k.Space;
  let throttle=0,brake=0;
  if (forward) { throttle=boost?CFG.BOOST_MULT:1.0; brake=0; }
  else if (backward) {
    if (player.speed>1.0) { brake=1.0; throttle=-0.5; }
    else if (player.speed>0.3) { brake=0.6; throttle=-1.0; }
    else { throttle=-1.5; brake=0; }
  }
  const steerInput = left ? 1 : right ? -1 : 0;
  return {throttle,brake,steerInput,handbrake:!!handbrake};
}

// ═══════════════════════════════════════════════
//  BOT AI
// ═══════════════════════════════════════════════

function bestTile(colorIdx) {
  const ts=getTilesByColor(colorIdx);
  return ts.length?ts[Math.floor(Math.random()*ts.length)]:null;
}

function botInput(bot, dt) {
  if(!bot.onPlatform||bot.eliminated)return {throttle:0,brake:0,steerInput:0,handbrake:false};
  bot.botTimer-=dt;
  if(!bot.botTarget||bot.botTimer<=0||bot.botTarget.fallen){
    if(G.color!==null)bot.botTarget=bestTile(G.color);
    bot.botTimer=CFG.BOT_REACT_DELAY*0.5+Math.random()*CFG.BOT_REACT_DELAY;
  }
  if(!bot.botTarget){
    // Survival mode: steer toward center to avoid falling off
    const half=(CFG.GRID*(G.tileSize+CFG.GAP))*0.5-1;
    const cx=0-bot.group.position.x,cz=0-bot.group.position.z;
    const cdist=Math.hypot(cx,cz);
    if(cdist>half*0.5){
      const desired=Math.atan2(cx,cz);
      let diff=desired-bot.heading;
      while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
      const si=Math.max(-1,Math.min(1,diff*CFG.BOT_STEER_SPEED*0.8));
      return {throttle:0.6,brake:0,steerInput:si,handbrake:false};
    }
    return {throttle:0.6,brake:0,steerInput:0,handbrake:false};
  }
  const tx=bot.botTarget.worldX,tz=bot.botTarget.worldZ;
  const dx=tx-bot.group.position.x,dz=tz-bot.group.position.z;
  const dist=Math.hypot(dx,dz);
  if(dist<0.6)return {throttle:0,brake:0.5,steerInput:0,handbrake:false};
  const desired=Math.atan2(dx,dz);
  let diff=desired-bot.heading;
  while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
  const si=Math.max(-1,Math.min(1,diff*CFG.BOT_STEER_SPEED*0.5));
  const t=Math.min(1,dist*0.3)*CFG.BOT_ENGINE;
  return {throttle:t,brake:0,steerInput:si,handbrake:Math.abs(diff)>Math.PI*0.7};
}

// ═══════════════════════════════════════════════
//  CAMERA
// ═══════════════════════════════════════════════

function updateCamera(dt) {
  const human=G.players.find(p=>p.isHuman);
  if(!human)return;
  // Slow camera pan on game start
  if(G.cameraPan>0){
    G.cameraPan-=dt;
    if(!G.cameraPanFrom){
      G.cameraPanFrom=new THREE.Vector3(0,CFG.CAM_HEIGHT+15,CFG.CAM_DIST*5);
      camState.pos.copy(G.cameraPanFrom);
    }
    const t=Math.max(0,Math.min(1,1-G.cameraPan/3)); // 0→1 over 3 seconds
    const e=1-Math.pow(1-t,3); // ease out cubic
    const target=new THREE.Vector3(human.group.position.x,human.group.position.y+CFG.CAM_HEIGHT,human.group.position.z+CFG.CAM_DIST);
    camState.pos.lerpVectors(G.cameraPanFrom,target,e);
    camera.position.copy(camState.pos);
    camera.lookAt(human.group.position.x,human.group.position.y+0.5,human.group.position.z);
    return;
  }
  G.cameraPanFrom=null;
  camState.yaw=lerp_angle(camState.yaw,human.heading,dt*CFG.CAM_LAG);
  const bx=-Math.sin(camState.yaw)*CFG.CAM_DIST,bz=-Math.cos(camState.yaw)*CFG.CAM_DIST;
  const ip=new THREE.Vector3(human.group.position.x+bx,human.group.position.y+CFG.CAM_HEIGHT,human.group.position.z+bz);
  camState.pos.lerp(ip,Math.min(1,dt*CFG.CAM_LAG));
  const so=applyShake();
  camera.position.copy(camState.pos).add(so);
  const lt=new THREE.Vector3(human.group.position.x+Math.sin(human.heading)*CFG.CAM_LOOK_AHEAD*0.5,human.group.position.y+0.5,human.group.position.z+Math.cos(human.heading)*CFG.CAM_LOOK_AHEAD*0.5);
  camState.look.lerp(lt,Math.min(1,dt*CFG.CAM_LAG*1.3));
  camera.lookAt(camState.look);
}

function lerp_angle(a,b,t){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*Math.min(1,t);}

// ═══════════════════════════════════════════════
//  ELIMINATION
// ═══════════════════════════════════════════════

function getPlayerTile(player) {
  let best=null,bestD=Infinity;
  tiles.forEach(t=>{
    if(t.fallen)return;
    const d=Math.abs(player.group.position.x-t.worldX)+Math.abs(player.group.position.z-t.worldZ);
    if(d<bestD){bestD=d;best=t;}
  });
  return(bestD<G.tileSize)?best:null;
}

function eliminatePlayer(p,reason) {
  if(p.eliminated)return;
  p.eliminated=true; stopEngine(p);
  // Track kills: bot eliminated by human bump
  if(!p.isHuman&&p._bumpedByHuman&&(performance.now()-p._bumpTime||0)<3000){
    SESSION.kills=(SESSION.kills||0)+1;
    checkQuestProgress('kills');
  }
  if(p.isHuman) {
    const reasons = {
      fell:'You fell off the platform!', nowhere:'You fell between tiles!',
      time:'You ran out of time!', wrong:'Wrong color tile!',
      bump:'You got knocked off!', suddendeath:'One mistake — game over!',
    };
    G.elimReason = reasons[reason] || 'You were eliminated!';
    showBanner('#elim-banner','ELIMINATED!');playElim();
    document.getElementById('spectating').classList.add('visible');
  }
  explosion(p.group.position.x,p.group.position.y+0.5,p.group.position.z,p.tint);
  playCrash(0.7);
  updateLeaderboard();updateHUD();
}

async function checkWrongColor() {
  const alive=G.players.filter(p=>!p.eliminated&&p.onPlatform);
  alive.forEach(p=>{const t=getPlayerTile(p);if(!t)eliminatePlayer(p,'nowhere');});

  const human=G.players.find(p=>p.isHuman);
  if(human&&!human.eliminated&&human.onPlatform){
    const ht=getPlayerTile(human);
    if(ht&&ht.colorIdx===G.color){
      human.roundSafe=true;
      showBanner('#safe-banner','SAFE!');playSafe();addCoins(10);addXP(10);
      saveData.totalRoundsSurvived++; saveData.maxRoundsSurvived=Math.max(saveData.maxRoundsSurvived,saveData.totalRoundsSurvived);
      SESSION.roundsSurvived=(SESSION.roundsSurvived||0)+1;
      checkQuestProgress('rounds'); checkQuestProgress('totalRounds');
      writeSave();
    }
    // Time Attack: found the unique tile
    if (G.mode==='timeattack' && ht && ht.colorIdx===G.color) {
      G.taFound = true;
    }
  }

  // Mark all players on correct tiles as safe for this round
  if (G.mode === 'classic') {
    G.players.forEach(p => {
      if (!p.eliminated && p.onPlatform) {
        const pt = getPlayerTile(p);
        if (pt && pt.colorIdx === G.color) p.roundSafe = true;
      }
    });
  }

  if (G.mode==='timeattack') {
    if (G.taFound) {
      // Found the unique tile → advance to next round
      G.taFound = false;
      G.round++;
      checkHighScore(G.round);
      showBanner('#safe-banner', 'SAFE!');
      playSafe();
      addCoins(15); addXP(15);
      saveData.totalRoundsSurvived++;
      saveData.maxRoundsSurvived=Math.max(saveData.maxRoundsSurvived,saveData.totalRoundsSurvived);
      SESSION.roundsSurvived=(SESSION.roundsSurvived||0)+1;
      checkQuestProgress('rounds'); checkQuestProgress('totalRounds');
      writeSave();
      await wait(1500);
      resetTiles();
      respawnAlive();
      checkAchievements(); checkMilestones();
      G.taCurrentMax = CFG.TA_TIME + (G.round - 1) * 5;
      updateHUD();
      document.getElementById('color-target').classList.add('visible');
      startTimer(G.taCurrentMax);
      return;
    } else {
      // Time ran out without finding tile → LOSE
      setTimeout(() => {
        eliminatePlayer(human, 'time');
        endGame(null);
      }, 500);
      return;
    }
  }

  setTimeout(()=>dropWrongTiles(G.color),200);
  if (G.mode === 'suddendeath') {
    // In sudden death, round ends immediately after color check
    setTimeout(() => checkRoundEnd(), 500);
  } else {
    setTimeout(() => checkRoundEnd(), 3200);
  }
}

async function checkRoundEnd() {
  const alive=G.players.filter(p=>!p.eliminated);
  if(alive.length<=1){endGame(alive[0]||null);return;}
  showRoundResult();
  // AUTO ADVANCE: show result for 2.5s then auto-next
  await wait(2500);
  const human=G.players.find(p=>p.isHuman);
  if (human && !human.eliminated) {
    document.getElementById('btn-next')?.click();
  } else if (human && human.eliminated) {
    // Spectate auto
    document.getElementById('btn-spectate')?.click();
  }
}

// ═══════════════════════════════════════════════
//  GAME FLOW
// ═══════════════════════════════════════════════

async function runCountdown() {
  // Start slow camera pan
  G.cameraPan=3; G.cameraPanFrom=null;
  G.phase='countdown'; showOverlay('countdown');
  const el=document.getElementById('cd-number');
  for(const n of[3,2,1,0]){
    el.classList.remove('pop','go');
    el.textContent=n===0?'GO!':String(n);
    if(n===0)el.classList.add('go');
    void el.offsetWidth; el.classList.add('pop');
    playCountdown(n);
    await wait(n===0?900:700);
  }
  showOverlay(null);
  newRound();
}

function newRound() {
  if (G.mode === 'timeattack') {
    // Time Attack: progressive rounds — +5s each round
    G.taCurrentMax = CFG.TA_TIME + (G.round - 1) * 5;
    updateHUD();
    document.getElementById('color-target').classList.add('visible');
    startTimer(G.taCurrentMax);
    return;
  }
  const available=G.activeColors.length>0?G.activeColors:COLORS.map((_,i)=>i);
  G.color=available[Math.floor(Math.random()*available.length)];
  updateHUD(); announceColor();
}

async function announceColor() {
  G.phase='announce';
  const c=COLORS[G.color];
  document.getElementById('ann-swatch').style.cssText=`background:${c.css};box-shadow:0 0 28px ${c.css}`;
  document.getElementById('ann-name').style.color=c.css;
  typewriterEffect(document.getElementById('ann-name'), c.name, 40);
  flashCorrectTiles();
  showOverlay('announce-overlay'); playAnnounce();
  setTimeout(()=>{showOverlay(null);startTimer();},CFG.ANNOUNCE_MS);
}

function flashCorrectTiles() {
  tiles.forEach(t=>{
    if(t.colorIdx===G.color&&!t.fallen){
      t.mesh.material.emissive=new THREE.Color(COLORS[G.color].hex);
      t.mesh.material.emissiveIntensity=0.8;
      setTimeout(()=>{t.mesh.material.emissive=new THREE.Color(0);t.mesh.material.emissiveIntensity=0;},700);
    }
  });
}

function startTimer(taMaxTime) {
  G.phase='playing';
  G.taCurrentMax = G.mode==='timeattack' ? (taMaxTime||CFG.TA_TIME) : CFG.ROUND_TIME;
  G.timerLeft=G.taCurrentMax;
  G.elimCheckDone=false;
  document.getElementById('timer-wrap').classList.add('visible');
  G.players.forEach(p=>{if(!p.eliminated)startEngine(p);});
}

async function showRoundResult() {
  G.phase='round-result';
  const alive=G.players.filter(p=>!p.eliminated);
  const human=G.players.find(p=>p.isHuman);
  const ha=human&&!human.eliminated;
  document.getElementById('rr-msg').textContent=ha?'You survived!':'Eliminated';
  document.getElementById('rr-msg').style.color=ha?'#4ade80':'#ff4444';
  document.getElementById('rr-sub').textContent=ha?`${alive.length} players remain • +10 coins`:'Want to keep watching?';
  document.getElementById('btn-next').style.display=ha?'':'none';
  document.getElementById('rr-elim-actions').style.display=ha?'none':'flex';
  if (ha) document.getElementById('btn-spectate').style.display='none';
  showOverlay('round-result');
  G.players.forEach(p=>stopEngine(p));
}

async function endGame(winner) {
  if(G.gameEnded)return;
  G.gameEnded=true; G.phase='gameover';
  G.players.forEach(p=>stopEngine(p));
  document.getElementById('timer-wrap').classList.remove('visible');
  const isH=winner?.isHuman;
  document.getElementById('go-title').textContent=isH?'Champion!':(G.elimReason||'Game Over');
  document.getElementById('go-winner').textContent=winner?(isH?'YOU WIN!':winner.name):(isH?'YOU WIN!':G.elimReason||'Time Up!');
  document.getElementById('go-winner').style.color=isH?'#ffd700':'#ff6b35';
  let ce=5,xe=5;
  if(isH){ce+=50;xe+=50;saveData.totalWins++;}
  ce+=G.round*2; xe+=G.round*3;
  addCoins(ce); addXP(xe);
  saveData.totalGamesPlayed++; writeSave();
  checkHighScore(saveData.maxRoundsSurvived);
  document.getElementById('go-sub').textContent=`${G.round} round${G.round>1?'s':''} played`;
  const coinEl=document.getElementById('go-coins');
  if(coinEl){coinEl.textContent='0';animateRollingCount(coinEl,0,ce,1200);}
  spawnFloatingNumber(`+${xe} XP`,50,60,'#a78bfa');
  // Save match history (last 5)
  const matchEntry={date:new Date().toLocaleDateString(),mode:G.mode,rounds:G.round,survived:saveData.totalRoundsSurvived,won:!!isH,coins:ce};
  if(!saveData.matchHistory)saveData.matchHistory=[];
  saveData.matchHistory.unshift(matchEntry);
  if(saveData.matchHistory.length>5)saveData.matchHistory.length=5;
  writeSave();
  // XP circle animation
  updateXpCircle();
  // Celebration screen on win
  if(isH){
    showOverlay('celebration');playWin();
    setTimeout(()=>{
      showOverlay('gameover');
      spawnConfetti(80);triggerFlash();
      // Rating popup after 5 games (once)
      if(saveData.totalGamesPlayed>=5&&!saveData.ratingDone){
        setTimeout(()=>{showOverlay('rating-popup');},800);
      }
    },2500);
  } else {
    showOverlay('gameover');playWin();
  }
  if(isH){SESSION.gamesWon++;}
  SESSION.gamesPlayed++;
  checkQuestProgress('wins',isH?1:0); checkQuestProgress('totalWins'); checkQuestProgress('totalGames'); checkQuestProgress('games');
  setTimeout(()=>{checkAchievements();checkMilestones();},500);

  if (window.GameBoxIntegration && window.__gameboxSession?.matchActive) {
    window.GameBoxIntegration.submitGameResult({
      isWinner: !!isH,
      score: G.round,
      reason: isH ? "completed" : "forfeit",
      stats: { mode: G.mode, rounds: G.round },
    });
  }
}

function resetGame(toMenu=false) {
  G.round=1; G.color=null; G.timerLeft=CFG.ROUND_TIME; G.gameEnded=false;
  G.coinsEarned=0; G.taFound=false; G.sdBroken=false;
  G.players.forEach(p=>{stopEngine(p);scene.remove(p.group);}); G.players.length=0;
  particles.forEach(p=>{scene.remove(p.mesh);}); particles.length=0;
  resetTiles();
  spawnPlayers();
  document.getElementById('timer-wrap').classList.remove('visible');
  document.getElementById('spectating').classList.remove('visible');
  document.getElementById('color-target').classList.remove('visible');
  saveData.totalRoundsSurvived=0;
  updateHUD(); updateLeaderboard();
  if(toMenu){showOverlay('splash');updateMenuCoins();}
  else runCountdown();
}

// ═══════════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════════

function updateHUD() {
  document.getElementById('round-num').textContent=G.round;
  const alive=G.players.filter(p=>!p.eliminated).length;
  document.getElementById('alive-num').textContent=alive;
  const ct=document.getElementById('color-target');
  if(G.color!==null){
    const c=COLORS[G.color];
    document.getElementById('ct-swatch').style.cssText=`background:${c.css};box-shadow:0 0 16px ${c.css}`;
    document.getElementById('ct-name').textContent=c.name; document.getElementById('ct-name').style.color=c.css;
    ct.classList.add('visible');
  }else{ct.classList.remove('visible');}
}

function updateLeaderboard() {
  const list=document.getElementById('lb-list'); list.innerHTML='';
  const sorted=[...G.players].sort((a,b)=>a.eliminated?1:-1);
  sorted.forEach((p,i)=>{
    const div=document.createElement('div');
    div.className='lb-row'+(p.eliminated?' dead':'')+(p.isHuman?' me':'');
    const hex='#'+p.tint.toString(16).padStart(6,'0');
    const title=p.isHuman?getPlayerTitle():(p.title||'');
    const dn=title?`[${title}] ${p.name}`:p.name;
    div.innerHTML=`<div class="lb-dot" style="background:${hex}"></div><span>${i===0&&!p.eliminated?'👑 ':''}${dn}</span>`;
    list.appendChild(div);
  });
}

function updateTimerHUD(left,max) {
  document.getElementById('timer-num').textContent=Math.ceil(left);
  document.getElementById('timer-fill').style.width=`${(left/max)*100}%`;
  const el=document.getElementById('timer-num');
  if(left<=3){document.getElementById('timer-fill').style.background='#ff4444';el.classList.add('danger');}
  else if(left<=5){document.getElementById('timer-fill').style.background='#ffaa00';el.classList.remove('danger');}
  else{document.getElementById('timer-fill').style.background='#4ade80';el.classList.remove('danger');}
}

// ═══════════════════════════════════════════════
//  OVERLAYS / BANNER / TOAST
// ═══════════════════════════════════════════════

function showOverlay(id) {
  document.querySelectorAll('.overlay').forEach(el=>el.classList.add('hidden'));
  if(id)document.getElementById(id).classList.remove('hidden');
}

function showBanner(selector,text) {
  const el=document.querySelector(selector);
  el.textContent=text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2500);
}

function showToast(icon,text) {
  const t=document.getElementById('toast');
  t.querySelector('.toast-icon').textContent=icon; t.querySelector('.toast-text').textContent=text;
  t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000);
}

// ═══════════════════════════════════════════════
//  EFFECTS
// ═══════════════════════════════════════════════

let shakeIntensity=0; const shakeDecay=8;
function triggerShake(i){if(!saveData.shakeEnabled)return;shakeIntensity=Math.max(shakeIntensity,i);}
function applyShake(){if(shakeIntensity<=0)return new THREE.Vector3();const sx=(Math.random()-0.5)*shakeIntensity*0.12,sy=(Math.random()-0.5)*shakeIntensity*0.12;shakeIntensity=Math.max(0,shakeIntensity-shakeDecay*0.016);return new THREE.Vector3(sx,sy,0);}
function triggerFlash(){if(!saveData.shakeEnabled)return;const el=document.getElementById('screen-flash');if(!el)return;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}

function typewriterEffect(element,text,speed=25,callback=null){
  if(!element)return;element.textContent='';let i=0;const c=document.createElement('span');c.className='typewriter-cursor';element.appendChild(c);
  function tick(){if(i<text.length){element.insertBefore(document.createTextNode(text[i]),c);i++;setTimeout(tick,speed);}else{if(c.parentNode)c.remove();if(callback)callback();}}tick();
}

function fadeToBlack(d=250){return new Promise(r=>{const o=document.getElementById('fade-overlay');if(!o){r();return;}o.classList.add('active');setTimeout(r,d);});}
function fadeFromBlack(d=250){return new Promise(r=>{const o=document.getElementById('fade-overlay');if(!o){r();return;}o.classList.remove('active');setTimeout(r,d);});}

function spawnConfetti(c=60){
  const con=document.getElementById('confetti-container');if(!con)return;
  const cols=['#ff6b35','#ffd700','#4ade80','#a78bfa','#ff4444','#4488ff','#ff69b4','#1abc9c'];
  for(let i=0;i<c;i++){const p=document.createElement('div');p.className='confetti-piece';const co=cols[Math.floor(Math.random()*cols.length)],sz=6+Math.random()*8,sx=Math.random()*100,dl=Math.random()*0.6,dr=1.5+Math.random()*1.5,rt=Math.random()*720;p.style.cssText=`left:${sx}%;width:${sz}px;height:${sz*0.6}px;background:${co};animation-delay:${dl}s;animation-duration:${dr}s;--r:${rt}deg`;con.appendChild(p);setTimeout(()=>p.remove(),(dr+dl)*1000+200);}
}

function spawnFloatingNumber(text,x=50,y=50,color='#ffd700'){
  const con=document.getElementById('floating-number-container');if(!con)return;
  const el=document.createElement('div');el.className='float-num';el.textContent=text;el.style.cssText=`left:${x}%;top:${y}%;color:${color}`;
  con.appendChild(el);setTimeout(()=>{if(el.parentNode)el.remove();},1200);
}

function animateRollingCount(el,from,to,d=800){
  if(!el)return;const start=performance.now();
  function tick(now){const t=Math.min((now-start)/d,1);const e=1-Math.pow(1-t,3);const cur=Math.round(from+(to-from)*e);el.textContent=cur;if(t<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);
}

// ═══════════════════════════════════════════════
//  SCREENS
// ═══════════════════════════════════════════════

function renderShop(){
  stopShopAnimations();
  const g=document.getElementById('shop-grid'); g.innerHTML='';
  document.getElementById('shop-coins').textContent=saveData.coins;
  SHOP_CARS.forEach(c=>{
    const owned=saveData.ownedCars.includes(c.id), eq=saveData.selectedCar===c.id, ca=saveData.coins>=c.cost;
    const isNew = owned && saveData.newItems?.shop;
    const d=document.createElement('div'); d.className='shop-item'+(eq?' equipped':owned?' owned':'');
    // Horizontal layout: canvas | info
    const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px';
    const cv=document.createElement('canvas');
    cv.width=CAR_SPRITE_SIZE; cv.height=Math.round(CAR_SPRITE_SIZE*0.6);
    cv.dataset.model=c.model;
    cv.style.cssText=`border-radius:6px;background:rgba(0,0,0,0.12);flex-shrink:0;width:${CAR_SPRITE_SIZE}px;height:${Math.round(CAR_SPRITE_SIZE*0.6)}px`;
    row.appendChild(cv);
    const info=document.createElement('div'); info.style.cssText='flex:1;min-width:0';
    const nameEl=document.createElement('div'); nameEl.className='shop-name'; nameEl.style.marginTop='0'; nameEl.textContent=c.name; info.appendChild(nameEl);
    const costEl=document.createElement('div'); costEl.className='shop-cost'; costEl.innerHTML=c.cost>0?`<span class="coin-icon"></span> ${c.cost}`:'Free'; info.appendChild(costEl);
    const btn=document.createElement('button'); btn.className='shop-btn '+(eq?'equipped':owned?'equip':ca?'buy':'locked'); btn.textContent=eq?'✓ Equipped':owned?'Equip':ca?'Buy':'Need '+(c.cost-saveData.coins)+' more'; info.appendChild(btn);
    row.appendChild(info);
    d.appendChild(row);
    if(isNew){const nb=document.createElement('div');nb.className='new-badge';nb.textContent='NEW!';d.appendChild(nb);}
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      if(eq)return;
      if(owned){saveData.selectedCar=c.id;writeSave();playClick();renderShop();updatePreviewCar();}
      else if(ca){saveData.coins-=c.cost;saveData.ownedCars.push(c.id);saveData.selectedCar=c.id;writeSave();playChaChing();renderShop();checkAchievements();updatePreviewCar();}
    });
    g.appendChild(d);
  });
  startShopAnimations();
}

function renderAvatars(){
  const g=document.getElementById('avatar-grid'); g.innerHTML='';
  AVATARS.forEach(av=>{
    const owned=saveData.ownedAvatars.includes(av.id), sel=saveData.selectedAvatar===av.id, ca=saveData.coins>=av.cost;
    const c=document.createElement('div'); c.className='avatar-card'+(sel?' selected':'')+(!owned&&!av.free?' locked':'');
    c.innerHTML=`<div class="avatar-emoji">${av.emoji}</div><div class="avatar-name">${av.name}</div>${!owned&&!av.free?`<div class="avatar-lock">🔒</div><div class="avatar-cost"><span class="coin-icon"></span> ${av.cost}</div>`:''}`;
    c.addEventListener('click',()=>{
      if(owned||av.free){if(!owned){saveData.ownedAvatars.push(av.id);writeSave();}saveData.selectedAvatar=av.id;writeSave();playClick();renderAvatars();}
      else if(ca){saveData.coins-=av.cost;saveData.ownedAvatars.push(av.id);saveData.selectedAvatar=av.id;writeSave();playCoin();renderAvatars();}
    });g.appendChild(c);
  });
  const tb=document.getElementById('title-selector'); if(!tb)return; tb.innerHTML='';
  TITLES.forEach(t=>{
    const o=saveData.unlockedTitles.includes(t.title), s=saveData.selectedTitle===t.title;
    const b=document.createElement('button'); b.className='title-btn'+(o?' owned':'')+(s?' selected':'')+(!o?' locked':''); b.textContent=o?`${t.icon} ${t.title}`:`🔒 Lv.${t.level}`; b.disabled=!o;
    if(o)b.addEventListener('click',()=>{saveData.selectedTitle=t.title;writeSave();playClick();renderAvatars();});
    tb.appendChild(b);
  });
}

function renderAchievements(){
  const l=document.getElementById('achievement-list'); l.innerHTML='';
  ACHIEVEMENTS.forEach(a=>{
    const u=saveData.achievements.includes(a.id);
    const d=document.createElement('div'); d.className='achievement-item'+(u?' unlocked':'');
    d.innerHTML=`<div class="achievement-icon">${a.icon}</div><div class="achievement-info"><div class="achievement-name">${a.name}</div><div class="achievement-desc">${a.desc}</div></div><div class="achievement-reward">${u?'✓':`<span class="coin-icon"></span> `+a.coins}</div>`;
    l.appendChild(d);
  });
}

function renderQuestScreen(){
  const l=document.getElementById('quest-list'); if(!l)return; l.innerHTML='';
  if(!saveData.dailyQuests||saveData.dailyQuests.length===0)initDailyQuests();
  saveData.dailyQuests.forEach(q=>{
    const p=saveData.dailyQuestProgress?.[q.id]||0, done=p>=q.need, pct=Math.min(100,(p/q.need)*100);
    const d=document.createElement('div'); d.className='quest-item'+(done?' done':'');
    d.innerHTML=`<div class="quest-icon">${q.icon}</div><div class="quest-info"><div class="quest-name">${q.desc}</div><div class="quest-bar-wrap"><div class="quest-bar" style="width:${pct}%"></div></div><div class="quest-progress">${Math.min(p,q.need)}/${q.need}</div></div><div class="quest-reward"><span class="coin-icon"></span>${q.reward}</div>`;
    l.appendChild(d);
  });
}

function renderLeaderboard(){
  const l=document.getElementById('lb-list-full'); l.innerHTML='';
  const fn=['xDragon','SpeedDemon','TurboMax','NitroKing','DriftMaster','RaceQueen','FastLane','WheelSpin','RoadRunner','GearHead'];
  const ff=['🇺🇸','🇬🇧','🇯🇵','🇰🇷','🇫🇷','🇩🇪','🇧🇷','🇮🇳','🇨🇳','🇮🇹'], fw=[142,128,115,98,87,76,65,54,43,31];
  const entries=fn.map((n,i)=>({name:n,flag:ff[i],wins:fw[i],isMe:false}));
  entries.push({name:saveData.playerName||'YOU',flag:'🏁',wins:saveData.totalWins,isMe:true});
  entries.sort((a,b)=>b.wins-a.wins);
  entries.forEach((e,i)=>{const d=document.createElement('div');d.className='lb-item'+(e.isMe?' me':'');d.innerHTML=`<div class="lb-rank">#${i+1}</div><div class="lb-flag">${e.flag}</div><div class="lb-name">${e.name}</div><div class="lb-wins">${e.wins}W</div>`;l.appendChild(d);});
}

function renderControls(){
  const l=document.getElementById('controls-list'); if(!l)return; l.innerHTML='';
  const c=saveData.controls||DEFAULT_CONTROLS;
  const keyName={KeyW:'W',KeyS:'S',KeyA:'A',KeyD:'D',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',ShiftLeft:'Shift',ShiftRight:'Shift',Space:'Space'};
  Object.keys(CTRL_LABELS).forEach(action=>{
    const r=document.createElement('div'); r.className='keybinding-row';
    const code=c[action]; const display=keyName[code]||code;
    r.innerHTML=`<div class="keybinding-label">${CTRL_LABELS[action]}</div><div class="keybinding-key" data-action="${action}">${display}</div>`;
    const kb=r.querySelector('.keybinding-key');
    kb.addEventListener('click',()=>{
      kb.classList.add('listening'); kb.textContent='...';
      const handler=e=>{
        e.preventDefault(); e.stopPropagation();
        const newCode=e.code;
        if(newCode&&newCode.startsWith('Key')||newCode.startsWith('Arrow')||newCode==='Space'||newCode.startsWith('Shift')){
          c[action]=newCode; saveData.controls={...c}; writeSave(); playClick();
          const kn=keyName[newCode]||newCode; kb.textContent=kn; kb.classList.remove('listening');
        }
        window.removeEventListener('keydown',handler,true);
      };
      window.addEventListener('keydown',handler,true);
    });
    l.appendChild(r);
  });
}

function renderSettings(){
  const mv=document.getElementById('master-vol');if(mv)mv.value=Math.round((saveData.masterVol||0.7)*100);
  const sv=document.getElementById('sfx-vol');if(sv)sv.value=Math.round((saveData.sfxVol||0.7)*100);
  const muv=document.getElementById('music-vol');if(muv)muv.value=Math.round((saveData.musicVol||0.7)*100);
  const st=document.getElementById('shake-toggle');if(st)st.classList.toggle('active',saveData.shakeEnabled!==false);
  updateVolLabels();
}

function setupVolumeSliders(){
  saveData.masterVol=saveData.masterVol??0.7; saveData.sfxVol=saveData.sfxVol??0.7; saveData.musicVol=saveData.musicVol??0.7;
  document.getElementById('master-vol')?.addEventListener('input',e=>{const v=parseInt(e.target.value)/100;saveData.masterVol=v;if(masterGain)masterGain.gain.value=v*0.7;writeSave();updateVolLabels();});
  document.getElementById('sfx-vol')?.addEventListener('input',e=>{const v=parseInt(e.target.value)/100;saveData.sfxVol=v;if(sfxGain)sfxGain.gain.value=v*0.7;writeSave();updateVolLabels();});
  document.getElementById('music-vol')?.addEventListener('input',e=>{const v=parseInt(e.target.value)/100;saveData.musicVol=v;if(musicGain)musicGain.gain.value=v*0.7;writeSave();updateVolLabels();});
  document.getElementById('shake-toggle')?.addEventListener('click',e=>{const t=e.currentTarget;t.classList.toggle('active');saveData.shakeEnabled=t.classList.contains('active');writeSave();});
}

function updateVolLabels(){
  const mv=document.getElementById('master-vol');document.getElementById('master-vol-val').textContent=mv?mv.value+'%':'100%';
  const sv=document.getElementById('sfx-vol');document.getElementById('sfx-vol-val').textContent=sv?sv.value+'%':'100%';
  const muv=document.getElementById('music-vol');document.getElementById('music-vol-val').textContent=muv?muv.value+'%':'100%';
}

function toggleFullscreen(){
  if(!document.fullscreenElement){document.documentElement.requestFullscreen?.()||document.documentElement.webkitRequestFullscreen?.();}
  else{document.exitFullscreen?.()||document.webkitExitFullscreen?.();}
}

function selectMode(mode){
  G.mode=mode;
  document.querySelectorAll('.mode-card').forEach(c=>c.classList.toggle('selected',c.dataset.mode===mode));
}

function renderModeSelect(){
  const g=document.getElementById('mode-grid'); if(!g)return; g.innerHTML='';
  const modes=[
    {id:'classic',icon:'🎮',name:'Classic',desc:'Survive rounds by driving to the correct color'},
    {id:'timeattack',icon:'⏱️',name:'Time Attack',desc:'Find the unique tile before time runs out!',tag:'1 Player — No opponents'},
    {id:'suddendeath',icon:'💀',name:'Sudden Death',desc:'One mistake and you\'re out — no second chances'},

  ];
  G.mode=G.mode||'classic';
  modes.forEach(m=>{
    const c=document.createElement('div'); c.className='mode-card'+(G.mode===m.id?' selected':''); c.dataset.mode=m.id;
    c.innerHTML=`<div class="mode-icon">${m.icon}</div><div class="mode-name">${m.name}</div><div class="mode-desc">${m.desc}</div>${m.tag?`<div class="mode-tag">${m.tag}</div>`:''}`;
    c.addEventListener('click',()=>selectMode(m.id)); g.appendChild(c);
  });
}

function renderLoadingScreen(){
  const art=['🏎️','🏆','🚗','⭐','🔥','💎','👑','🛡️','🚀','🎯','💪','🌟','⚡','🎮'];
  const tips=['Stay on the correct color when the timer runs out!','Use Space to drift around tight corners.',
    'Hold Shift for a speed boost.','Bump other cars off the platform!','Earn coins by surviving rounds.',
    'Complete daily quests for bonus coins!','Unlock new cars in the shop.','Higher levels unlock titles.',
    'Wrong color tiles fall — avoid them!','The platform shrinks as rounds progress.'];
  const a=document.getElementById('loading-art'); if(a)a.textContent=art[Math.floor(Math.random()*art.length)];
  const t=document.getElementById('loading-tip'); if(t)t.textContent='💡 Tip: '+tips[Math.floor(Math.random()*tips.length)];
}

// ═══════════════════════════════════════════════
//  MATCH HISTORY
// ═══════════════════════════════════════════════

function renderHistory(){
  const l=document.getElementById('history-list'); if(!l)return; l.innerHTML='';
  const h=saveData.matchHistory||[];
  if(h.length===0){l.innerHTML='<div style="text-align:center;color:rgba(255,255,255,0.3);font-family:\'Inter\',sans-serif;padding:24px">No games played yet</div>';return;}
  h.forEach(m=>{
    const d=document.createElement('div'); d.className='match-item'+(m.won?' match-won':' match-lost');
    const modeIcons={classic:'🎮',timeattack:'⏱️',suddendeath:'💀'};
    d.innerHTML=`<div class="match-icon">${modeIcons[m.mode]||'🎮'}</div><div class="match-info"><div class="match-mode">${m.mode==='timeattack'?'Time Attack':m.mode==='suddendeath'?'Sudden Death':'Classic'}</div><div class="match-detail">${m.date} • ${m.rounds} round${m.rounds>1?'s':''} • ${m.survived} survived</div></div><div class="match-result ${m.won?'won':'lost'}">${m.won?'WON':'LOST'}</div>`;
    l.appendChild(d);
  });
}

// ═══════════════════════════════════════════════
//  XP CIRCLE
// ═══════════════════════════════════════════════

function updateXpCircle(){
  const wrap=document.getElementById('xp-ring-wrap'); if(!wrap)return;
  wrap.style.display='block';
  const level=document.getElementById('xp-ring-level'); if(level)level.textContent=saveData.level;
  const fill=document.getElementById('xp-ring-fill'); if(!fill)return;
  const pct=saveData.xp/100;
  const circ=314.16;
  fill.style.strokeDashoffset=circ-(circ*pct);
  fill.style.transition='stroke-dashoffset 1s ease-out';
}

// ═══════════════════════════════════════════════
//  CLICK TO START
// ═══════════════════════════════════════════════

async function showClickToStart(){
  showOverlay('click-to-start');
  return new Promise(resolve=>{
    const handler=()=>{document.removeEventListener('click',handler);resolve();};
    document.addEventListener('click',handler);
  });
}

// ═══════════════════════════════════════════════
//  TUTORIAL
// ═══════════════════════════════════════════════

const TUTORIAL_STEPS=[
  {icon:'🎮',text:'Use WASD or Arrow Keys to drive your car. Hold Shift for boost!'},
  {icon:'🎨',text:'When a color is announced, drive to that color on the platform before time runs out!'},
  {icon:'⚠️',text:'Wrong color tiles will fall! Stay on the safe color to survive. Use Space to drift!'},
  {icon:'🏆',text:'Last car standing wins! Bump other cars off the platform. Earn coins to unlock new cars and avatars!'},
];
let tutorialStep=0;

function showTutorial(){tutorialStep=0;renderTutorialStep();showOverlay('tutorial');}
function renderTutorialStep(){const s=TUTORIAL_STEPS[tutorialStep];document.getElementById('tut-icon').textContent=s.icon;document.getElementById('tut-step').textContent=`Step ${tutorialStep+1} of ${TUTORIAL_STEPS.length}`;document.getElementById('tut-text').innerHTML='';typewriterEffect(document.getElementById('tut-text'),s.text.replace(/<[^>]*>/g,''),20);document.getElementById('btn-tut-next').textContent=tutorialStep===TUTORIAL_STEPS.length-1?'Got it!':'Next';}

// ═══════════════════════════════════════════════
//  MATCHMAKING
// ═══════════════════════════════════════════════

async function runMatchmaking(skip=false){
  if(!skip){
    showOverlay('matchmaking');
    const con=document.getElementById('mm-players'); con.innerHTML='';
    document.getElementById('mm-title').textContent='Searching for players...';
    const pa=AVATARS.find(a=>a.id===saveData.selectedAvatar)?.emoji||'🚗';
    const pc=document.createElement('div');pc.className='mm-player';pc.innerHTML=`<div class="mm-avatar">${pa}</div><div class="mm-info"><div class="mm-name">${saveData.playerName||'YOU'}</div><div class="mm-flag">You</div></div>`;con.appendChild(pc);await wait(800);
    for(let i=0;i<CFG.NUM_BOTS;i++){const f=BOT_FLAGS[Math.floor(Math.random()*BOT_FLAGS.length)],n=BOT_NAMES[i],av=AVATARS[Math.floor(Math.random()*4)].emoji;const c=document.createElement('div');c.className='mm-player';c.innerHTML=`<div class="mm-avatar">${av}</div><div class="mm-info"><div class="mm-name">${n}</div><div class="mm-flag">${f}</div></div>`;con.appendChild(c);playClick();await wait(400+Math.random()*300);}
    document.getElementById('mm-title').textContent='Match Found! Starting...';
    await wait(600);
    await fadeToBlack(200);
  }
  showOverlay(null);
  resetGame(false);
  if(!skip)await wait(300);
  if(!skip)fadeFromBlack(200);
}



// ═══════════════════════════════════════════════
//  CURSOR TRAIL
// ═══════════════════════════════════════════════

function initCursorTrail(){
  let last=0;
  document.addEventListener('mousemove',e=>{
    const n=Date.now();if(n-last<35)return;last=n;
    const s=document.createElement('div');s.className='cursor-star';s.textContent='✦';
    s.style.left=(e.clientX-6)+'px';s.style.top=(e.clientY-6)+'px';
    const cs=['#ffd700','#ff6b35','#a78bfa','#4ade80','#ff69b4'];
    s.style.color=cs[Math.floor(Math.random()*cs.length)];
    document.body.appendChild(s);
    setTimeout(()=>{if(s.parentNode)s.remove();},700);
    // Menu parallax: move scene slightly opposite to mouse
    if (G.phase==='loading'||document.getElementById('splash') && !document.getElementById('splash').classList.contains('hidden')) {
      const px=(e.clientX/window.innerWidth-0.5)*0.03;
      const pz=(e.clientY/window.innerHeight-0.5)*0.03;
      tileRoot.position.x=px*10; tileRoot.position.z=pz*10;
    }
  });
}

function checkNewItemDots(){
  const n=saveData.newItems||{};
  ['shop','avatars','achievements'].forEach(key=>{
    const btn=document.getElementById('btn-'+key);
    if(!btn)return;
    const dot=btn.querySelector('.new-dot')||(()=>{const d=document.createElement('span');d.className='new-dot';d.style.cssText='position:absolute;top:4px;right:4px;width:10px;height:10px;border-radius:50%;background:#ff4444;box-shadow:0 0 6px #ff4444;animation:pulse-glow 1s ease-in-out infinite';btn.style.position='relative';btn.appendChild(d);return d;})();
    dot.style.display=n[key]?'block':'none';
  });
}

function markNewItem(key){
  if(!saveData.newItems)saveData.newItems={shop:false,avatars:false,achievements:false};
  saveData.newItems[key]=true;writeSave();checkNewItemDots();
}

function clearNewItem(key){
  if(!saveData.newItems)return;
  saveData.newItems[key]=false;writeSave();checkNewItemDots();
}

function pauseGame(){if(G.paused)return;G.paused=true;document.getElementById('pause-overlay')?.classList.remove('hidden');}
function resumeGame(){if(!G.paused)return;G.paused=false;document.getElementById('pause-overlay')?.classList.add('hidden');}

// ═══════════════════════════════════════════════
//  BUTTON WIRING
// ═══════════════════════════════════════════════

function wireButtons(){
  // Hover sounds on all buttons
  document.querySelectorAll('.menu-btn,.btn').forEach(el=>{
    el.addEventListener('mouseenter',()=>{if(masterGain?.gain?.value>0)playHover();});
  });

  // Rating popup buttons
  document.getElementById('btn-rate-yes')?.addEventListener('click',()=>{playClick();showToast('❤️','Thanks for playing!');saveData.ratingDone=true;writeSave();showOverlay('splash');});
  document.getElementById('btn-rate-no')?.addEventListener('click',()=>{playClick();showToast('💡','Thanks for the feedback!');saveData.ratingDone=true;writeSave();showOverlay('splash');});

  // Instant restart on Game Over (Space key)
  window.addEventListener('keydown',e=>{
    if(e.code==='Space'&&G.phase==='gameover'&&!G.paused){
      e.preventDefault();document.getElementById('btn-again')?.click();
    }
  });

  document.getElementById('btn-play').addEventListener('click',()=>{resumeAC();playClick();if(!saveData.playerName)showOverlay('name-screen');else{renderModeSelect();showOverlay('mode-screen');}});
  document.getElementById('btn-name-continue').addEventListener('click',()=>{const n=document.getElementById('name-input').value.trim();if(n.length<1){document.getElementById('name-input').style.borderColor='#ff4444';return;}saveData.playerName=n.substring(0,12);writeSave();playClick();renderModeSelect();showOverlay('mode-screen');});
  document.getElementById('btn-start-mode').addEventListener('click',()=>{
    playClick();
    renderLoadingScreen();runMatchmaking(true);
  });
  document.getElementById('btn-mode-back').addEventListener('click',()=>{playClick();showOverlay('splash');});

  document.getElementById('btn-shop').addEventListener('click',()=>{playClick();clearNewItem('shop');renderShop();showOverlay('shop-screen');});
  document.getElementById('btn-shop-back').addEventListener('click',()=>{playClick();showOverlay('splash');updateMenuCoins();checkNewItemDots();});
  document.getElementById('btn-avatars').addEventListener('click',()=>{playClick();clearNewItem('avatars');renderAvatars();showOverlay('avatar-screen');});
  document.getElementById('btn-avatar-back').addEventListener('click',()=>{playClick();showOverlay('splash');checkNewItemDots();});
  document.getElementById('btn-avatar-done').addEventListener('click',()=>{playClick();showOverlay('splash');updateMenuCoins();checkNewItemDots();});
  document.getElementById('btn-achievements').addEventListener('click',()=>{playClick();clearNewItem('achievements');renderAchievements();showOverlay('achievements-screen');});
  document.getElementById('btn-achievements-back').addEventListener('click',()=>{playClick();showOverlay('splash');checkNewItemDots();});
  document.getElementById('btn-leaderboard').addEventListener('click',()=>{playClick();renderLeaderboard();showOverlay('leaderboard-screen');});
  document.getElementById('btn-leaderboard-back').addEventListener('click',()=>{playClick();showOverlay('splash');});
  document.getElementById('btn-quests')?.addEventListener('click',()=>{playClick();renderQuestScreen();showOverlay('quests-screen');});
  document.getElementById('btn-quests-back')?.addEventListener('click',()=>{playClick();showOverlay('splash');});

  document.getElementById('btn-controls')?.addEventListener('click',()=>{playClick();renderControls();showOverlay('controls-screen');});
  document.getElementById('btn-controls-back')?.addEventListener('click',()=>{playClick();showOverlay('splash');});

  document.getElementById('btn-settings')?.addEventListener('click',()=>{playClick();renderSettings();showOverlay('settings-screen');});
  document.getElementById('btn-settings-back')?.addEventListener('click',()=>{playClick();showOverlay('splash');});

  // Hard Reset
  document.getElementById('btn-hard-reset')?.addEventListener('click',()=>{
    if(confirm('⚠️ HARD RESET: This will delete ALL your saved data!\n\nProgress, coins, cars, achievements — everything will be lost forever.\n\nAre you sure?')){
      if(confirm('Last chance! All data will be wiped.\n\nContinue?')){
        localStorage.removeItem('fallcars_save');
        saveData=JSON.parse(JSON.stringify(DEFAULT_SAVE));
        writeSave();
        showToast('💥','All data has been reset!');
        updateMenuCoins();
        setTimeout(()=>location.reload(),1500);
      }
    }
  });

  document.getElementById('btn-resume').addEventListener('click',()=>{playClick();resumeGame();});
  document.getElementById('btn-quit-pause').addEventListener('click',async()=>{await fadeToBlack(200);resumeGame();resetGame(true);fadeFromBlack(200);});
  document.getElementById('fullscreen-btn').addEventListener('click',()=>{toggleFullscreen();});
  setupVolumeSliders();

  document.getElementById('btn-tutorial').addEventListener('click',()=>{playClick();showTutorial();});
  document.getElementById('btn-tut-next').addEventListener('click',()=>{playClick();if(tutorialStep<TUTORIAL_STEPS.length-1){tutorialStep++;renderTutorialStep();}else{saveData.tutorialDone=true;writeSave();showOverlay('splash');}});
  document.getElementById('btn-tut-skip').addEventListener('click',()=>{playClick();saveData.tutorialDone=true;writeSave();showOverlay('splash');});
  // History
  document.getElementById('btn-history')?.addEventListener('click',()=>{playClick();renderHistory();showOverlay('history-screen');});
  document.getElementById('btn-history-back')?.addEventListener('click',()=>{playClick();showOverlay('splash');});
  document.getElementById('btn-mute').addEventListener('click',()=>{const m=masterGain.gain.value===0;masterGain.gain.value=m?0.7:0;playClick();});
  document.getElementById('btn-next').addEventListener('click',()=>{G.round++;G.color=null;resetTiles();respawnAlive();updateHUD();updateLeaderboard();showOverlay(null);camera.position.set(0,CFG.CAM_HEIGHT+8,CFG.CAM_DIST*2);setTimeout(()=>newRound(),200);playClick();});
  document.getElementById('btn-spectate').addEventListener('click',()=>{G.round++;G.color=null;resetTiles();respawnAlive();updateHUD();updateLeaderboard();showOverlay(null);camera.position.set(0,CFG.CAM_HEIGHT+8,CFG.CAM_DIST*2);setTimeout(()=>newRound(),200);playClick();});
  document.getElementById('btn-leave').addEventListener('click',async()=>{playClick();if(!confirm('Are you sure? Any unsaved progress will be lost!'))return;await fadeToBlack(200);resetGame(true);fadeFromBlack(200);});
  document.getElementById('btn-again').addEventListener('click',()=>{playClick();renderModeSelect();showOverlay('mode-screen');});
  document.getElementById('btn-menu').addEventListener('click',async()=>{playClick();if(!confirm('Are you sure? Any unsaved progress will be lost!'))return;await fadeToBlack(200);resetGame(true);fadeFromBlack(200);});
}

// ═══════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════

const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  const t=performance.now()*0.001;
  tileRoot.position.y=Math.sin(t*0.45)*0.06;
  renderPreviewCar(t);

  if(G.paused){renderer.render(scene,camera);return;}

  // Background demo mode: bots drive around when menu is visible
  const splashEl=document.getElementById('splash');
  const ctsEl=document.getElementById('click-to-start');
  const menuVisible=G.phase==='loading'||(splashEl&&!splashEl.classList.contains('hidden'))||(ctsEl&&!ctsEl.classList.contains('hidden'));
  // Hide HUD during menu/demo, show during gameplay
  const hudEl=document.getElementById('hud');
  if(hudEl)hudEl.style.display=menuVisible?'none':'';
  // Hide player car during demo
  const playerCar=G.players.find(p=>p.isHuman);
  if(playerCar)playerCar.group.visible=!menuVisible;

  if(menuVisible&&G.phase!=='playing'){
    // Demo mode: bots drive around with random targets
    G.demoTimer=(G.demoTimer||0)+dt;
    if(G.demoTimer>2){
      G.demoTimer=0;
      G.color=Math.floor(Math.random()*COLORS.length);
    }
    G.players.forEach(p=>{
      if(!p.isHuman&&!p.eliminated){
        const inp=botInput(p,dt);
        physicsStep(p,dt,inp.throttle,inp.brake,inp.steerInput,inp.handbrake);
      }
      // Reset fallen players after a moment
      if(p.eliminated&&p.group.position.y<-30){
        const pos=spawnPositions(G.players.length);
        const idx=G.players.indexOf(p);
        if(pos[idx]){
          p.eliminated=false;p.onPlatform=true;p.group.visible=true;
          p.group.position.set(pos[idx].x,CFG.PLATFORM_Y+CFG.TILE_H,pos[idx].z);
          p.group.rotation.set(0,0,0);
          p.heading=0;p.speed=0;p.velX=0;p.velZ=0;p.steer=0;
          p.fallVel=0;
        }
      }
    });
    handleCollisions(dt);
    // Occasional tile drop for visual flair
    if(tiles.length>0&&Math.random()<0.002){
      const randTile=tiles[Math.floor(Math.random()*tiles.length)];
      if(!randTile.falling&&!randTile.fallen){
        randTile.falling=true;
        setTimeout(()=>{
          G.players.forEach(p=>{
      if(p.eliminated||!p.onPlatform||p.roundSafe)return;
            const dx=Math.abs(p.group.position.x-randTile.worldX);
            const dz=Math.abs(p.group.position.z-randTile.worldZ);
            if(dx<G.tileSize*0.5&&dz<G.tileSize*0.5)triggerFall(p);
          });
        },500);
      }
    }
    // Respawn fallen bots after short delay
    G.players.forEach(p=>{
      if(!p.onPlatform&&p.group.position.y<-30&&!p.eliminated){
        setTimeout(()=>{
          const pos=spawnPositions(G.players.length);
          const idx=G.players.indexOf(p);
          if(pos[idx]&&p.group.position.y<-30){
            p.eliminated=false;p.onPlatform=true;p.group.visible=true;
            p.group.position.set(pos[idx].x,CFG.PLATFORM_Y+CFG.TILE_H,pos[idx].z);
            p.group.rotation.set(0,0,0);
            p.heading=0;p.speed=0;p.velX=0;p.velZ=0;p.steer=0;p.fallVel=0;
          }
        },2000);
      }
    });
    // Overview camera during demo
    camState.yaw+=dt*0.15;
    camera.position.set(Math.sin(camState.yaw)*15,10,Math.cos(camState.yaw)*15);
    camera.lookAt(0,0,0);
    // Update falling tiles
    updateTiles(dt);
    updateParticles(dt);
    G.players.forEach(p=>{if(!p.onPlatform)updateFalling(p,dt);});
    renderer.render(scene,camera);
    return;
  }

  if(G.phase==='playing'||G.phase==='eliminating'){
    const human=G.players.find(p=>p.isHuman);
    if(human&&!human.eliminated){
      const inp=humanInput(human);
      physicsStep(human,dt,inp.throttle,inp.brake,inp.steerInput,inp.handbrake);
    }
    G.players.forEach(p=>{
      if(!p.isHuman&&!p.eliminated){
        const inp=botInput(p,dt);physicsStep(p,dt,inp.throttle,inp.brake,inp.steerInput,inp.handbrake);
      }
    });
    handleCollisions(dt);
    G.timerLeft-=dt;
    if(G.timerLeft<0)G.timerLeft=0;
    updateTimerHUD(G.timerLeft,G.mode==='timeattack'?G.taCurrentMax:CFG.ROUND_TIME);
    const hp=document.getElementById('low-health-pulse');
    if(hp){if(G.timerLeft<=3&&G.timerLeft>0)hp.classList.add('active');else hp.classList.remove('active');}
    if(G.timerLeft<=0&&!G.elimCheckDone){
      G.elimCheckDone=true;G.phase='eliminating';
      document.getElementById('timer-wrap').classList.remove('visible');
      checkWrongColor();
    }
  }

  G.players.forEach(p=>{if(!p.onPlatform)updateFalling(p,dt);});
  updateTiles(dt);
  if(G.phase==='eliminating'){
    G.players.forEach(p=>{
      if(p.eliminated||!p.onPlatform)return;
      let on=false;const px=p.group.position.x,pz=p.group.position.z,hw=G.tileSize*0.6;
      for(const t of tiles){
        if(t.fallen||(t.falling&&t.mesh.position.y<-0.5))continue;
        if(Math.abs(px-t.worldX)<hw&&Math.abs(pz-t.worldZ)<hw){on=true;break;}
      }
      if(!on)triggerFall(p);
    });
  }
  updateParticles(dt);
  updateCamera(dt);
  G.players.forEach(p=>{if(p.label&&!p.eliminated)p.label.lookAt(camera.position);});
  renderer.render(scene,camera);
}

// ═══════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════

function wait(ms){return new Promise(r=>setTimeout(r,ms));}

async function boot(){
  loadSave();
  Object.keys(SESSION).forEach(k=>SESSION[k]=0);

  // Show intro splash IMMEDIATELY (it has a black background - no extra black needed)
  const intro = document.getElementById('intro-splash');
  if (intro) { intro.style.display='flex'; await wait(50); intro.style.opacity='1'; }

  // Load 3D scene in the background while intro plays
  renderLoadingScreen();
  const le=document.getElementById('loading-screen'),lm=document.getElementById('loading-msg');
  lm.textContent='Building scene...';
  buildLights();buildSkybox();buildPlatform(3,4.0);initAudio();setupInput();
  lm.textContent='Loading car models...';
  await loadCarModels();
  lm.textContent='Preparing garage...';
  preRenderCarSprites();
  lm.textContent='Spawning cars...';
  spawnPlayers();
  updateHUD();updateLeaderboard();
  wireButtons();
  animate();
  lm.textContent='Ready!';

  // Wait for intro to finish (2.2s)
  if (intro) {
    await wait(2700);
    intro.style.opacity='0';
    await wait(400);
    intro.style.display='none';
  }

  // Hide loading, show Click to Start (3D scene may or may not be visible yet)
  le.classList.add('hidden');
  await showClickToStart();

  // Show menu over the 3D scene
  showOverlay('splash');
  updateMenuCoins();
  checkNewItemDots();
  setTimeout(()=>startBgMusic(),1000);
  initCursorTrail();
  initPreviewRenderer();
  checkDailyLogin();
  initDailyQuests();
  if(!saveData.tutorialDone){
    setTimeout(()=>showTutorial(),500);
  }
}

boot();