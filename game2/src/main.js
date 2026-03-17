// ================================================
// SKELETON IN ANCIENT GREECE
// You are Boney — a modern skeleton living in
// ancient Greece. Run your shop, drive around,
// avoid the guards, and deal with Socrates.
// ================================================
// Controls:
//   WASD / Arrows — move (or drive)
//   E — interact / serve customer
//   F — fight (when guards/Socrates nearby)
//   1/2 — dialogue choices with Socrates
//   R — enter/exit car
// ================================================

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

const GW = 640, GH = 480, HUD = 48;
canvas.width  = GW;
canvas.height = GH + HUD;

// ── Palette ──────────────────────────────────
const C = {
  sky:       '#d4a857',
  skyHi:     '#e8c46a',
  sand:      '#c9a84c',
  sandDark:  '#b8922e',
  stone:     '#b8a878',
  stoneDark: '#9e8e60',
  stoneHi:   '#cfc8a0',
  grass:     '#8aad52',
  grassDark: '#6e9040',
  road:      '#a08040',
  roadLine:  '#c4a855',
  water:     '#4a90d9',
  waterHi:   '#6ab0f0',

  // Skeleton (Boney)
  bone:      '#e8e0d0',
  boneDark:  '#c8bfa8',
  boneEye:   '#1a1a2e',

  // NPC skin tones
  greek1:    '#d4956a',
  greek2:    '#c07840',
  robe:      '#f0ece0',
  robeDark:  '#d8d0b8',
  robeBlue:  '#6080c0',

  // Socrates
  socBeard:  '#888878',
  socRobe:   '#e0d8c8',

  // Guard
  guardArmor:'#c0a840',
  guardHelm: '#b89830',
  guardSpear:'#8b6914',

  // Car
  carRed:    '#cc3322',
  carDark:   '#991a11',
  carWin:    '#aaddff',
  carWheel:  '#222',
  carChrome: '#ddd',

  // Shop
  shopWall:  '#c8b88a',
  shopRoof:  '#8b4513',
  shopSign:  '#5c3d1a',
  counter:   '#a08050',

  // UI
  hudBg:     '#1a1200',
  hudBorder: '#8b6914',
  ui:        '#f0e8c0',
  uiMuted:   '#8b7840',
  hp:        '#e05030',
  hpEmpty:   '#3a1a10',
  rep:       '#40a040',
  repEmpty:  '#1a2a1a',
  wanted:    '#cc2020',
  dialog:    '#1a1600',
  dialogBdr: '#d4a017',
  dialogTxt: '#f0e8c0',
};

// ── World map ─────────────────────────────────
// 20x15 tiles, 32px each
const T = 32;
const COLS = 20, ROWS = 15;

// Tile types
const TILE = {
  SAND:  0,
  STONE: 1,
  GRASS: 2,
  ROAD:  3,
  WATER: 4,
  SHOP:  5,
  TEMP:  6, // temple floor
};

