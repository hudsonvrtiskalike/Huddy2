// =====================
// WIZARD DUNGEON
// Top-down Zelda-style dungeon brawler
// Controls: WASD / Arrow Keys to move
//   Z = Fireball   (hold to charge = Mega Fireball)
//   X = Ice Shard  (hold to charge = Blizzard spread)
//   C = Lightning  (hold to charge = Chain all enemies)
//   V = Whirlwind  (hold to charge = Tornado AoE)
//   R = Restart
// =====================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TILE  = 32;
const COLS  = 20;
const ROWS  = 15;
const GW    = COLS * TILE;   // 640
const GH    = ROWS * TILE;   // 480
const HUD_H = 56;

canvas.width  = GW;
canvas.height = GH + HUD_H;

// ── Palette ──────────────────────────────────────────
const C = {
  floor1:    '#17172a',
  floor2:    '#1e1e30',
  wall:      '#2a2a3e',
  wallTop:   '#44445e',
  wallDark:  '#12121e',
  torch:     '#f97316',
  torchGlow: '#fbbf24',

  robe:      '#6d28d9',
  robeDark:  '#4c1d95',
  hat:       '#3b0764',
  skin:      '#fcd34d',
  eye:       '#1e1e2e',
  staff:     '#92400e',
  orb:       '#a78bfa',
  orbGlow:   '#c4b5fd',

  zGreen:    '#4ade80',
  zDark:     '#166534',
  zFast:     '#86efac',
  zTough:    '#15803d',
  zEye:      '#dc2626',
  zFrozen:   '#7dd3fc',

  fire:      '#f97316',
  fireCore:  '#fef08a',
  ice:       '#7dd3fc',
  iceCore:   '#e0f2fe',
  bolt:      '#fde047',
  boltCore:  '#ffffff',
  wind:      '#86efac',
  windCore:  '#dcfce7',

  hp:        '#ef4444',
  hpEmpty:   '#3f1515',
  hudBg:     '#0d0d1a',
  hudBorder: '#2d2d44',
  ui:        '#e8e8f0',
  uiMuted:   '#555570',
};

// ── Tilemap ───────────────────────────────────────────
const RAW = [
  '11111111111111111111',
  '10000000000000000001',
  '10000000000000000001',
  '10011000000000110001',
  '10011000000000110001',
  '10000000000000000001',
  '10000000000000000001',
  '10000000000000000001',
  '10000000000000000001',
  '10000000000000000001',
  '10011000000000110001',
  '10011000000000110001',
  '10000000000000000001',
  '10000000000000000001',
  '11111111111111111111',
];

const TORCHES = [[2,1],[17,1],[2,13],[17,13]];
const MAP = RAW.map(row => row.split('').map(Number));

function isWall(x, y) {
  const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  return MAP[r][c] === 1;
}
function rectHitsWall(x, y, w, h) {
  return isWall(x, y) || isWall(x+w-1, y) || isWall(x, y+h-1) || isWall(x+w-1, y+h-1);
}

// ── Spell definitions ─────────────────────────────────
const SPELLS = [
  { name:'Fireball',  key:'KeyZ', color:C.fire, core:C.fireCore, speed:5,   damage:1, radius:5,  cooldown:280, chargeDamage:3, chargeRadius:11, chargeSpeed:3.5, effect:null     },
  { name:'Ice Shard', key:'KeyX', color:C.ice,  core:C.iceCore,  speed:4,   damage:1, radius:4,  cooldown:380, chargeDamage:1, chargeRadius:7,  chargeSpeed:3,   effect:'freeze' },
  { name:'Lightning', key:'KeyC', color:C.bolt, core:C.boltCore, speed:9,   damage:2, radius:4,  cooldown:500, chargeDamage:2, chargeRadius:4,  chargeSpeed:9,   effect:'chain'  },
  { name:'Whirlwind', key:'KeyV', color:C.wind, core:C.windCore, speed:2.5, damage:1, radius:6,  cooldown:550, chargeDamage:1, chargeRadius:6,  chargeSpeed:2.5, effect:'push'   },
];

// ── Player ────────────────────────────────────────────
const player = {
  x: GW/2 - 8, y: GH/2 - 8,
  w: 16, h: 16,
  speed: 2.2,
  hp: 6, maxHp: 6,
  dir: 'down',
  iframes: 0,
  cooldowns: [0,0,0,0],
  chargeTime: [0,0,0,0],
  get cx() { return this.x + 8; },
  get cy() { return this.y + 8; },
};