const MAP = [
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,5,5,0,0,0,0,3,0,0,0,6,6,6,0,0,0,0,2],
  [2,0,5,5,0,0,0,0,3,0,0,0,6,6,6,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,2],
  [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,4,4,2],
  [2,0,0,5,5,0,0,0,3,0,0,0,0,0,0,0,0,4,4,2],
  [2,0,0,5,5,0,0,0,3,0,0,0,0,0,0,0,0,4,4,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,5,5,0,0,0,4,4,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,5,5,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

// Shop positions & types
const SHOPS = [
  { col:2, row:2, type:'kitchen',   name:'Boney\'s Diner',   color:C.carRed  },
  { col:3, row:9, type:'barber',    name:'Skull Cuts',        color:C.robeBlue},
  { col:12,row:11,type:'garage',    name:'Boney\'s Garage',   color:C.guardArmor},
];

// Temple columns positions (decorative)
const TEMPLE_COLS = [[12,2],[14,2],[12,3],[14,3]];

function isWalkable(x, y) {
  const c = Math.floor(x / T), r = Math.floor(y / T);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  const t = MAP[r][c];
  return t !== TILE.WATER && t !== 5 && t !== 1; // can't walk into shop tiles or border
}

function tileAt(x, y) {
  const c = Math.floor(x / T), r = Math.floor(y / T);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return -1;
  return MAP[r][c];
}

// ── Camera ────────────────────────────────────
const cam = { x: 0, y: 0 };

function worldToScreen(wx, wy) {
  return { x: wx - cam.x, y: wy - cam.y };
}

function updateCam(px, py) {
  cam.x = px - GW / 2;
  cam.y = py - GH / 2;
  cam.x = Math.max(0, Math.min(cam.x, COLS * T - GW));
  cam.y = Math.max(0, Math.min(cam.y, ROWS * T - GH));
}

// ── Input ─────────────────────────────────────
const keys = {};
const justPressed = {};
window.addEventListener('keydown', e => {
  if (!keys[e.code]) justPressed[e.code] = true;
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
       'KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyR',
       'Digit1','Digit2'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Player ────────────────────────────────────
const player = {
  x: 4 * T, y: 4 * T,
  w: 14, h: 18,
  speed: 2,
  dir: 'down',
  hp: 5, maxHp: 5,
  rep: 5, maxRep: 10,   // reputation with Greeks
  wanted: 0,            // wanted level (guards come at 3+)
  gold: 20,
  inCar: false,
  nearShop: null,
  nearNPC: null,
  animFrame: 0,
  animTimer: 0,
  get cx() { return this.x + 7; },
  get cy() { return this.y + 9; },
};

// ── Car ───────────────────────────────────────
const car = {
  x: 5 * T, y: 6 * T,
  w: 28, h: 18,
  speed: 4,
  dir: 'right',
  occupied: false,
};

// ── NPCs ──────────────────────────────────────
// Customers wandering the world
let customers = [];
let guards    = [];
let socrates  = null;
let socratesTimer = 600; // ticks until Socrates appears

function makeCustomer(x, y) {
  const types = ['haircut','food','car'];
  const names = ['Aristotle','Plato','Pericles','Thales','Heraclitus','Pythagoras','Diogenes','Xenophon'];
  return {
    x, y, w: 12, h: 16,
    type: types[Math.floor(Math.random() * types.length)],
    name: names[Math.floor(Math.random() * names.length)],
    state: 'wander', // wander | waiting | served
    tx: x, ty: y,
    timer: 0,
    satisfied: false,
    skinColor: Math.random() < 0.5 ? C.greek1 : C.greek2,
    robeColor: Math.random() < 0.5 ? C.robe : C.robeBlue,
    get cx() { return this.x + 6; },
    get cy() { return this.y + 8; },
  };
}

function makeGuard(x, y) {
  return {
    x, y, w: 14, h: 18,
    state: 'patrol',
    tx: x + rnd(-60, 60), ty: y + rnd(-60, 60),
    speed: 1.4,
    hp: 3,
    alertTimer: 0,
    get cx() { return this.x + 7; },
    get cy() { return this.y + 9; },
  };
}

function makeSocrates(x, y) {
  return {
    x, y, w: 14, h: 18,
    state: 'approach', // approach | talking | leaving | fighting
    question: pickQuestion(),
    hp: 4,
    timer: 0,
    get cx() { return this.x + 7; },
    get cy() { return this.y + 9; },
  };
}

// ── Dialogue ──────────────────────────────────
const QUESTIONS = [
  {
    q: '"Is a skeleton truly alive, or merely\nan imitation of life?"',
    a1: 'I feel pretty alive, thanks.',
    a2: 'Define "alive", Socrates.',
    rep1: 1, rep2: 2,
  },
  {
    q: '"Does a car truly move, or does the\nroad move beneath it?"',
    a1: 'It\'s definitely the car.',
    a2: 'That\'s... actually interesting.',
    rep1: 0, rep2: 1,
  },
  {
    q: '"Is a perfectly cooked burger more\nvirtuous than a gyro?"',
    a1: 'Burger. Final answer.',
    a2: 'Virtue has no flavor, Socrates.',
    rep1: 1, rep2: 2,
  },
  {
    q: '"If a barber cuts hair but has no\nhair, can he truly know his craft?"',
    a1: 'I\'m a skeleton. I get it.',
    a2: 'Experience transcends appearance.',
    rep1: 1, rep2: 2,
  },
  {
    q: '"What is the sound of one hand\ncooking?"',
    a1: 'Sizzling, probably.',
    a2: 'You\'ve been spending time with\nthe wrong philosophers.',
    rep1: 0, rep2: 1,
  },
  {
    q: '"Does a modern vehicle not strip\nman of his dignity?"',
    a1: 'It strips me of my commute time.',
    a2: 'Says the man who walks everywhere.',
    rep1: 1, rep2: 1,
  },
];

function pickQuestion() {
  return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

// ── Particles & floating text ─────────────────
let particles  = [];
let floatTexts = [];

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rnd(1, 3);
    particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, color, life: rnd(20,45), maxLife:45, size: rnd(2,5) });
  }
}

function floatText(x, y, text, color='#f0e8c0') {
  floatTexts.push({ x, y, text, color, life: 80, maxLife: 80, vy: -0.6 });
}

// ── Game state ────────────────────────────────
let state    = 'play'; // play | dialog | shop | gameover
let dialogData = null;
let shopData   = null;
let notification = { text:'', timer:0 };
let score    = 0;

function notify(text) { notification.text = text; notification.timer = 180; }

// ── Helpers ───────────────────────────────────
function rnd(a, b) { return Math.random() * (b - a) + a; }
function dist(ax,ay,bx,by) { return Math.hypot(bx-ax,by-ay); }

// ── Spawn initial stuff ───────────────────────
function initWorld() {
  // Spawn some wandering customers
  for (let i = 0; i < 5; i++) {
    customers.push(makeCustomer(rnd(T*2, T*18), rnd(T*1, T*13)));
  }
  // Spawn guards (appear when wanted > 0)
  guards.push(makeGuard(T*15, T*3));
  guards.push(makeGuard(T*3, T*12));
}

// ── Update ────────────────────────────────────
let lastTime = 0;

function update(ts) {
  const dt = ts - lastTime; lastTime = ts;
  if (state === 'gameover') return;

  // Clear justPressed at end of frame
  const jp = { ...justPressed };
  Object.keys(justPressed).forEach(k => delete justPressed[k]);

  if (state === 'dialog') { updateDialog(jp); return; }
  if (state === 'shop')   { updateShop(jp); return; }

  updatePlayer(jp);
  updateCar();
  updateCustomers();
  updateGuards();
  updateSocrates(jp);
  updateParticles();

  // Camera follows player or car
  if (player.inCar) updateCam(car.x + car.w/2, car.y + car.h/2);
  else updateCam(player.cx, player.cy);

  socratesTimer--;
  if (socratesTimer <= 0 && !socrates && state === 'play') {
    // Spawn Socrates near player
    socrates = makeSocrates(player.cx + rnd(-80,80), player.cy + rnd(-80,80));
    socratesTimer = rnd(800, 1400);
    notify('Socrates approaches...');
  }

  if (notification.timer > 0) notification.timer--;
  floatTexts = floatTexts.filter(f => { f.y+=f.vy; return --f.life>0; });
}

function updatePlayer(jp) {
  if (player.inCar) {
    // In car — control car
    let mx=0, my=0;
    if (keys['ArrowUp']   ||keys['KeyW']) { my=-1; car.dir='up'; }
    if (keys['ArrowDown'] ||keys['KeyS']) { my= 1; car.dir='down'; }
    if (keys['ArrowLeft'] ||keys['KeyA']) { mx=-1; car.dir='left'; }
    if (keys['ArrowRight']||keys['KeyD']) { mx= 1; car.dir='right'; }
    if (mx&&my){mx*=0.707;my*=0.707;}
    const nx=car.x+mx*car.speed, ny=car.y+my*car.speed;
    if (isWalkable(nx+4,car.y+4)&&isWalkable(nx+car.w-4,car.y+4)&&
        isWalkable(nx+4,car.y+car.h-4)&&isWalkable(nx+car.w-4,car.y+car.h-4)) car.x=nx;
    if (isWalkable(car.x+4,ny+4)&&isWalkable(car.x+car.w-4,ny+4)&&
        isWalkable(car.x+4,ny+car.h-4)&&isWalkable(car.x+car.w-4,ny+car.h-4)) car.y=ny;
    player.x=car.x+7; player.y=car.y+2;

    // Run over guards
    guards.forEach(g => {
      if (dist(car.x+car.w/2, car.y+car.h/2, g.cx, g.cy) < 24) {
        g.hp -= 2; spawnParticles(g.cx,g.cy,'#cc3322',8);
        floatText(g.cx,g.cy-10,'OOF!','#ff6644');
        score += 5;
      }
    });
    guards = guards.filter(g => g.hp>0);

    if (jp['KeyR']) { player.inCar=false; player.x=car.x-16; player.y=car.y; }
    return;
  }

  // On foot
  let mx=0,my=0;
  if (keys['ArrowUp']   ||keys['KeyW']) {my=-1; player.dir='up';}
  if (keys['ArrowDown'] ||keys['KeyS']) {my= 1; player.dir='down';}
  if (keys['ArrowLeft'] ||keys['KeyA']) {mx=-1; player.dir='left';}
  if (keys['ArrowRight']||keys['KeyD']) {mx= 1; player.dir='right';}
  if (mx&&my){mx*=0.707;my*=0.707;}

  const spd = player.speed;
  const nx=player.x+mx*spd, ny=player.y+my*spd;
  if (isWalkable(nx+1,player.y+8)&&isWalkable(nx+player.w-1,player.y+8)&&
      isWalkable(nx+1,player.y+player.h-1)&&isWalkable(nx+player.w-1,player.y+player.h-1)) player.x=nx;
  if (isWalkable(player.x+1,ny+8)&&isWalkable(player.x+player.w-1,ny+8)&&
      isWalkable(player.x+1,ny+player.h-1)&&isWalkable(player.x+player.w-1,ny+player.h-1)) player.y=ny;

  // Animation
  if (mx||my) { player.animTimer++; if(player.animTimer>8){player.animTimer=0;player.animFrame=(player.animFrame+1)%2;} }
  else player.animFrame=0;

  // Enter car
  if (jp['KeyR'] && dist(player.cx,player.cy,car.x+car.w/2,car.y+car.h/2)<36) {
    player.inCar=true;
  }

  // Check near shop
  player.nearShop=null;
  SHOPS.forEach(sh => {
    const sx=sh.col*T+T, sy=sh.row*T+T;
    if (dist(player.cx,player.cy,sx,sy)<40) player.nearShop=sh;
  });

  // Check near NPC
  player.nearNPC=null;
  customers.forEach(c => {
    if (c.state==='waiting' && dist(player.cx,player.cy,c.cx,c.cy)<30) player.nearNPC=c;
  });
  if (socrates && socrates.state==='talking' && dist(player.cx,player.cy,socrates.cx,socrates.cy)<40) {
    player.nearNPC=socrates;
  }

  // Interact
  if (jp['KeyE']) {
    if (player.nearShop) {
      state='shop';
      shopData={ shop: player.nearShop, phase:'menu' };
    } else if (player.nearNPC && player.nearNPC !== socrates) {
      serveCustomer(player.nearNPC);
    } else if (socrates && socrates.state==='talking' && dist(player.cx,player.cy,socrates.cx,socrates.cy)<40) {
      state='dialog';
      dialogData={ npc: socrates, phase:'question' };
    }
  }

  // Fight
  if (jp['KeyF']) {
    // Hit nearby guards
    guards.forEach(g => {
      if (dist(player.cx,player.cy,g.cx,g.cy)<32) {
        g.hp--;
        spawnParticles(g.cx,g.cy,C.guardArmor,6);
        floatText(g.cx,g.cy-10,'-1','#ff4444');
        if (g.hp<=0) { score+=20; floatText(g.cx,g.cy-10,'KO!','#ffdd00'); }
      }
    });
    guards=guards.filter(g=>g.hp>0);
    // Hit Socrates if fighting
    if (socrates && socrates.state==='fighting' && dist(player.cx,player.cy,socrates.cx,socrates.cy)<32) {
      socrates.hp--;
      spawnParticles(socrates.cx,socrates.cy,C.socRobe,6);
      floatText(socrates.cx,socrates.cy-10,'...ow.','#f0e8c0');
      if (socrates.hp<=0) { socrates=null; score+=30; notify('Socrates has retreated to reconsider.'); }
    }
  }
}