// ── State ─────────────────────────────────────────────
let projectiles = [];
let enemies     = [];
let particles   = [];
let wave        = 0;
let waveTimer   = 0;
let score       = 0;
let state       = 'playing';
let announcement = { text:'', timer:0 };
let torchT      = 0;

// ── Input ─────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
       'KeyW','KeyA','KeyS','KeyD',
       'KeyZ','KeyX','KeyC','KeyV'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyR' && state === 'gameover') restart();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Helpers ───────────────────────────────────────────
function rnd(a, b) { return Math.random() * (b - a) + a; }

function dirVec() {
  switch (player.dir) {
    case 'up':   return [ 0,-1];
    case 'down': return [ 0, 1];
    case 'left': return [-1, 0];
    default:     return [ 1, 0];
  }
}

function spawnParticles(x, y, color, count, spd=2.5) {
  for (let i = 0; i < count; i++) {
    const a = rnd(0, Math.PI*2), s = rnd(0.5, spd);
    particles.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, color, life:rnd(20,50), maxLife:50, size:rnd(2,5) });
  }
}

function announce(text) { announcement.text = text; announcement.timer = 120; }

// ── Enemy factory ─────────────────────────────────────
function makeEnemy(x, y, type) {
  return {
    x, y, w:14, h:14, type,
    hp:    type==='tough'?4:1,
    maxHp: type==='tough'?4:1,
    speed: type==='fast'?2.2:type==='tough'?0.9:1.3,
    frozen:0, kbx:0, kby:0,
    get cx() { return this.x+7; },
    get cy() { return this.y+7; },
  };
}

function spawnWave(n) {
  const count = 3 + n * 2;
  for (let i = 0; i < count; i++) {
    let x, y;
    const side = Math.floor(rnd(0,4));
    if (side===0)      { x=rnd(TILE,GW-TILE*2); y=TILE+2; }
    else if (side===1) { x=rnd(TILE,GW-TILE*2); y=GH-TILE*2-2; }
    else if (side===2) { x=TILE+2;              y=rnd(TILE,GH-TILE*2); }
    else               { x=GW-TILE*2-2;         y=rnd(TILE,GH-TILE*2); }
    let type = 'basic';
    if (n >= 2) { const r=Math.random(); if(r<0.2) type='tough'; else if(r<0.4) type='fast'; }
    enemies.push(makeEnemy(x, y, type));
  }
  announce(`WAVE ${n}`);
}

// ── Casting ───────────────────────────────────────────
function onKill(e) {
  score += e.type==='tough'?30:e.type==='fast'?15:10;
  spawnParticles(e.cx, e.cy, C.zGreen, 14);
  if (e.type==='basic' && Math.random()<0.2) {
    for (let i=0;i<2;i++) enemies.push(makeEnemy(e.x+rnd(-10,10), e.y+rnd(-10,10), 'fast'));
  }
}

function fireProjectile(dx, dy, r, sp, dmg, spell) {
  projectiles.push({ x:player.cx, y:player.cy, vx:dx*sp, vy:dy*sp, r, damage:dmg, color:spell.color, core:spell.core, effect:spell.effect, life:140 });
}

function castSpell(idx, charged) {
  const spell = SPELLS[idx];
  const now = performance.now();
  if (player.cooldowns[idx] > now) return;
  player.cooldowns[idx] = now + (charged ? spell.cooldown*1.8 : spell.cooldown);

  const [dx, dy] = dirVec();
  const r   = charged ? spell.chargeRadius : spell.radius;
  const sp  = charged ? spell.chargeSpeed  : spell.speed;
  const dmg = charged ? spell.chargeDamage : spell.damage;

  if (charged && idx===2) {
    enemies.forEach(e => { e.hp -= dmg; spawnParticles(e.cx, e.cy, C.bolt, 10); });
    enemies = enemies.filter(e => { if (e.hp<=0){onKill(e);return false;} return true; });
    return;
  }
  if (charged && idx===3) {
    enemies.forEach(e => {
      if (Math.hypot(player.cx-e.cx, player.cy-e.cy) < 90) {
        e.hp -= dmg;
        const a = Math.atan2(e.cy-player.cy, e.cx-player.cx);
        e.kbx=Math.cos(a)*9; e.kby=Math.sin(a)*9;
        spawnParticles(e.cx, e.cy, C.wind, 6);
      }
    });
    enemies = enemies.filter(e => { if (e.hp<=0){onKill(e);return false;} return true; });
    spawnParticles(player.cx, player.cy, C.wind, 25, 4);
    return;
  }
  if (charged && idx===1) {
    for (let a=-1;a<=1;a++) {
      const angle = Math.atan2(dy,dx) + a*0.35;
      fireProjectile(Math.cos(angle), Math.sin(angle), r, sp, dmg, spell);
    }
    return;
  }
  fireProjectile(dx, dy, r, sp, dmg, spell);
}