function serveCustomer(c) {
  // Check if right shop is nearby
  const nearRight = player.nearShop && (
    (c.type==='food' && player.nearShop.type==='kitchen') ||
    (c.type==='haircut' && player.nearShop.type==='barber') ||
    (c.type==='car' && player.nearShop.type==='garage')
  );
  if (nearRight || dist(player.cx,player.cy,c.cx,c.cy)<24) {
    c.state='served';
    c.satisfied=true;
    const gold=rnd(5,15)|0;
    player.gold+=gold;
    player.rep=Math.min(player.rep+1,player.maxRep);
    score+=10;
    spawnParticles(c.cx,c.cy,C.rep,10);
    floatText(c.cx,c.cy-14,`+${gold} gold!`,'#f0e020');
    floatText(c.cx,c.cy-24,'Thanks!',C.robe);
  } else {
    notify('Get to the right shop first!');
  }
}

function updateCustomers() {
  // Respawn served customers
  customers=customers.filter(c=>c.state!=='served'||(c.timer--,c.timer>0)?true:false);
  while(customers.length<5) customers.push(makeCustomer(rnd(T*2,T*17),rnd(T*2,T*13)));

  customers.forEach(c=>{
    if (c.state==='wander'){
      c.timer--;
      if (c.timer<=0){
        c.tx=rnd(T*1,T*18); c.ty=rnd(T*1,T*13); c.timer=rnd(120,300);
        // 30% chance stop and wait
        if (Math.random()<0.3) c.state='waiting';
      }
      // Move toward target
      const dx=c.tx-c.cx, dy=c.ty-c.cy, d=Math.hypot(dx,dy);
      if (d>4){ c.x+=(dx/d)*0.8; c.y+=(dy/d)*0.8; }
    }
  });
}

function updateGuards() {
  // Spawn more guards if wanted
  if (player.wanted>=3 && guards.length<4) {
    guards.push(makeGuard(rnd(T*2,T*17),rnd(T*2,T*13)));
  }

  guards.forEach(g=>{
    if (player.wanted>=1) {
      // Chase player
      const dx=player.cx-g.cx, dy=player.cy-g.cy, d=Math.hypot(dx,dy);
      if (d>16){ g.x+=(dx/d)*g.speed; g.y+=(dy/d)*g.speed; }
      // Catch player
      if (d<18 && player.hp>0) {
        player.hp--;
        player.wanted=Math.max(0,player.wanted-1);
        spawnParticles(player.cx,player.cy,C.hp,8);
        floatText(player.cx,player.cy-14,'Arrested!','#ff4444');
        if (player.hp<=0) state='gameover';
      }
    } else {
      // Patrol
      const dx=g.tx-g.cx, dy=g.ty-g.cy, d=Math.hypot(dx,dy);
      if (d<8){ g.tx=rnd(T*2,T*17); g.ty=rnd(T*2,T*13); }
      else { g.x+=(dx/d)*g.speed*0.5; g.y+=(dy/d)*g.speed*0.5; }
    }
  });
}