// ── Update ────────────────────────────────────────────
let lastTime = 0;

function update(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  if (state !== 'playing') return;

  torchT = ts;

  // Player movement
  let mx=0, my=0;
  if (keys['ArrowUp']   ||keys['KeyW']) { my=-1; player.dir='up'; }
  if (keys['ArrowDown'] ||keys['KeyS']) { my= 1; player.dir='down'; }
  if (keys['ArrowLeft'] ||keys['KeyA']) { mx=-1; player.dir='left'; }
  if (keys['ArrowRight']||keys['KeyD']) { mx= 1; player.dir='right'; }
  if (mx && my) { mx*=0.707; my*=0.707; }
  const nx=player.x+mx*player.speed, ny=player.y+my*player.speed;
  if (!rectHitsWall(nx,player.y,player.w,player.h)) player.x=nx;
  if (!rectHitsWall(player.x,ny,player.w,player.h)) player.y=ny;

  // Spells
  SPELLS.forEach((sp,i) => {
    if (keys[sp.key]) { player.chargeTime[i]+=dt; }
    else if (player.chargeTime[i]>0) { castSpell(i,player.chargeTime[i]>500); player.chargeTime[i]=0; }
  });

  // Projectiles
  projectiles = projectiles.filter(p => {
    p.x+=p.vx; p.y+=p.vy; p.life--;
    if (p.life<=0) return false;
    if (rectHitsWall(p.x-p.r, p.y-p.r, p.r*2, p.r*2)) { spawnParticles(p.x,p.y,p.color,5); return false; }
    let hit = false;
    const chained = new Set();
    for (const e of enemies) {
      if (Math.hypot(p.x-e.cx, p.y-e.cy) < p.r+7) {
        e.hp -= p.damage;
        spawnParticles(e.cx,e.cy,p.color,6);
        if (p.effect==='freeze') e.frozen=200;
        if (p.effect==='push') { const a=Math.atan2(e.cy-player.cy,e.cx-player.cx); e.kbx=Math.cos(a)*7; e.kby=Math.sin(a)*7; }
        if (p.effect==='chain') {
          chained.add(e);
          let nearest=null, nd=120;
          for (const e2 of enemies) {
            if (chained.has(e2)) continue;
            const d=Math.hypot(e.cx-e2.cx,e.cy-e2.cy);
            if (d<nd){nearest=e2;nd=d;}
          }
          if (nearest) { nearest.hp-=p.damage; chained.add(nearest); spawnParticles(nearest.cx,nearest.cy,C.bolt,6); }
        }
        hit=true; break;
      }
    }
    enemies = enemies.filter(e => { if(e.hp<=0){onKill(e);return false;} return true; });
    return !hit;
  });

  // Enemies
  for (const e of enemies) {
    if (Math.abs(e.kbx)>0.1||Math.abs(e.kby)>0.1) {
      e.kbx*=0.75; e.kby*=0.75;
      if (!rectHitsWall(e.x+e.kbx,e.y,e.w,e.h)) e.x+=e.kbx;
      if (!rectHitsWall(e.x,e.y+e.kby,e.w,e.h)) e.y+=e.kby;
    }
    if (e.frozen>0) { e.frozen--; continue; }
    const ex=player.cx-e.cx, ey=player.cy-e.cy, d=Math.hypot(ex,ey);
    if (d>0) {
      const nmx=(ex/d)*e.speed, nmy=(ey/d)*e.speed;
      if (!rectHitsWall(e.x+nmx,e.y,e.w,e.h)) e.x+=nmx;
      if (!rectHitsWall(e.x,e.y+nmy,e.w,e.h)) e.y+=nmy;
    }
    if (player.iframes<=0 && e.x<player.x+player.w && e.x+e.w>player.x && e.y<player.y+player.h && e.y+e.h>player.y) {
      player.hp--; player.iframes=90;
      spawnParticles(player.cx,player.cy,C.hp,10);
      if (player.hp<=0) { state='gameover'; return; }
    }
  }
  if (player.iframes>0) player.iframes--;

  // Particles
  particles = particles.filter(p => { p.x+=p.vx;p.y+=p.vy;p.vx*=0.9;p.vy*=0.9; return --p.life>0; });

  // Waves
  waveTimer--;
  if (enemies.length===0||waveTimer<=0) { wave++; waveTimer=420; spawnWave(wave); }

  if (announcement.timer>0) announcement.timer--;
}