function updateSocrates(jp) {
  if (!socrates) return;
  const dx=player.cx-socrates.cx, dy=player.cy-socrates.cy, d=Math.hypot(dx,dy);

  if (socrates.state==='approach') {
    if (d>36){ socrates.x+=(dx/d)*1; socrates.y+=(dy/d)*1; }
    else { socrates.state='talking'; notify('"Ah, a most peculiar skeleton..."'); }
  }
  if (socrates.state==='talking') {
    socrates.timer++;
    if (socrates.timer>300 && d>80) { socrates.state='leaving'; }
  }
  if (socrates.state==='leaving') {
    socrates.x-=(dx/Math.max(d,1))*0.8; socrates.y-=(dy/Math.max(d,1))*0.8;
    if (d>250) socrates=null;
  }
  if (socrates.state==='fighting') {
    if (d>28){ socrates.x+=(dx/d)*0.9; socrates.y+=(dy/d)*0.9; }
    if (d<20){ player.hp--; spawnParticles(player.cx,player.cy,C.hp,5); if(player.hp<=0)state='gameover'; }
  }
}

function updateDialog(jp) {
  if (!dialogData) { state='play'; return; }
  const q = dialogData.npc.question;
  if (jp['Digit1']) resolveDialog(0, q);
  if (jp['Digit2']) resolveDialog(1, q);
  if (jp['KeyF'])   { socrates.state='fighting'; state='play'; notify('Fight it is.'); dialogData=null; }
}

function resolveDialog(choice, q) {
  const rep = choice===0 ? q.rep1 : q.rep2;
  player.rep=Math.min(player.rep+rep,player.maxRep);
  floatText(player.cx,player.cy-20,`+${rep} rep`,'#40e040');
  socrates.state='leaving';
  state='play';
  dialogData=null;
  notify('Socrates nods slowly and walks away.');
}

function updateShop(jp) {
  if (jp['KeyE'] || jp['Escape']) { state='play'; shopData=null; }
}

function updateParticles() {
  particles=particles.filter(p=>{ p.x+=p.vx;p.y+=p.vy;p.vx*=0.88;p.vy*=0.88;return --p.life>0; });
}

// ── Render ────────────────────────────────────
function render() {
  ctx.clearRect(0,0,GW,GH+HUD);

  // World
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  drawMap();
  drawShops();
  drawCar();
  customers.forEach(drawNPC);
  guards.forEach(drawGuard);
  if (socrates) drawSocrates(socrates);
  drawPlayer();
  particles.forEach(p=>{
    ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  });
  ctx.globalAlpha=1;
  floatTexts.forEach(f=>{
    ctx.globalAlpha=f.life/f.maxLife;
    ctx.fillStyle=f.color;
    ctx.font='bold 11px monospace';
    ctx.textAlign='center';
    ctx.fillText(f.text,f.x,f.y);
  });
  ctx.globalAlpha=1;
  ctx.restore();

  drawHUD();
  if (state==='dialog') drawDialog();
  if (state==='shop')   drawShopUI();
  if (state==='gameover') drawGameOver();
  drawNotification();
  drawInteractHint();
}

function drawMap() {
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      const x=c*T, y=r*T;
      const t=MAP[r][c];
      if (t===TILE.SAND)  { ctx.fillStyle=(c+r)%2===0?C.sand:C.sandDark; ctx.fillRect(x,y,T,T); }
      if (t===TILE.STONE) { ctx.fillStyle=C.stone; ctx.fillRect(x,y,T,T); ctx.fillStyle=C.stoneDark; ctx.fillRect(x,y,T,2); }
      if (t===TILE.GRASS) { ctx.fillStyle=(c+r)%2===0?C.grass:C.grassDark; ctx.fillRect(x,y,T,T); }
      if (t===TILE.ROAD)  {
        ctx.fillStyle=C.road; ctx.fillRect(x,y,T,T);
        ctx.fillStyle=C.roadLine;
        if (c===8) { ctx.fillRect(x+14,y,4,T); } // vertical road center line
        if (r===6) { ctx.fillRect(x,y+14,T,4); } // horizontal road center line
      }
      if (t===TILE.WATER) {
        ctx.fillStyle=(c+r+Math.floor(lastTime/400))%2===0?C.water:C.waterHi;
        ctx.fillRect(x,y,T,T);
      }
      if (t===TILE.SHOP)  { ctx.fillStyle=C.stone; ctx.fillRect(x,y,T,T); }
      if (t===6) { ctx.fillStyle=C.stoneHi; ctx.fillRect(x,y,T,T); } // temple
    }
  }
  // Temple pillars
  TEMPLE_COLS.forEach(([c,r])=>{
    const x=c*T+8, y=r*T;
    ctx.fillStyle=C.stoneHi; ctx.fillRect(x,y,10,T);
    ctx.fillStyle=C.stone;   ctx.fillRect(x+8,y,2,T);
    ctx.fillStyle='#fff8';   ctx.fillRect(x,y,10,3);
  });
}

function drawShops() {
  SHOPS.forEach(sh=>{
    const x=sh.col*T, y=(sh.row-1)*T;
    const w=T*2, h=T*2;
    // Wall
    ctx.fillStyle=C.shopWall; ctx.fillRect(x,y,w,h);
    // Roof
    ctx.fillStyle=sh.color;
    ctx.beginPath(); ctx.moveTo(x-4,y); ctx.lineTo(x+w+4,y); ctx.lineTo(x+w/2,y-16); ctx.closePath(); ctx.fill();
    // Door
    ctx.fillStyle=C.shopSign; ctx.fillRect(x+w/2-6,y+h-16,12,16);
    // Sign
    ctx.fillStyle=C.shopSign; ctx.fillRect(x+4,y+4,w-8,12);
    ctx.fillStyle=C.ui; ctx.font='6px monospace'; ctx.textAlign='center';
    ctx.fillText(sh.name,x+w/2,y+13);
    // Window
    ctx.fillStyle=C.carWin; ctx.fillRect(x+4,y+20,10,10);
    ctx.fillStyle=C.carWin; ctx.fillRect(x+w-14,y+20,10,10);
  });
}

function drawCar() {
  const {x,y,w,h} = car;
  // Body
  ctx.fillStyle=C.carRed;  ctx.fillRect(x,y+4,w,h-4);
  ctx.fillStyle=C.carDark; ctx.fillRect(x,y+h-4,w,4);
  // Roof
  ctx.fillStyle=C.carRed;  ctx.fillRect(x+4,y,w-8,8);
  // Windows
  ctx.fillStyle=C.carWin;  ctx.fillRect(x+5,y+1,w-10,7);
  // Wheels
  ctx.fillStyle=C.carWheel;
  ctx.fillRect(x+2,y+h-4,7,5); ctx.fillRect(x+w-9,y+h-4,7,5);
  // Chrome
  ctx.fillStyle=C.carChrome; ctx.fillRect(x,y+8,3,4); ctx.fillRect(x+w-3,y+8,3,4);
}

function drawSkeleton(x, y, dir, frame) {
  // Skull
  ctx.fillStyle=C.bone;     ctx.fillRect(x+3,y,8,8);
  ctx.fillStyle=C.boneDark; ctx.fillRect(x+3,y+6,8,2);
  // Eyes
  ctx.fillStyle=C.boneEye;
  if (dir==='left')  { ctx.fillRect(x+4,y+2,2,2); }
  else if (dir==='right') { ctx.fillRect(x+8,y+2,2,2); }
  else { ctx.fillRect(x+4,y+2,2,2); ctx.fillRect(x+8,y+2,2,2); }
  // Mouth
  ctx.fillStyle=C.boneEye;
  ctx.fillRect(x+4,y+6,2,1); ctx.fillRect(x+7,y+6,2,1);
  // Ribcage
  ctx.fillStyle=C.bone;     ctx.fillRect(x+3,y+8,8,6);
  ctx.fillStyle=C.boneDark;
  for(let i=0;i<3;i++) ctx.fillRect(x+3,y+9+i*2,8,1);
  // Pelvis
  ctx.fillStyle=C.bone;     ctx.fillRect(x+3,y+14,8,2);
  // Legs - animated
  ctx.fillStyle=C.bone;
  if (frame===0) {
    ctx.fillRect(x+3,y+16,3,6); ctx.fillRect(x+8,y+16,3,6);
  } else {
    ctx.fillRect(x+3,y+16,3,4); ctx.fillRect(x+3,y+20,3,2);
    ctx.fillRect(x+8,y+18,3,4);
  }
  // Arms
  ctx.fillStyle=C.bone;
  if (dir==='right') { ctx.fillRect(x+11,y+9,4,2); ctx.fillRect(x+2,y+9,2,4); }
  else if (dir==='left') { ctx.fillRect(x-2,y+9,4,2); ctx.fillRect(x+10,y+9,2,4); }
  else { ctx.fillRect(x+1,y+9,2,4); ctx.fillRect(x+11,y+9,2,4); }
  // Apron (chef look)
  ctx.fillStyle='#fff8'; ctx.fillRect(x+4,y+9,6,8);
}

function drawPlayer() {
  drawSkeleton(player.x, player.y, player.dir, player.animFrame);
}