// ── Render ────────────────────────────────────────────
function drawMap() {
  for (let r=0;r<ROWS;r++) {
    for (let c=0;c<COLS;c++) {
      const x=c*TILE, y=r*TILE;
      if (MAP[r][c]===1) {
        ctx.fillStyle=C.wall;     ctx.fillRect(x,y,TILE,TILE);
        ctx.fillStyle=C.wallTop;  ctx.fillRect(x,y,TILE,5);
        ctx.fillStyle=C.wallDark; ctx.fillRect(x+TILE-3,y+5,3,TILE-5);
        ctx.fillRect(x,y+TILE-3,TILE,3);
      } else {
        ctx.fillStyle=(c+r)%2===0?C.floor1:C.floor2;
        ctx.fillRect(x,y,TILE,TILE);
        ctx.fillStyle='rgba(0,0,0,0.12)';
        ctx.fillRect(x,y,TILE,1); ctx.fillRect(x,y,1,TILE);
      }
    }
  }
}

function drawTorches() {
  const flicker = Math.sin(torchT/180)*0.25+0.75;
  TORCHES.forEach(([c,r]) => {
    const x=c*TILE+TILE/2, y=r*TILE+TILE/2;
    const grd=ctx.createRadialGradient(x,y,2,x,y,TILE*1.6);
    grd.addColorStop(0,`rgba(249,115,22,${0.4*flicker})`);
    grd.addColorStop(1,'rgba(249,115,22,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x,y,TILE*1.6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#78350f'; ctx.fillRect(x-2,y-3,4,9);
    ctx.fillStyle=C.torchGlow; ctx.fillRect(x-3,y-8,6,6);
    ctx.fillStyle=C.torch;    ctx.fillRect(x-2,y-10,4,5);
  });
}

function drawWizard() {
  const {x,y,dir,iframes}=player;
  if (iframes>0&&Math.floor(iframes/5)%2===1) return;

  ctx.fillStyle=C.robe;     ctx.fillRect(x+2,y+7,12,9);
  ctx.fillStyle=C.robeDark; ctx.fillRect(x+2,y+13,12,3);
  ctx.fillStyle=C.skin;     ctx.fillRect(x+4,y+3,8,6);
  ctx.fillStyle=C.hat;
  ctx.fillRect(x+2,y,12,4); ctx.fillRect(x+5,y-5,6,6); ctx.fillRect(x+6,y-8,4,4);

  ctx.fillStyle=C.eye;
  if (dir==='down')  { ctx.fillRect(x+5,y+5,2,2); ctx.fillRect(x+9,y+5,2,2); }
  if (dir==='up')    { ctx.fillRect(x+5,y+4,2,2); ctx.fillRect(x+9,y+4,2,2); }
  if (dir==='right') { ctx.fillRect(x+10,y+5,2,2); }
  if (dir==='left')  { ctx.fillRect(x+4,y+5,2,2); }

  ctx.fillStyle=C.staff;
  if (dir==='right')     { ctx.fillRect(x+14,y+4,3,12); }
  else if (dir==='left') { ctx.fillRect(x-3,y+4,3,12); }
  else                   { ctx.fillRect(x+13,y+1,3,14); }

  const ox = dir==='left'?x-2:x+16;
  const oy = dir==='up'?y-2:y+2;
  ctx.fillStyle=C.orbGlow; ctx.beginPath(); ctx.arc(ox,oy,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=C.orb;     ctx.beginPath(); ctx.arc(ox,oy,3,0,Math.PI*2); ctx.fill();
}

function drawZombie(e) {
  const col=e.frozen>0?C.zFrozen:e.type==='fast'?C.zFast:e.type==='tough'?C.zTough:C.zGreen;
  const drk=e.frozen>0?'#5bb5d8':C.zDark;
  ctx.fillStyle=col; ctx.fillRect(e.x+1,e.y+5,e.w-2,e.h-5);
  ctx.fillStyle=drk; ctx.fillRect(e.x+1,e.y+11,e.w-2,3);
  ctx.fillStyle=col; ctx.fillRect(e.x+2,e.y,e.w-4,7);
  ctx.fillStyle=e.frozen>0?'#fff':C.zEye;
  ctx.fillRect(e.x+3,e.y+2,2,2); ctx.fillRect(e.x+e.w-5,e.y+2,2,2);
  if (e.type==='tough') {
    ctx.fillStyle='#222'; ctx.fillRect(e.x,e.y-5,e.w,3);
    ctx.fillStyle=C.hp;  ctx.fillRect(e.x,e.y-5,e.w*(e.hp/e.maxHp),3);
  }
}

function drawProjectiles() {
  projectiles.forEach(p => {
    ctx.globalAlpha=0.35;
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.2,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=p.core;  ctx.beginPath(); ctx.arc(p.x,p.y,p.r*0.45,0,Math.PI*2); ctx.fill();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  });
  ctx.globalAlpha=1;
}

function drawHUD() {
  const y0=GH;
  ctx.fillStyle=C.hudBg;     ctx.fillRect(0,y0,GW,HUD_H);
  ctx.fillStyle=C.hudBorder; ctx.fillRect(0,y0,GW,2);

  // Hearts
  for (let i=0;i<player.maxHp;i++) {
    const hx=10+i*22, hy=y0+12;
    ctx.fillStyle=i<player.hp?C.hp:C.hpEmpty;
    ctx.fillRect(hx+3,hy,10,8); ctx.fillRect(hx,hy+2,16,6);
    ctx.fillRect(hx+2,hy+2,4,4); ctx.fillRect(hx+10,hy+2,4,4);
  }

  // Spell slots
  const now=performance.now();
  const sx0=GW/2-(SPELLS.length*40)/2;
  SPELLS.forEach((sp,i) => {
    const sx=sx0+i*42, sy=y0+8;
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(sx,sy,34,34);
    ctx.strokeStyle=player.chargeTime[i]>500?'#fff':C.hudBorder;
    ctx.lineWidth=2; ctx.strokeRect(sx,sy,34,34);
    ctx.fillStyle=sp.color; ctx.beginPath(); ctx.arc(sx+17,sy+16,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=sp.core;  ctx.beginPath(); ctx.arc(sx+17,sy+16,4,0,Math.PI*2); ctx.fill();
    const cd=player.cooldowns[i]-now;
    if (cd>0) { ctx.globalAlpha=0.65; ctx.fillStyle='#000'; ctx.fillRect(sx,sy,34,34*Math.min(cd/sp.cooldown,1)); ctx.globalAlpha=1; }
    ctx.fillStyle=C.ui; ctx.font='bold 9px monospace'; ctx.textAlign='center';
    ctx.fillText(['Z','X','C','V'][i],sx+17,sy+32);
    if (player.chargeTime[i]>0) { ctx.fillStyle=C.ui; ctx.fillRect(sx,sy+30,34*Math.min(player.chargeTime[i]/500,1),4); }
  });

  ctx.fillStyle=C.ui; ctx.font='bold 14px monospace'; ctx.textAlign='right';
  ctx.fillText(`SCORE  ${score}`,GW-12,y0+22);
  ctx.fillStyle=C.uiMuted; ctx.font='11px monospace';
  ctx.fillText(`WAVE ${wave}`,GW-12,y0+40);
}

function drawAnnouncement() {
  if (announcement.timer<=0) return;
  ctx.globalAlpha=Math.min(announcement.timer/30,1);
  ctx.fillStyle=C.bolt; ctx.font='bold 44px monospace'; ctx.textAlign='center';
  ctx.fillText(announcement.text,GW/2,GH/2-20);
  ctx.globalAlpha=1;
}

function drawGameOver() {
  ctx.fillStyle='rgba(0,0,0,0.78)'; ctx.fillRect(0,0,GW,GH+HUD_H);
  ctx.fillStyle=C.hp; ctx.font='bold 52px monospace'; ctx.textAlign='center';
  ctx.fillText('GAME OVER',GW/2,GH/2-30);
  ctx.fillStyle=C.ui; ctx.font='22px monospace';
  ctx.fillText(`Score: ${score}   Wave: ${wave}`,GW/2,GH/2+16);
  ctx.fillStyle=C.uiMuted; ctx.font='16px monospace';
  ctx.fillText('Press R to play again',GW/2,GH/2+50);
}

function render() {
  ctx.clearRect(0,0,GW,GH+HUD_H);
  drawMap(); drawTorches(); drawParticles();
  enemies.forEach(drawZombie);
  drawProjectiles(); drawWizard();
  drawHUD(); drawAnnouncement();
  if (state==='gameover') drawGameOver();
}

// ── Restart ───────────────────────────────────────────
function restart() {
  Object.assign(player,{x:GW/2-8,y:GH/2-8,hp:6,iframes:0,cooldowns:[0,0,0,0],chargeTime:[0,0,0,0],dir:'down'});
  projectiles=[]; enemies=[]; particles=[];
  wave=0; waveTimer=0; score=0; state='playing';
  wave++; waveTimer=420; spawnWave(wave);
}

// ── Loop ──────────────────────────────────────────────
function loop(ts) { update(ts); render(); requestAnimationFrame(loop); }

spawnWave(++wave);
waveTimer=420;
requestAnimationFrame(loop);