function drawNPC(c) {
  const {x,y,skinColor,robeColor,state:cs} = c;
  // Body/robe
  ctx.fillStyle=robeColor; ctx.fillRect(x+1,y+6,10,10);
  // Head
  ctx.fillStyle=skinColor; ctx.fillRect(x+2,y,8,7);
  // Eyes
  ctx.fillStyle=C.boneEye; ctx.fillRect(x+4,y+2,2,2);
  // Speech bubble if waiting
  if (cs==='waiting') {
    ctx.fillStyle='#fff'; ctx.fillRect(x-10,y-18,32,12);
    ctx.fillStyle='#333'; ctx.font='7px monospace'; ctx.textAlign='center';
    const icon = c.type==='food'?'🍔':c.type==='haircut'?'✂':'🚗';
    ctx.fillText(c.type,x+6,y-9);
  }
}

function drawGuard(g) {
  const {x,y}=g;
  // Body armor
  ctx.fillStyle=C.guardArmor; ctx.fillRect(x+1,y+6,12,10);
  ctx.fillStyle=C.robe;       ctx.fillRect(x+3,y+14,8,6);
  // Helmet
  ctx.fillStyle=C.guardHelm;  ctx.fillRect(x+1,y,12,7);
  ctx.fillStyle=C.carRed;     ctx.fillRect(x+5,y-4,4,5); // plume
  // Face
  ctx.fillStyle=C.greek1;     ctx.fillRect(x+3,y+2,8,5);
  ctx.fillStyle=C.boneEye;    ctx.fillRect(x+4,y+3,2,2); ctx.fillRect(x+8,y+3,2,2);
  // Spear
  ctx.fillStyle=C.guardSpear; ctx.fillRect(x+13,y-6,2,24);
  ctx.fillStyle=C.carChrome;  ctx.fillRect(x+12,y-10,4,6);
}

function drawSocrates(s) {
  const {x,y,state:ss}=s;
  // Robe
  ctx.fillStyle=C.socRobe;  ctx.fillRect(x+1,y+6,12,14);
  // Head
  ctx.fillStyle=C.greek2;   ctx.fillRect(x+2,y,10,7);
  // Beard
  ctx.fillStyle=C.socBeard; ctx.fillRect(x+1,y+4,12,5);
  ctx.fillRect(x+2,y+7,10,4);
  // Eyes
  ctx.fillStyle=C.boneEye;  ctx.fillRect(x+4,y+2,2,2); ctx.fillRect(x+8,y+2,2,2);
  // Label
  ctx.fillStyle='#d4a017'; ctx.font='bold 7px monospace'; ctx.textAlign='center';
  ctx.fillText('Socrates',x+7,y-3);
  // Talking bubble
  if (ss==='talking') {
    ctx.fillStyle='#fff8';
    ctx.fillRect(x-20,y-26,54,14);
    ctx.fillStyle=C.socBeard; ctx.font='7px monospace';
    ctx.fillText('"Hmm..."',x+7,y-16);
  }
}

function drawHUD() {
  const y0=GH;
  ctx.fillStyle=C.hudBg;     ctx.fillRect(0,y0,GW,HUD);
  ctx.fillStyle=C.hudBorder; ctx.fillRect(0,y0,GW,2);

  // HP
  ctx.fillStyle=C.ui; ctx.font='9px monospace'; ctx.textAlign='left';
  ctx.fillText('HP',8,y0+14);
  for(let i=0;i<player.maxHp;i++){
    ctx.fillStyle=i<player.hp?C.hp:C.hpEmpty;
    ctx.fillRect(28+i*14,y0+6,10,10);
  }

  // Rep
  ctx.fillStyle=C.ui; ctx.fillText('REP',8,y0+30);
  for(let i=0;i<player.maxRep;i++){
    ctx.fillStyle=i<player.rep?C.rep:C.repEmpty;
    ctx.fillRect(36+i*10,y0+22,8,8);
  }

  // Gold & score
  ctx.fillStyle=C.ui; ctx.font='10px monospace'; ctx.textAlign='center';
  ctx.fillText(`GOLD: ${player.gold}`,GW/2,y0+16);
  ctx.fillText(`SCORE: ${score}`,GW/2,y0+32);

  // Wanted
  ctx.fillStyle=C.ui; ctx.font='9px monospace'; ctx.textAlign='right';
  ctx.fillText('WANTED',GW-8,y0+14);
  for(let i=0;i<5;i++){
    ctx.fillStyle=i<player.wanted?C.wanted:'#2a1010';
    ctx.fillRect(GW-8-(5-i)*14,y0+18,10,10);
  }

  // Controls hint
  ctx.fillStyle=C.uiMuted; ctx.font='8px monospace'; ctx.textAlign='right';
  ctx.fillText('WASD:move  E:interact  F:fight  R:car',GW-6,y0+46);
}

function drawInteractHint() {
  if (state!=='play') return;
  if (player.nearShop) {
    drawHint(`E — Enter ${player.nearShop.name}`);
  } else if (player.nearNPC && player.nearNPC!==socrates) {
    drawHint(`E — Serve ${player.nearNPC.name} (${player.nearNPC.type})`);
  } else if (socrates && socrates.state==='talking' && dist(player.cx,player.cy,socrates.cx,socrates.cy)<40) {
    drawHint('E — Talk to Socrates   F — Fight');
  } else if (!player.inCar && dist(player.cx,player.cy,car.x+car.w/2,car.y+car.h/2)<36) {
    drawHint('R — Get in car');
  } else if (player.inCar) {
    drawHint('R — Exit car');
  }
}

function drawHint(text) {
  ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(GW/2-120,GH-28,240,20);
  ctx.fillStyle=C.dialogTxt; ctx.font='10px monospace'; ctx.textAlign='center';
  ctx.fillText(text,GW/2,GH-14);
}

function drawDialog() {
  if (!dialogData||!socrates) return;
  const q=socrates.question;
  const bx=30,by=GH-180,bw=GW-60,bh=170;
  ctx.fillStyle=C.dialog;    ctx.fillRect(bx,by,bw,bh);
  ctx.strokeStyle=C.dialogBdr; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);

  ctx.fillStyle='#d4a017'; ctx.font='bold 10px monospace'; ctx.textAlign='left';
  ctx.fillText('SOCRATES',bx+10,by+16);

  ctx.fillStyle=C.dialogTxt; ctx.font='11px monospace';
  const lines=q.q.split('\n');
  lines.forEach((l,i)=>ctx.fillText(l,bx+10,by+34+i*14));

  ctx.fillStyle=C.rep;
  ctx.fillText(`[1] ${q.a1}`,bx+10,by+80);
  ctx.fillText(`[2] ${q.a2}`,bx+10,by+98);

  ctx.fillStyle=C.wanted;
  ctx.fillText('[F] Fight him',bx+10,by+120);

  ctx.fillStyle=C.uiMuted; ctx.font='9px monospace';
  ctx.fillText('Press 1, 2, or F',bx+10,by+140);
}

function drawShopUI() {
  if (!shopData) return;
  const sh=shopData.shop;
  const bx=60,by=GH/2-80,bw=GW-120,bh=160;
  ctx.fillStyle=C.dialog;    ctx.fillRect(bx,by,bw,bh);
  ctx.strokeStyle=C.dialogBdr; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);

  ctx.fillStyle=C.dialogTxt; ctx.font='bold 12px monospace'; ctx.textAlign='center';
  ctx.fillText(sh.name,GW/2,by+20);

  ctx.font='10px monospace';
  const items = {
    kitchen: ['Burger — 5g','Gyro — 4g','Coffee — 3g'],
    barber:  ['Haircut — 6g','Beard trim — 4g','Hot towel — 3g'],
    garage:  ['Oil change — 8g','Car wash — 5g','Tune-up — 10g'],
  }[sh.type]||[];
  items.forEach((item,i)=>{
    ctx.fillStyle=C.dialogTxt;
    ctx.fillText(item,GW/2,by+44+i*20);
  });

  ctx.fillStyle=C.uiMuted; ctx.font='9px monospace';
  ctx.fillText('E to close',GW/2,by+140);
}

function drawNotification() {
  if (notification.timer<=0) return;
  const a=Math.min(notification.timer/30,1);
  ctx.globalAlpha=a;
  ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(GW/2-140,20,280,22);
  ctx.fillStyle=C.dialogTxt; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText(notification.text,GW/2,35);
  ctx.globalAlpha=1;
}

function drawGameOver() {
  ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,GW,GH+HUD);
  ctx.fillStyle=C.wanted; ctx.font='bold 48px monospace'; ctx.textAlign='center';
  ctx.fillText('ARRESTED',GW/2,GH/2-30);
  ctx.fillStyle=C.ui; ctx.font='16px monospace';
  ctx.fillText('The guards got you.',GW/2,GH/2+10);
  ctx.fillText(`Score: ${score}  Gold: ${player.gold}`,GW/2,GH/2+34);
  ctx.fillStyle=C.uiMuted; ctx.font='12px monospace';
  ctx.fillText('Press R to try again',GW/2,GH/2+60);
}

// ── Restart ───────────────────────────────────
function restart() {
  Object.assign(player,{x:4*T,y:4*T,hp:5,rep:5,wanted:0,gold:20,inCar:false,dir:'down'});
  car.x=5*T; car.y=6*T; car.occupied=false;
  customers=[]; guards=[]; socrates=null;
  particles=[]; floatTexts=[];
  score=0; state='play'; socratesTimer=600;
  initWorld();
}

window.addEventListener('keydown',e=>{ if(e.code==='KeyR'&&state==='gameover') restart(); });

// ── Loop ──────────────────────────────────────
function loop(ts) { update(ts); render(); requestAnimationFrame(loop); }

initWorld();
requestAnimationFrame(loop);
