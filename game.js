'use strict';
// =====================================================================
//  State
// =====================================================================
const SPELLS = {
  '1': {id:'fire',      name:'Fire',      cost:4, range:9,  col:[1.0,.5,.15], stopAtEnt:1},
  '2': {id:'lightning', name:'Lightning', cost:5, range:12, col:[.6,.8,1.0]},
  '3': {id:'frost',     name:'Frost',     cost:4, range:8,  col:[.55,.9,1.0]},
  '4': {id:'holy',      name:'Holy',      cost:6, range:10, col:[1.0,.9,.55], stopAtEnt:1},
};
const cost = k => Math.max(1, SPELLS[k].cost - (state.costDown || 0));
const knows = k => !!state.spells[SPELLS[k].id];
const spellKey = id => Object.keys(SPELLS).find(k => SPELLS[k].id === id);

// ---- weapons: three kinds, and Eli's stock gets better on every floor
const WEAPONS = {
  dagger: {name:'dagger', lo:1, hi:4, hit:3,  crit:18, mult:2, style:'stab',   price:10, note:'quick and precise · crits on 18-20'},
  sword:  {name:'sword',  lo:2, hi:6, hit:1,  crit:19, mult:2, style:'cleave', price:16, note:'balanced · crits on 19-20'},
  axe:    {name:'axe',    lo:3, hi:8, hit:-1, crit:20, mult:3, style:'cleave', price:20, note:'heavy and wild · crits hit ×3'},
};
const TIERS = ['', 'old', 'iron', 'steel', 'dwarf-forged', 'starmetal'];
function weaponStats(w = state.weapon){
  if (!w) return {name:'bare hands and tail', lo:1, hi:3, hit:0, crit:20, mult:2, style:'whip', note:'better than nothing, barely'};
  const B = WEAPONS[w.type], t = w.tier;
  return {name:`${TIERS[t]} ${B.name}`, lo:B.lo + 2 * (t - 1), hi:B.hi + 2 * (t - 1), hit:B.hit + (t - 1), crit:B.crit, mult:B.mult,
          style:B.style, note:B.note, price:Math.round(B.price * (1 + 1.6 * (t - 1)))};
}
const PLAYER_HIT = 4;
const playerHit = () => PLAYER_HIT + weaponStats().hit;
// ---- armour: no dodging, just a number your enemies have to beat
const GIFTS = [null,
  {slot:'body',  name:'leather jerkin',  ac:2},
  {slot:'head',  name:'fur-lined hood',  ac:1},
  {slot:'body',  name:'chain shirt',     ac:4},
  {slot:'head',  name:'iron helm',       ac:2},
  {slot:'cloak', name:'starweave cloak', ac:3},
];
const SLOTS = ['body', 'head', 'cloak'];
const playerAC = () => 10 + (state.acBonus || 0) + SLOTS.reduce((a, k) => a + (state.gear[k]?.ac || 0), 0);
const PRICES = {potion:12, mana:10};
const POTION_HEAL = 15, MANA_GAIN = 12;

let farv, fire, elecT, frostT, seen, vis, lumS, lr, lg, lb, snowAcc, danger;
let ents, player, npc, items, parts, wparts, bolts, projs, flashes, lights, msgs, state, dying, flies, slashes, pillars = [];
let level = null;
let shakeAmp = 0, phosphor = 0, hitStop = 0, screenFlashT = -1e9;
const PHOS = [ {name:'COLOR', tint:[1,1,1], mono:0} ];
let hover = null, hoverAny = null;
const W = {rain:0, snow:0, wind:0, dir:1};    // smoothed weather intensities

function mkEnt(type, x, y, extra){
  const d = MONS[type], lv = state?.floor || 1;
  const e = {type, ch:d.ch, name:d.name, col:d.col.slice(), hp:d.hp, maxhp:d.hp, dmg:d.dmg,
             x, y, vx:x, vy:y, anim:null, act:null, knock:null, hitT:-1e9, burning:0, frozen:0, poison:0, dead:false, seen:null,
             face:rnd() < .5 ? 1 : -1, seed:rnd() * 100, sz:1, s:d.s || 1, ac:d.ac ?? 9 + lv, hit:d.hit ?? 1 + lv,
             tf:{ox:0, oy:0, rot:0, sx:1, sy:1}};
  if (d.boss) { e.boss = true; e.sz = e.s > 1 ? 2 : 1.3; e.pt = 4; e.cd = 2; if (d.hydra) { e.heads = 3; e.stumps = 0; } }
  else if (!extra) {
    // individual variety
    const r = rnd();
    if (r < .2) { e.name = 'big ' + e.name; e.hp = e.maxhp = Math.ceil(d.hp * 1.5); e.dmg = d.dmg + 1; e.sz = 1.16; }
    else if (r < .35) { e.name = 'scrawny ' + e.name; e.hp = e.maxhp = Math.max(1, Math.floor(d.hp * .7)); e.sz = .88; }
  }
  const v = .88 + rnd() * .24; if (!d.boss) e.col = e.col.map((c, i) => clamp(c * (i === 1 ? v : 2 - v), 0, 1));
  if (extra) Object.assign(e, extra);
  return e;
}

// ---- a whole new run
function init(){
  dlg = null; inspect = null; packOpen = false;
  state = {turn:0, floor:1, seed:(rnd() * 1e9) | 0, targeting:null, dead:false, won:false, gold:20, travel:null, zone:-1,
           costDown:0, acBonus:0, belief:false, spells:{}, inv:{potion:1, mana:0}, keys:{}, weapon:null, gear:{}, quest:{}, eggs:0,
           weather:{type:'clear', until:30}, thunderT:-1e9,
           mem:{name:'friend', ch:0, lastTalk:-99, met:false, visited:{}, kills:0, idleI:0, echoUsed:{}, nextEcho:0, called:false}};
  msgs = [];
  player = mkEnt('rat', 0, 0);
  Object.assign(player, {ch:'@', name:'you', col:[1,1,.85], hp:24, maxhp:24, mp:20, maxmp:20, dmg:0, sz:1, s:1, isPlayer:true});
  log('AFTERGLOW // somewhere below, a stone that never dies', [.6,1,.7]);
  log('Move: keys/click. Right-click inspects. I: pack', [.55,.7,.55]);
  enterLevel(1);
}
// what you carry from floor to floor; also what comes back when you fall and try the floor again
const SNAP_KEYS = ['gold', 'costDown', 'acBonus', 'belief', 'spells', 'inv', 'keys', 'weapon', 'gear', 'quest', 'mem', 'prayed', 'eggs'];
function snapshot(){
  const P = player, o = {p:{hp:P.hp, maxhp:P.maxhp, mp:P.mp, maxmp:P.maxmp}, s:{}};
  for (const k of SNAP_KEYS) o.s[k] = state[k];
  state.snap = JSON.stringify(o);
}
function retryFloor(){
  const o = JSON.parse(state.snap);
  Object.assign(state, o.s, {dead:false, travel:null, targeting:null});
  player = mkEnt('rat', 0, 0);
  Object.assign(player, {ch:'@', name:'you', col:[1,1,.85], dmg:0, sz:1, s:1, isPlayer:true}, o.p);
  inspect = null; dlg = null; packOpen = false;
  log('You wake at the top of the stairs, aching, alive. Again.', [1,.85,.6]);
  enterLevel(state.floor, true);
}
// fresh per-floor buffers (shared by a new floor and a loaded save)
function allocLevel(n){
  const N = MW * MH, z = n - 1;
  zone = new Uint8Array(N).fill(z);
  fire = new Int8Array(N); elecT = new Float64Array(N).fill(-1e9); frostT = new Float64Array(N).fill(-1e9);
  seen = new Uint8Array(N); vis = new Uint8Array(N); farv = new Uint8Array(N); lumS = new Float32Array(N); danger = new Uint8Array(N);
  lr = new Float32Array(N); lg = new Float32Array(N); lb = new Float32Array(N);
  snowAcc = new Float32Array(N);
  if (z === Z.PASS) snowAcc.fill(.85);
  parts = []; wparts = []; bolts = []; projs = []; flashes = []; dying = []; flies = []; slashes = []; pillars = [];
}
function enterLevel(n, retry){
  state.floor = n;
  level = buildLevel(n, state.seed);
  allocLevel(n);
  const P = player;
  [P.x, P.y] = level.start; P.vx = P.x; P.vy = P.y; P.anim = P.act = P.knock = null;
  P.burning = P.frozen = P.poison = P.webbed = 0; P.dead = false;
  npc = mkEnt('rat', ...level.npc);
  Object.assign(npc, {ch:'@', name:'old man', col:[.86,.8,1], hp:99, maxhp:99, sz:1, s:1, npc:true, face:-1, home:level.npc.slice()});
  ents = [player, npc];
  for (const [t, x, y, ex] of level.spawns) ents.push(mkEnt(t, x, y, ex));
  items = level.items.map(o => ({...o}));
  altars = {}; for (const a of level.altars) altars[idx(a.x, a.y)] = a.deity;
  state.zone = -1; state.targeting = null; state.travel = null; state.bossSeen = false;
  if (!state.quest || state.quest.floor !== n) state.quest = {floor:n, stage:0};
  CX = clamp(P.x + .5 - WVW / 2, 0, MW - WVW); CY = clamp(P.y + .5 - WVH / 2, 0, MH - WVH);
  if (!retry) snapshot();
  rebuildLights(); computeFOV(); checkZone();
  saveGame();
  if (n > 1 && !retry) log(state.mem.knowsName ? 'Eli is already here, warming his hands. Of course he is.' : 'The old man is already here, warming his hands. Of course he is.', [.85,.8,1]);
}

// ---- the run lives in this browser's localStorage, so a refresh picks up where you left off
const SAVE_KEY = 'afterglow.save.v1';
const EPHEMERAL = {anim:1, act:1, knock:1, tf:1};
function saveGame(){
  if (!state || !level || !map) return;
  try {
    const fl = []; for (let i = 0; i < fire.length; i++) if (fire[i]) fl.push(i, fire[i]);
    const strip = e => { const o = {}; for (const k in e) if (!EPHEMERAL[k]) o[k] = e[k]; return o; };
    localStorage.setItem(SAVE_KEY, JSON.stringify({v:1, state:{...state, travel:null, targeting:null}, level, map, under, fire:fl,
      seen:Array.from(seen).join(''), ents:ents.filter(e => !e.dead || e.isPlayer).map(strip), items, altars, msgs:msgs.slice(-12)}));
  } catch (e) { /* private mode or full storage: just don't save */ }
}
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
function loadGame(){
  let d; try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!d || d.v !== 1) return false;
  try {
    state = Object.assign(d.state, {thunderT:-1e9, npcSpark:0}); level = d.level;
    allocLevel(level.n);
    map = d.map; under = d.under;
    for (let k = 0; k < d.fire.length; k += 2) fire[d.fire[k]] = d.fire[k + 1];
    for (let i = 0; i < d.seen.length; i++) seen[i] = d.seen.charCodeAt(i) === 49 ? 1 : 0;
    ents = d.ents.map(e => ({...e, vx:e.x, vy:e.y, anim:null, act:null, knock:null, hitT:-1e9, tf:{ox:0, oy:0, rot:0, sx:1, sy:1}}));
    player = ents.find(e => e.isPlayer); npc = ents.find(e => e.npc);
    if (!player || !npc) throw new Error('bad save');
    items = d.items; altars = d.altars; msgs = d.msgs || [];
    dlg = null; inspect = null; packOpen = false;
    CX = clamp(player.x + .5 - WVW / 2, 0, MW - WVW); CY = clamp(player.y + .5 - WVH / 2, 0, MH - WVH);
    rebuildLights(); computeFOV(); computeDanger();
    log('You pick up where you left off.', [.6,1,.7]);
    return true;
  } catch (e) { console.warn('could not load save', e); clearSave(); return false; }
}
addEventListener('pagehide', saveGame);

function log(text, col = [.7,.85,.7]){ msgs.push({text, col}); if (msgs.length > 40) msgs.shift(); }
function healPlayer(n, quiet){
  const P = player, before = P.hp; P.hp = Math.min(P.maxhp, P.hp + n);
  if (P.hp > before) part(P.x, P.y - .3, 0, -1.2, .9, '+' + (P.hp - before), [.5,1,.6], 1);
  if (!quiet && P.hp > before) Snd.potion();
}
function quaff(kind){
  const P = player;
  if (state.dead || state.won || projs.length) return;
  if (!(state.inv[kind] > 0)) { Snd.error(); log(kind === 'potion' ? 'You have no healing potions.' : 'You have no mana potions.', [.8,.5,.5]); return; }
  state.inv[kind]--;
  if (kind === 'potion') { healPlayer(POTION_HEAL, true); P.poison = 0; log('You drink a healing potion. Warmth spreads to your fingertips.', [1,.5,.6]); }
  else { P.mp = Math.min(P.maxmp, P.mp + MANA_GAIN); part(P.x, P.y - .3, 0, -1.2, .9, '+' + MANA_GAIN, [.5,.7,1], 1); log('You drink a mana potion. Your thoughts fizz.', [.6,.7,1]); }
  Snd.potion(); packOpen = false;
  endTurn();
}

// =====================================================================
//  Weather
// =====================================================================
const WEATHERS = [['clear',.34],['rain',.2],['snow',.13],['wind',.15],['storm',.1],['blizzard',.08]];
const WTARGET = {clear:{}, rain:{rain:1}, snow:{snow:1}, wind:{wind:1}, storm:{rain:1, wind:.85}, blizzard:{snow:1, wind:.9}};
const WMSG = {clear:'The sky clears.', rain:'A soft rain begins to fall.', snow:'Snow begins to drift down.', wind:'The wind picks up.',
              storm:'Thunder rumbles. A storm rolls in.', blizzard:'A blizzard howls in.'};
function tickWeather(){
  const w = state.weather;
  if (state.turn < w.until) return;
  let r = rnd(), next = 'clear';
  for (const [n, p] of WEATHERS) { if ((r -= p) < 0) { next = n; break; } }
  if (next === w.type) next = 'clear';
  w.type = next; w.until = state.turn + ri(35, 75); W.dir = rnd() < .5 ? -1 : 1;
  const z = zone[idx(player.x, player.y)];
  if (ZONES[z].outdoor) log(WMSG[next], [.7,.8,.9]);
}
// intensities as felt in a given zone
function localW(z){
  if (!ZONES[z].outdoor) return {rain:0, snow:0, wind:0};
  if (z === Z.PASS) return {rain:0, snow:Math.max(.22, W.snow, W.rain * .9), wind:Math.max(.25, W.wind)};
  if (z === Z.MIRE) return {rain:W.rain, snow:W.snow * .8, wind:W.wind * .7};
  return {rain:W.rain, snow:W.snow, wind:W.wind};
}
function weatherIs(n){
  const L = localW(zone[idx(player.x, player.y)]);
  if (n === 'storm') return state.weather.type === 'storm' && L.rain > .4;
  return (L[n] || 0) > .4;
}
const gust = (t, x) => Math.pow(.5 + .5 * Math.sin(x * .12 - t * 1.7 * W.dir + Math.sin(t * .3) * 2), 3);

// =====================================================================
//  LOS / FOV / Light
// =====================================================================
function los(x0, y0, x1, y1){
  let dx = Math.abs(x1-x0), dy = Math.abs(y1-y0), sx = x0<x1?1:-1, sy = y0<y1?1:-1, err = dx-dy, x = x0, y = y0;
  for (;;) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && TD[map[idx(x,y)]].opaque) return false;
    const e2 = 2*err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx)  { err += dx; y += sy; }
  }
}
function bline(x0, y0, x1, y1){
  const pts = [];
  let dx = Math.abs(x1-x0), dy = Math.abs(y1-y0), sx = x0<x1?1:-1, sy = y0<y1?1:-1, err = dx-dy, x = x0, y = y0;
  while (!(x === x1 && y === y1)) {
    const e2 = 2*err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx)  { err += dx; y += sy; }
    pts.push([x, y]);
  }
  return pts;
}
function computeContribs(lx, ly, r){
  const c = [], R = Math.ceil(r);
  for (let y = ly - R; y <= ly + R; y++) for (let x = lx - R; x <= lx + R; x++) {
    if (!inb(x, y)) continue;
    const d = Math.hypot(x - lx, (y - ly) * 1.2);
    if (d > r || !los(lx, ly, x, y)) continue;
    c.push(idx(x, y), Math.pow(1 - d / r, 1.4));
  }
  return c;
}
function addLight(x, y, r, col, int, fl){ lights.push({x, y, col, int, fl, seed:hash(idx(x,y))*50, c:computeContribs(x, y, r)}); }
function rebuildLights(){
  lights = [];
  const P = player, R = 34;
  for (let y = Math.max(0, P.y - R); y <= Math.min(MH - 1, P.y + R); y++)
    for (let x = Math.max(0, P.x - R); x <= Math.min(MW - 1, P.x + R); x++) {
      const i = idx(x, y), t = map[i];
      if (t === 'TORCH') addLight(x, y, 10, [1,.62,.3], 1.5, 1);
      else if (t === 'HEARTH' || t === 'CAMPFIRE') addLight(x, y, 9, [1,.58,.28], 1.6, 1);
      else if (t === 'RUNELIT') addLight(x, y, 7, [.55,.8,1], 1.4, 1);
      else if (t === 'GRAVEDONE') addLight(x, y, 4, [1,.7,.8], .8, 1);
      else if (t === 'EGGSAC') addLight(x, y, 2.5, [.8,.75,.5], .35, 1);
      else if (t === 'LAVA' && hash(i) < .4) addLight(x, y, 4, [1,.38,.1], .7, 2);
      else if (t === 'VENT') addLight(x, y, 3, [1,.5,.2], .6, 2);
      else if (t === 'ALTAR') { const D = altarDeity(i); addLight(x, y, 6, D ? D.col : [1,.8,.5], 1.3, 1); }
      if (fire[i] > 0) addLight(x, y, 4, [1,.45,.12], .9, 2);
    }
  for (const e of ents) {
    if (e.dead || cheb(e, P) > R) continue;
    if (e.burning > 0) addLight(e.x, e.y, 3, [1,.5,.15], .7, 2);
    const g = MONS[e.type]?.glow; if (g && !e.npc && !e.isPlayer) addLight(e.x, e.y, e.boss ? 6 : 3.5, g, e.boss ? 1.2 : .8, 1);
    if (e.phase === 'charge') addLight(e.x, e.y, 5 + (3 - e.pt) * 2, [1,.45,.12], 1 + (3 - e.pt) * .5, 2);
  }
  if (!P.dead) state.belief ? addLight(P.x, P.y, 7.5, [1,.85,.55], 1.05, 0) : addLight(P.x, P.y, 6, [.5,.58,.5], .85, 0);
  lumS.fill(0);
  for (const L of lights) { const m = Math.max(...L.col) * L.int; for (let j = 0; j < L.c.length; j += 2) lumS[L.c[j]] += L.c[j+1] * m; }
  for (let y = Math.max(0, P.y - R); y <= Math.min(MH - 1, P.y + R); y++)
    for (let x = Math.max(0, P.x - R); x <= Math.min(MW - 1, P.x + R); x++) { const i = idx(x, y); lumS[i] += dayLight(zone[i]); }
}
function flash(x, y, r, col, int, dur){ flashes.push({col, int, dur, t0:now(), c:computeContribs(x, y, r)}); }

// you see clearly in a circle of SIGHT tiles: everything (and everyone) in it.
// Past that, lit places in line of sight show only as dim shapes, and no monsters.
const SIGHT = 7.3;
const sightD = (x, y) => Math.hypot(x - player.x, y - player.y);
function computeFOV(){
  vis.fill(0); farv.fill(0);
  const P = player, R = 31;
  for (let y = Math.max(0, P.y - R); y <= Math.min(MH - 1, P.y + R); y++)
    for (let x = Math.max(0, P.x - R); x <= Math.min(MW - 1, P.x + R); x++) {
      if (los(P.x, P.y, x, y)) {
        const i = idx(x, y);
        if (sightD(x, y) <= SIGHT) { vis[i] = 1; seen[i] = 1; }
        else if (lumS[i] > .07) { farv[i] = 1; seen[i] = 1; }
      }
    }
}

// daylight under the open sky (dimmer in rain, gloomier in the mire)
function dayLight(z){
  if (!ZONES[z].outdoor) return 0;
  const base = z === Z.MIRE ? .3 : z === Z.PASS ? .5 : .55;
  return base * (1 - .35 * W.rain - .15 * W.snow);
}
const DAYCOL = {[Z.MIRE]:[.75,.9,.72], [Z.PASS]:[.85,.9,1.05]};
const AMB = .03;
function computeLight(t, tn){
  lr.fill(AMB); lg.fill(AMB); lb.fill(AMB);
  // inside your circle of sight the world is lighter, fading off at the rim
  { const P = player, R = Math.ceil(SIGHT);
    for (let y = Math.max(0, P.y - R); y <= Math.min(MH - 1, P.y + R); y++) for (let x = Math.max(0, P.x - R); x <= Math.min(MW - 1, P.x + R); x++) {
      const i = idx(x, y); if (!vis[i]) continue;
      const k = .07 + .17 * (1 - smooth(SIGHT - 2.5, SIGHT + .3, Math.hypot(x - P.vx, y - P.vy)));
      lr[i] += k; lg[i] += k * .97; lb[i] += k * .9;
    } }
  const x0 = Math.max(0, Math.floor(CX) - 1), x1 = Math.min(MW - 1, Math.floor(CX) + WVW + 1);
  const y0 = Math.max(0, Math.floor(CY) - 1), y1 = Math.min(MH - 1, Math.floor(CY) + WVH + 1);
  const th = tn - state.thunderT, thunder = th < 700 ? Math.exp(-th / 90) * 1.6 + (th > 160 ? Math.exp(-(th - 160) / 120) * 1.2 : 0) : 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = idx(x, y), z = zone[i], d = dayLight(z);
    if (!d && !thunder) continue;
    const c = DAYCOL[z] || [1,1,1], k = d + (ZONES[z].outdoor ? thunder : 0);
    lr[i] += c[0] * k; lg[i] += c[1] * k; lb[i] += c[2] * k;
  }
  for (const L of lights) {
    let k = L.int;
    if (L.fl === 1) k *= .78 + .3 * flick(t, L.seed);
    else if (L.fl === 2) k *= .55 + .5 * flick(t * 1.6, L.seed);
    const c = L.c, r = L.col[0]*k, g = L.col[1]*k, b = L.col[2]*k;
    for (let j = 0; j < c.length; j += 2) { const i = c[j], f = c[j+1]; lr[i] += r*f; lg[i] += g*f; lb[i] += b*f; }
  }
  flashes = flashes.filter(F => {
    const p = (tn - F.t0) / F.dur; if (p >= 1) return false;
    const k = F.int * (1 - p) * (1 - p), c = F.c;
    for (let j = 0; j < c.length; j += 2) { const i = c[j], f = c[j+1] * k; lr[i] += F.col[0]*f; lg[i] += F.col[1]*f; lb[i] += F.col[2]*f; }
    return true;
  });
  // fireflies: tiny moving lights, no shadows
  for (const f of flies) {
    const k = .35 * (.5 + .5 * Math.sin(t * 3 + f.ph));
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = Math.round(f.x) + dx, y = Math.round(f.y) + dy; if (!inb(x, y)) continue;
      const d = Math.hypot(x - f.x, y - f.y); if (d > 2.5) continue;
      const i = idx(x, y), q = k * (1 - d / 2.5); lr[i] += .7 * q; lg[i] += 1 * q; lb[i] += .35 * q;
    }
  }
}

// =====================================================================
//  Animation: moves, attacks, idles
// =====================================================================
// entities can be bigger than one tile (the bosses are 2x2); e.x/e.y is the top-left corner
const covers = (e, x, y) => x >= e.x && y >= e.y && x < e.x + e.s && y < e.y + e.s;
const entAt = (x, y) => ents.find(e => !e.dead && covers(e, x, y));
const cellsOf = e => { const c = []; for (let j = 0; j < e.s; j++) for (let i = 0; i < e.s; i++) c.push([e.x + i, e.y + j]); return c; };
const ctr = e => [e.x + (e.s - 1) / 2, e.y + (e.s - 1) / 2];
// the cell of a big entity nearest to a point
const nearCell = (e, x, y) => [clamp(x, e.x, e.x + e.s - 1), clamp(y, e.y, e.y + e.s - 1)];
const losE = (m, x, y) => cellsOf(m).some(([cx, cy]) => los(cx, cy, x, y));
const easeOutBack = p => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3*Math.pow(p-1,3) + c1*Math.pow(p-1,2); };
const S = Math.sin, PI = Math.PI;

const MOVES = {
  normal:{dur:160, hop:.25, wob:.28}, slide:{dur:230, hop:0, wob:0, squash:1}, heavy:{dur:250, hop:.12, wob:.12, thud:1},
  quick:{dur:110, hop:.12, wob:.2}, float:{dur:230, hop:0, wob:.1, sine:1}, leap:{dur:320, hop:.95, wob:.7},
};
function moveEnt(e, nx, ny, style){
  const D = MONS[e.type] || {};
  const m = style || (e.isPlayer || e.npc ? 'normal' : D.move || 'normal');
  if (nx !== e.x) e.face = Math.sign(nx - e.x);
  e.anim = {fx:e.vx, fy:e.vy, tx:nx, ty:ny, t0:now(), m, dir:e.face};
  e.x = nx; e.y = ny;
}

// attack styles: f(p, dx, dy, s) -> transform; hit = fraction of dur where the blow lands
const ATK = {
  whip:   {dur:360, hit:.55, ghosts:3, f:(p, dx, dy, s) => {
    if (p < .3) { const k = p / .3; return {ox:-dx*.12*k, oy:-dy*.12*k, rot:-.8*s*k, sx:1 - .1*k, sy:1 + .08*k}; }
    if (p < .72) { const k = (p - .3) / .42, e = k*k*(3 - 2*k), l = S(PI*k);
      return {ox:dx*.48*l, oy:dy*.48*l - .1*l, rot:s*(-.8 + (2*PI + 1)*e), sx:1 + .3*l, sy:1 - .15*l}; }
    const k = (p - .72) / .28; return {ox:0, oy:0, rot:s*(2*PI + .2*(1 - k)*S(k*9)), sx:1, sy:1}; }},
  bite:   {dur:260, hit:.25, f:(p, dx, dy, s) => { const k = Math.max(0, S(p*4*PI)) * (p < .5 ? 1 : .6);
    return {ox:dx*.38*k, oy:dy*.38*k, rot:s*.25*k, sx:1 + .25*k, sy:1 - .1*k}; }},
  stab:   {dur:300, hit:.55, f:(p, dx, dy, s) => {
    if (p < .4) { const k = p / .4; return {ox:-dx*.18*k, oy:-dy*.18*k, rot:-.4*s*k, sx:1, sy:1}; }
    const q = (p - .4) / .6, l = S(PI*q); return {ox:dx*(.62*l - .18*(1 - q)), oy:dy*(.62*l - .18*(1 - q)), rot:s*(-.4*(1 - q) + .6*l), sx:1 + .15*l, sy:1}; }},
  engulf: {dur:380, hit:.5, f:(p, dx, dy) => { const k = S(PI*p), hz = Math.abs(dx) >= Math.abs(dy);
    return {ox:dx*.45*k, oy:dy*.45*k, rot:0, sx:hz ? 1 + .9*k : 1 - .3*k, sy:hz ? 1 - .35*k : 1 + .9*k}; }},
  cleave: {dur:400, hit:.55, ghosts:2, f:(p, dx, dy, s) => {
    if (p < .35) { const k = p / .35; return {ox:-dx*.1*k, oy:-dy*.1*k - .12*k, rot:-1.3*s*k, sx:1 + .1*k, sy:1 + .1*k}; }
    const q = (p - .35) / .65, e = 1 - Math.pow(1 - Math.min(1, q * 1.6), 3), back = q > .62 ? (q - .62) / .38 : 0;
    return {ox:dx*.45*S(PI*q), oy:dy*.45*S(PI*q), rot:s*(-1.3 + 2.8*e)*(1 - back), sx:1, sy:1}; }},
  tongue: {dur:340, hit:.45, f:(p) => { const k = S(PI*p); return {ox:0, oy:0, rot:0, sx:1 + .2*k, sy:1 - .15*k, tongue:k}; }},
  latch:  {dur:360, hit:.5, f:(p, dx, dy) => { const k = S(PI*p), hz = Math.abs(dx) >= Math.abs(dy);
    return {ox:dx*.5*k, oy:dy*.5*k, rot:.4*S(p*6*PI), sx:hz ? 1 + .6*k : 1, sy:hz ? 1 : 1 + .6*k}; }},
  pounce: {dur:340, hit:.55, ghosts:3, f:(p, dx, dy, s) => { const k = S(PI*p), land = p > .55 ? S(PI*(p - .55)/.45) : 0;
    return {ox:dx*.65*k, oy:dy*.65*k - .55*k, rot:s*.9*k, sx:1 + .25*land, sy:1 - .3*land}; }},
  clap:   {dur:380, hit:.5, f:(p, dx, dy) => {
    if (p < .45) { const k = p / .45; return {ox:0, oy:0, rot:0, sx:1 - .6*k, sy:1 + .2*k}; }
    const q = (p - .45) / .55, b = S(PI*q); return {ox:dx*.3*b, oy:dy*.3*b, rot:0, sx:.4 + .6*q + 1*b, sy:1.2 - .2*q - .2*b}; }},
  swoop:  {dur:400, hit:.5, ghosts:3, f:(p, dx, dy, s) => { const k = S(PI*p), w = S(2*PI*p);
    return {ox:dx*.62*k - dy*.38*w, oy:dy*.62*k + dx*.38*w, rot:s*.5*w, sx:1, sy:1 + .2*k, fade:1}; }},
  spear:  {dur:320, hit:.55, f:(p, dx, dy) => { const a = Math.atan2(dy, dx) + PI/2, aim = Math.min(1, p / .25) * (p > .85 ? (1 - p) / .15 : 1);
    const th = p > .25 && p < .85 ? S(PI*(p - .25)/.6) : 0; return {ox:dx*.58*th, oy:dy*.58*th, rot:a*aim, sx:1, sy:1 + .3*th}; }},
  slam:   {dur:440, hit:.62, f:(p, dx, dy) => {
    if (p < .5) { const k = p / .5; return {ox:0, oy:-.6*k, rot:0, sx:1 + .35*k, sy:1 + .35*k}; }
    const q = (p - .5) / .5, l = S(PI*q); return {ox:dx*.42*l, oy:dy*.42*l - .6*Math.max(0, 1 - q*4), rot:0, sx:1 + .35*(1 - q) + .3*l, sy:1 + .35*(1 - q) - .5*l}; }},
  punch:  {dur:460, hit:.62, f:(p, dx, dy, s) => {
    if (p < .5) { const k = p / .5; return {ox:-dx*.2*k, oy:-dy*.2*k, rot:-.3*s*k, sx:1 + .55*k, sy:1 + .55*k}; }
    const q = (p - .5) / .5, l = S(PI*q); return {ox:dx*.55*l, oy:dy*.55*l, rot:-.3*s*(1 - q), sx:1 + .55*(1 - q), sy:1 + .55*(1 - q) - .3*l}; }},
  dive:   {dur:340, hit:.6, f:(p, dx, dy, s, t) => {
    const fl = .55 + .45*Math.abs(S(t*30));
    if (p < .4) { const k = p / .4; return {ox:0, oy:-.5*k, rot:0, sx:fl, sy:1}; }
    const q = (p - .4) / .6, l = S(PI*q); return {ox:dx*.58*l, oy:dy*.58*l - .5*(1 - q), rot:s*.6*l, sx:fl, sy:1}; }},
};
// idle styles: f(t, e) -> {ox, oy (px), rot, sx, sy}
const IDLES = {
  player: (t, e) => { const f = Math.pow(Math.max(0, S(t * .9 + e.seed)), 24);
    return {ox:0, oy:0, rot:.28 * S(t * 30) * f + .05 * e.face, sx:1, sy:1 + .035 * S(t * 2.2)}; },
  twitch: (t, e) => { const j = hash(Math.floor(t * 7) + e.seed) > .82; return {ox:j ? (hash(t * 99) - .5) * 3 : 0, oy:0, rot:0, sx:1, sy:1}; },
  bounce: (t, e) => { const b = Math.abs(S(t * 4 + e.seed)); return {ox:0, oy:-b * 2.6, rot:0, sx:1 + .05 * (1 - b), sy:1 - .05 * (1 - b)}; },
  jiggle: (t, e) => { const w = S(t * 3.3 + e.seed); return {ox:0, oy:w * 1.4, rot:0, sx:1 + .12 * w, sy:1 - .12 * w}; },
  breathe:(t, e) => { const w = S(t * 1.8 + e.seed); return {ox:0, oy:0, rot:0, sx:1 + .04 * w, sy:1 + .05 * w}; },
  throat: (t, e) => { const f = Math.pow(Math.max(0, S(t * 1.6 + e.seed)), 8); return {ox:0, oy:0, rot:0, sx:1 + .18 * f, sy:1 - .05 * f}; },
  wiggle: (t, e) => ({ox:3 * S(t * 4 + e.seed + 1), oy:0, rot:.28 * S(t * 4 + e.seed), sx:1, sy:1}),
  float:  (t, e) => ({ox:S(t * 1.3 + e.seed) * 2.5, oy:S(t * 2 + e.seed) * 4 - 2, rot:.12 * S(t + e.seed), sx:1, sy:1}),
  sway:   (t, e) => ({ox:0, oy:0, rot:.08 * S(t * 1.1 + e.seed), sx:1, sy:1}),
  pant:   (t, e) => ({ox:0, oy:0, rot:0, sx:1, sy:1 + .06 * S(t * 11 + e.seed)}),
  flicker:(t, e) => ({ox:(rnd() - .5) * 1.4, oy:(rnd() - .5) * 1.4, rot:.06 * S(t * 17 + e.seed), sx:1, sy:1 + .05 * S(t * 9)}),
  smolder:(t, e) => { const w = S(t * 1.2 + e.seed); return {ox:0, oy:0, rot:0, sx:1 + .05 * w, sy:1 + .05 * w}; },
  flap:   (t, e) => ({ox:S(t * 2 + e.seed) * 2, oy:S(t * 4 + e.seed) * 3 - 3, rot:0, sx:.5 + .5 * Math.abs(S(t * 14 + e.seed)), sy:1}),
  slither:(t, e) => ({ox:2 * S(t * 5 + e.seed + .6), oy:0, rot:.2 * S(t * 5 + e.seed), sx:1, sy:1}),
  rock:   (t, e) => ({ox:0, oy:S(t * 1.4) * 1, rot:.07 * S(t * 1.4), sx:1, sy:1}),
};

function updateEnt(e, t, tn){
  let x = e.x, y = e.y;
  const T = {ox:0, oy:0, rot:0, sx:1, sy:1, alpha:1, tongue:0};
  const D = MONS[e.type] || {};
  if (e.anim) {
    const a = e.anim, M = MOVES[a.m] || MOVES.normal, p = (tn - a.t0) / M.dur;
    if (p >= 1) {
      e.anim = null;
      if (M.thud && vis[idx(e.x, e.y)]) { shake(1.2); for (let k = 0; k < 3; k++) part(e.x + (rnd() - .5) * .8, e.y + .35, (rnd() - .5), -.3, .4, '.', [.6,.5,.4], 1); }
    } else {
      const k = M.sine ? .5 - .5 * Math.cos(PI * p) : easeOutBack(p), l = S(PI * p);
      x = a.fx + (a.tx - a.fx) * k; y = a.fy + (a.ty - a.fy) * k - M.hop * l;
      T.rot += l * M.wob * a.dir;
      if (M.squash) { T.sx *= 1 + .3 * l; T.sy *= 1 - .22 * l; }
    }
  }
  if (e.act) {
    const A = ATK[e.act.style], p = (tn - e.act.t0) / A.dur;
    if (p >= 1) e.act = null;
    else { const f = A.f(p, e.act.dx, e.act.dy, e.act.s, t);
      x += f.ox; y += f.oy; T.rot += f.rot; T.sx *= f.sx; T.sy *= f.sy; T.tongue = f.tongue || 0; if (f.fade) T.alpha = .6 + .4 * Math.abs(S(p * 20)); }
  }
  if (e.knock && tn >= e.knock.t0) {
    const p = (tn - e.knock.t0) / 260;
    if (p >= 1) e.knock = null;
    else { const k = (1 - p) * (1 - p); x += e.knock.dx * .22 * k; y += e.knock.dy * .22 * k; T.sx *= 1 + .25 * k; T.sy *= 1 - .2 * k; T.rot += e.knock.dx * .25 * k; }
  }
  const idle = (e.isPlayer ? IDLES.player : e.npc ? IDLES.rock : IDLES[D.idle]);
  if (idle && !e.frozen) { const f = idle(t, e); T.ox += f.ox / TW; T.oy += f.oy; T.rot += f.rot; T.sx *= f.sx; T.sy *= f.sy; }
  if (D.flip || e.isPlayer) T.sx *= e.face < 0 ? -1 : 1;
  T.sx *= e.sz; T.sy *= e.sz;
  e.vx = x; e.vy = y; e.tf = T;
}

function part(x, y, vx, vy, life, ch, col, g = 0, delay = 0, big = false){ if (parts.length < 1400) parts.push({x, y, vx, vy, life, max:life, ch, col, g, d:delay, big}); }
function ember(x, y, col = [1,.55,.15]){ part(x + (rnd()-.5)*.6, y - .2, (rnd()-.5)*.4, -1 - rnd()*1.2, .5 + rnd()*.6, rnd()<.5?'.':'\'', col, -.3); }
function steam(x, y){ Snd.sizzle(); for (let k = 0; k < 6; k++) part(x + (rnd()-.5)*.8, y, (rnd()-.5)*.6, -.6 - rnd()*.8, .8 + rnd()*.6, rnd()<.5?'°':'.', [.8,.85,.9], -.2); }
function frostBits(x, y){ for (let k = 0; k < 4; k++) part(x + (rnd()-.5)*.8, y + (rnd()-.5)*.8, (rnd()-.5)*.8, (rnd()-.5)*.8, .6 + rnd()*.5, rnd()<.5?'*':'·', [.7,.95,1]); }
function sparks(x, y, n = 4){ for (let k = 0; k < n; k++) { const a = rnd()*PI*2, s = 2 + rnd()*4; part(x, y, Math.cos(a)*s, Math.sin(a)*s, .25 + rnd()*.3, rnd()<.5?'+':'·', [.85,.92,1], 4); } }
function shatter(e){
  const chars = [e.ch, '.', ',', '\'', '`', ':'], [cx, cy] = ctr(e);
  for (let k = 0; k < 18 * e.s * e.s; k++) { const a = rnd()*PI*2, s = 1 + rnd()*4 * e.s;
    part(cx + (rnd() - .5) * (e.s - 1), cy + (rnd() - .5) * (e.s - 1), Math.cos(a)*s, Math.sin(a)*s - 1.5, .6 + rnd()*.7, chars[ri(0, chars.length-1)], e.col, 7); }
}
function shake(a){ shakeAmp = Math.max(shakeAmp, a); }

function damage(e, n, src, delay = 0, from = null, crit = false){
  if (e.dead) return;
  if (e.npc) {
    if (src !== 'melee' && now() - (state.npcSpark || 0) > 3000) { state.npcSpark = now();
      log(`${state.mem.knowsName ? 'Eli' : 'The old man'} brushes a spark off his sleeve. "Careful, now."`, [.8,.75,1]); }
    return;
  }
  const D = MONS[e.type] || {}, [cx, cy] = ctr(e);
  if (src === 'holy' && (e.isPlayer || !D.undead)) { if (!e.isPlayer) part(cx, cy - .3, 0, -1, .9, 'unharmed', [1,.9,.6], .5, delay / 1000); return; }
  if (!e.isPlayer && D.hydra) { hydraHit(e, n, src, delay, crit); return; }
  if (!e.isPlayer && D.immune?.[src]) { part(cx, cy - .3 - (e.s - 1) * .5, 0, -1, .9, 'immune', [.7,.7,.7], .5, delay / 1000); return; }
  if (!e.isPlayer && D.weak?.[src]) n *= D.weak[src];
  if (e.spent) n = Math.ceil(n * 1.5);
  e.hp -= n;
  const at = now() + delay;
  e.hitT = at;
  if (from) e.knock = {dx:Math.sign(e.x - from.x), dy:Math.sign(e.y - from.y), t0:at};
  if (crit) part(cx, cy - .4, (rnd()-.5)*.4, -2, 1.1, String(n), [1,.9,.3], 1.5, delay / 1000, true);
  else part(cx, cy - .3, (rnd()-.5)*.5, -1.6, .8, String(n), e.isPlayer ? [1,.3,.3] : [1,1,.8], 1.5, delay / 1000);
  if (delay) setTimeout(() => Snd.hit(!!e.isPlayer), delay); else Snd.hit(!!e.isPlayer);
  if (e.isPlayer) { setTimeout(() => shake(4), delay); if (state.travel && !state.travel.target) state.travel = null; }
  if (e.boss && !e.awake) wake(e);
  if (e.boss && D.title && !e.enraged && e.hp > 0 && e.hp < e.maxhp * .4 && e.type === 'matriarch') {
    e.enraged = true; e.dmg += 2; setTimeout(() => { Snd.roar(); shake(6); }, delay);
    log('Grukka bellows and froths. She is FURIOUS now, and hits harder.', [1,.45,.35]);
  }
  if (e.hp <= 0) kill(e, src, delay);
}
// the hydra has no use for hit points: cut its heads off. Cut one without fire and two grow back.
function hydraHit(e, n, src, delay, crit){
  const [cx, cy] = ctr(e), at = now() + delay;
  if (src === 'melee') {
    const cut = Math.min(e.heads, crit ? 2 : 1);
    e.heads -= cut; e.hitT = at;
    for (let k = 0; k < 12; k++) part(cx + (rnd() - .5), cy - .8, (rnd() - .5) * 4, -1 - rnd() * 2, .7, pick(['§', ',', '\'', '~']), [.45,.85,.45], 6, delay / 1000);
    if (e.burning > 0) {
      log(cut > 1 ? 'Two heads fly, and the flames sear both stumps shut. Cauterized!' : 'A head flies, and the flames sear the stump shut. Cauterized!', [1,.75,.35]);
      part(cx, cy - .6, 0, -1.2, 1, 'seared!', [1,.65,.25], .6, delay / 1000);
    } else {
      e.stumps += cut;
      log(cut > 1 ? 'You lop off two heads! The stumps writhe and bulge...' : 'You lop off a head! The stump writhes and bulges...', [.6,1,.6]);
      part(cx, cy - .6, 0, -1.2, 1, 'it writhes...', [.5,.9,.5], .6, delay / 1000);
    }
    if (delay) setTimeout(() => Snd.hit(false), delay); else Snd.hit(false);
    if (e.heads <= 0) { e.hp = 0; kill(e, 'melee', delay); }
  } else if (src === 'burn') {
    if (rnd() < .4) part(cx, cy - .6, 0, -1, .8, 'singed', [1,.6,.3], .5, delay / 1000);
  } else part(cx, cy - .6, 0, -1, .9, 'the heads just hiss', [.7,.8,.7], .5, delay / 1000);
  if (!e.awake) wake(e);
}
function kill(e, src, delay = 0){
  e.dead = true;
  dying.push({e, at:now() + delay});
  setTimeout(() => e.isPlayer ? Snd.gameover() : Snd.death(), delay);
  if (e.isPlayer) { state.dead = true; log('You fall. Press R to try this floor again. (He would tell you to.)', [1,.35,.3]); return; }
  state.mem.kills++;
  const verb = e.type === 'hydra' ? 'collapses, headless at last' : src === 'holy' ? 'crumbles to bright dust' : src === 'shock' ? 'is fried' : src === 'burn' ? 'burns to a crisp'
    : src === 'melee' && e.frozen ? 'shatters into ice shards' : 'dies';
  log(`${e.boss ? capF(e.name) : 'The ' + e.name} ${verb}.`, [.9,.9,.7]);
  const drop = (kind, extra) => { const [x, y] = nearCell(e, player.x, player.y); items.push({x, y, kind, ...extra}); };
  if (e.carry) { drop(e.carry); log(`Something glints where it fell: ${ITEMS[e.carry].name}!`, [.85,.9,1]); }
  else if (!e.boss && !e.minion && rnd() < .3) drop('gold');
  if (e.boss) bossDown(e);
}
const BOSS_SPELL = {matriarch:'fire', brood:'lightning', hydra:'frost', dragon:'holy'};
function bossDown(e){
  const [cx, cy] = ctr(e);
  setTimeout(() => { shake(10); flash(e.x, e.y, 9, [1,.9,.6], 3, 1400); Snd.win(); }, 300);
  state.bossSeen = false;
  if (BOSS_SPELL[e.type]) { items.push({x:e.x, y:e.y, kind:'tome', spell:BOSS_SPELL[e.type]}); log('Something heavy thumps to the floor: a book, bound in old leather and humming.', [1,.9,.55]); }
  if (e.type === 'lich') {
    items.push({x:e.x, y:e.y, kind:'stone'});
    for (const m of ents) if (m.minion && !m.dead) kill(m, 'shock', 200);
    log('The king comes apart like a dropped vase. Where his heart was, something glows.', [1,.95,.8]);
  }
  if (e.type === 'dragon') items.push({x:e.x + 1, y:e.y, kind:'gold'}, {x:e.x, y:e.y + 1, kind:'gold'}, {x:e.x + 1, y:e.y + 1, kind:'potion'});
  player.maxhp += 4; healPlayer(8, true);
  log('You feel tougher for having lived through that. (+4 max HP)', [1,.85,.6]);
  if (level.exit) {
    const [x, y] = level.exit; map[idx(x, y)] = 'STAIRS';
    setTimeout(() => { flash(x, y, 6, [1,1,.6], 2.5, 1600); Snd.zone(); }, 700);
    log('Stone grinds on stone. A way down opens.', [1,1,.6]);
  }
}
function wake(m){
  if (m.awake) return;
  m.awake = true; state.bossSeen = true;
  m.seen = [player.x, player.y];
  Snd.roar(); shake(5);
  const D = MONS[m.type];
  log(`${capF(m.name)}, ${D.title}, ${{matriarch:'heaves herself up and roars', brood:'unfolds from the dark, leg by leg',
    hydra:'lifts three heads out of the reeds', dragon:'opens one molten eye', lich:'turns, slowly, and smiles'}[m.type] || 'wakes'}.`, [1,.6,.45]);
}

// =====================================================================
//  Turn logic: to-hit rolls against armour class, critical hits
// =====================================================================
function rollHit(a, d){
  const nat = ri(1, 20);
  if (nat === 1) return {hit:false, nat};
  const bonus = a.isPlayer ? playerHit() : a.hit;
  const ac = d.isPlayer ? playerAC() : d.frozen ? Math.min(d.ac, 6) : d.ac;
  const critOn = a.isPlayer ? weaponStats().crit : 20;
  const hit = nat === 20 || nat + bonus >= ac;
  return {hit, crit:hit && nat >= critOn, nat};
}
function attack(a, d, extraDelay = 0){
  const Wp = a.isPlayer ? weaponStats() : null;
  const D = a.isPlayer ? {atk:Wp.style} : MONS[a.type];
  const style = ATK[D.atk] ? D.atk : 'stab', A = ATK[style];
  const [ax, ay] = nearCell(a, d.x, d.y), [tx, ty] = nearCell(d, ax, ay);
  const dx = Math.sign(tx - ax), dy = Math.sign(ty - ay);
  const go = () => {
    a.act = {style, t0:now(), dx, dy, s:dx || a.face || 1};
    if (dx) a.face = dx;
    if (style === 'whip') Snd.whip(); else Snd.swing();
    if (style === 'tongue') Snd.tongue();
  };
  if (extraDelay) setTimeout(go, extraDelay); else go();
  const delay = A.dur * A.hit + extraDelay;
  if (a.isPlayer && MONS[d.type]?.immune?.melee) {
    log(`Your ${state.weapon ? 'blade' : 'tail'} passes right through the ${d.name}, like a hand through fog.`, [.7,.75,.85]);
    damage(d, 1, 'melee', delay, a); return;
  }
  const r = rollHit(a, d);
  if (!r.hit) {
    setTimeout(() => { Snd.miss(); const [cx, cy] = ctr(d); part(cx, cy - .3, (rnd() - .5) * .6, -1.2, .7, 'miss', [.6,.65,.6], 1); }, delay);
    log(a.isPlayer ? pick([`You miss the ${d.name}.`, `The ${d.name} turns your blow on its hide.`, `Your swing goes wide of the ${d.name}.`])
                   : `The ${a.name} ${a.boss ? 'misses' : pick(['misses you', 'glances off your armour'])}.`, a.isPlayer ? [.6,.65,.6] : [.75,.8,.7]);
    if (a.isPlayer && d.boss && !d.awake) wake(d);
    return;
  }
  if (style === 'slam' || style === 'punch') setTimeout(() => { shake(5); Snd.slam();
    for (let k = 0; k < 6; k++) part(d.x + (rnd() - .5), d.y + .3, (rnd() - .5) * 3, -rnd() * 2, .5, '.', [.7,.6,.5], 5); }, delay);
  if (r.crit) critFX(d, delay);
  if (a.isPlayer) {
    let dmg = ri(Wp.lo, Wp.hi) * (d.frozen ? 2 : 1) * (r.crit ? Wp.mult : 1);
    const what = state.weapon ? `your ${Wp.name}` : 'your tail';
    log(r.crit ? pick([`CRITICAL! You drive ${what} home into the ${d.name}!`, `CRITICAL! A perfect strike on the ${d.name}!`])
      : d.frozen ? `You strike the frozen ${d.name}. It cracks!`
      : state.weapon ? pick([`You hit the ${d.name}.`, `You cut the ${d.name}.`, `${capF(what)} bites into the ${d.name}.`])
      : pick([`Your tail whips the ${d.name}.`, `You lash the ${d.name}.`, `You spin and strike the ${d.name}.`]), r.crit ? [1,.88,.4] : undefined);
    damage(d, dmg, 'melee', delay, a, r.crit);
  } else {
    let dmg = a.dmg + ri(0, a.boss ? 2 : 1);
    if (r.crit) dmg *= 2;
    log(`${r.crit ? 'CRITICAL! ' : ''}${a.boss ? capF(a.name) : 'The ' + a.name} ${{bite:'bites', stab:'stabs', engulf:'engulfs', cleave:'cleaves', tongue:'lashes its tongue at', latch:'latches onto',
      pounce:'pounces on', clap:'claps its great hands on', swoop:'swoops through', spear:'jabs', slam:'slams', punch:'smashes', dive:'dives at',
      whip:'tail-whips'}[style] || 'hits'} you.`, r.crit ? [1,.35,.3] : [1,.6,.5]);
    damage(d, dmg, 'melee', delay, a, r.crit);
    if (D.drain && !a.dead) { a.hp = Math.min(a.maxhp, a.hp + dmg); }
    if (D.poison && !d.dead) { if (!d.poison) setTimeout(() => Snd.poison(), delay); d.poison = Math.max(d.poison, D.poison);
      log('Venom burns in the wound. You are poisoned!', [.6,1,.4]); }
  }
}
// crits get the works: a white slash, a starburst, a jolt, a moment where time holds its breath
function critFX(e, delay){
  setTimeout(() => {
    const [cx, cy] = ctr(e);
    flash(e.x, e.y, 6, [1,.92,.7], 3.2, 520);
    shake(e.isPlayer ? 7 : 9); hitStop = now() + 110; screenFlashT = now();
    slashes.push({x:cx, y:cy, a:-.6 + rnd() * .4 + (rnd() < .5 ? PI : 0), t0:now(), dur:340, len:.9 + e.s * .55, col:e.isPlayer ? [1,.35,.3] : [1,.95,.75]});
    for (let k = 0; k < 26; k++) { const a = rnd() * PI * 2, s = 3 + rnd() * 6;
      part(cx, cy, Math.cos(a) * s, Math.sin(a) * s, .35 + rnd() * .4, pick(['*', '+', '·', 'x']), e.isPlayer ? [1, .4 + rnd() * .3, .3] : [1, .85 + rnd() * .15, .4 + rnd() * .4], 3); }
    part(cx, cy - .9 - (e.s - 1) * .5, 0, -.9, 1.2, e.isPlayer ? 'OUCH!' : 'CRITICAL!', e.isPlayer ? [1,.4,.35] : [1,.9,.35], .3, 0, true);
    Snd.crit();
  }, delay);
}

const blocksFor = (m, i) => { const t = map[i], d = TD[t];
  if (d.lava && MONS[m.type]?.lavawalk) return false;
  if (MONS[m.type]?.dry && d.water) return true;
  return d.block && t !== 'DOOR'; };
// can m stand with its top-left corner at (nx, ny)?
function fits(m, nx, ny){
  for (let j = 0; j < m.s; j++) for (let i = 0; i < m.s; i++) {
    const x = nx + i, y = ny + j; if (!inb(x, y)) return false;
    if (blocksFor(m, idx(x, y)) || (m.s > 1 && map[idx(x, y)] === 'DOOR')) return false;
    const o = entAt(x, y); if (o && o !== m) return false;
  }
  return true;
}
function tryStep(m, nx, ny, style){
  if (!inb(nx, ny)) return false;
  const i = idx(nx, ny);
  if (m.s === 1 && map[i] === 'DOOR') { map[i] = 'OPEN'; if (vis[i]) Snd.door(); return true; }
  if (!fits(m, nx, ny)) return false;
  if (m.npc && cheb({x:nx, y:ny}, {x:m.home[0], y:m.home[1]}) > 2) return false;
  moveEnt(m, nx, ny, style); return true;
}
function stepToward(m, tx, ty){
  const T = {x:tx, y:ty}, cur = cheb(m, T);
  let best = null, bs = 1e9;
  for (const [dx, dy] of DIR8) {
    const nx = m.x + dx, ny = m.y + dy;
    if (!fits(m, nx, ny)) continue;
    const i = idx(nx, ny);
    const s = cheb({x:nx, y:ny, s:m.s}, T) + (fire[i] && !MONS[m.type]?.immune?.burn ? 4 : 0) + rnd()*.2;
    if (s < bs) { bs = s; best = [nx, ny]; }
  }
  if (best && bs <= cur + .2) return tryStep(m, best[0], best[1]);
  return false;
}
function monsterAct(m){
  if (m.npc) { if (rnd() < .04 && cheb(m, player) > 1) { const [dx, dy] = pick(DIR8); tryStep(m, m.x + dx, m.y + dy); } return; }
  const D = MONS[m.type];
  if (D.boss && !m.awake) {
    const B = level.bossRoom, inRoom = B && player.x >= B.x && player.y >= B.y && player.x < B.x + B.w && player.y < B.y + B.h;
    if (inRoom || (canSee(m) && cheb(m, player) <= 7)) wake(m); else return;
  }
  if (m.frozen > 0) { m.frozen--; if (!m.frozen && vis[idx(m.x, m.y)]) log(`${m.boss ? capF(m.name) : 'The ' + m.name} thaws out.`); return; }
  if (D.hydra) { hydraAct(m); return; }
  if (m.type === 'dragon') { dragonAct(m); return; }
  if (m.type === 'lich') { lichAct(m); return; }
  if (m.type === 'brood' && broodAct(m)) return;
  if (D.slow && state.turn % 2) return;
  if (D.regen && m.hp < m.maxhp && !m.burning && state.turn - (m.burnT || -99) > 3) {
    m.hp++; if (canSee(m) && rnd() < .3) part(m.x, m.y - .3, 0, -.8, .7, '+', [.5,1,.5], .5);
  }
  for (let n = D.fast ? 2 : 1; n > 0 && !m.dead && !player.dead && !m.frozen; n--) actOnce(m, D);
}
function actOnce(m, D){
  const P = player, d = cheb(m, P);
  if (d <= 9 && losE(m, P.x, P.y)) {
    if (!m.seen && canSee(m)) { Snd.alert(); if (D.howl) Snd.howl(); if (m.type === 'frog') Snd.croak(); }
    m.seen = [P.x, P.y];
  }
  if (D.erratic && rnd() < D.erratic && !(d === 1 && m.seen)) { const [dx, dy] = pick(DIR8); tryStep(m, m.x + dx, m.y + dy); return; }
  if (m.seen) {
    if (d === 1 && m.seen[0] === P.x && m.seen[1] === P.y) { attack(m, P); return; }
    if (D.leap && d >= 3 && rnd() < .6) {
      const dx = Math.sign(P.x - m.x), dy = Math.sign(P.y - m.y), ax = m.x + dx, ay = m.y + dy, bx = m.x + 2*dx, by = m.y + 2*dy;
      if (inb(bx, by) && !blocksFor(m, idx(ax, ay)) && !blocksFor(m, idx(bx, by)) && !entAt(bx, by) && !entAt(ax, ay) && map[idx(bx, by)] !== 'DOOR') {
        moveEnt(m, bx, by, 'leap'); if (vis[idx(bx, by)]) Snd.croak(); return; }
    }
    stepToward(m, m.seen[0], m.seen[1]);
    if (covers(m, m.seen[0], m.seen[1])) m.seen = null;
  } else if (rnd() < .3 && !m.boss) { const [dx, dy] = pick(DIR8); tryStep(m, m.x + dx, m.y + dy); }
}

// ---------------- the bosses ----------------
function hydraAct(m){
  if (m.stumps > 0) {
    const grow = Math.min(9 - m.heads, m.stumps * 2);
    m.heads += grow; m.stumps = 0;
    if (grow > 0) { log(grow > 2 ? `${grow} new heads burst, hissing, from the stumps!` : 'Two new heads burst, hissing, from the stump!', [.6,1,.5]); Snd.roar(); shake(3); }
  }
  const P = player, d = cheb(m, P);
  if (d === 1) {
    const bites = Math.min(m.heads, 4);
    for (let k = 0; k < bites && !P.dead; k++) attack(m, P, k * 140);
    return;
  }
  if (state.turn % 2 === 0) { m.seen = [P.x, P.y]; stepToward(m, P.x, P.y); }
}
// the dragon fights a few turns, then breathes: everything it can see burns. Hide behind something.
function dragonAct(m){
  const P = player;
  if (m.phase === 'charge') {
    m.pt--;
    if (m.pt <= 0) { dragonBreath(m); m.phase = 'spent'; m.pt = 3; m.spent = true; return; }
    Snd.charge(); shake(2);
    log(m.pt === 1 ? 'Cinder\'s throat glows white-hot. HIDE!' : 'Cinder draws in a long, roaring breath. Its chest is glowing...', [1,.6,.3]);
    return;
  }
  if (m.phase === 'spent') {
    m.pt--;
    if (m.pt <= 0) { m.phase = null; m.spent = false; m.pt = ri(3, 5); log('Cinder shakes the smoke out of its head.', [1,.7,.5]); }
    else if (rnd() < .5) part(m.x + 1, m.y - .3, (rnd() - .5) * .4, -.8, 1.4, '°', [.6,.6,.6], -.1);
    return;
  }
  m.pt--;
  if (m.pt <= 0) { m.phase = 'charge'; m.pt = 3; Snd.roar(); log('Cinder rears back and sucks in air. Its chest begins to glow. Get behind something!', [1,.55,.25]); return; }
  m.seen = [P.x, P.y];
  if (cheb(m, P) === 1) attack(m, P); else stepToward(m, P.x, P.y);
}
function dragonMouth(m){ return nearCell(m, player.x, player.y); }
function breathCells(m){
  const [mx, my] = dragonMouth(m), out = [];
  for (let y = my - 12; y <= my + 12; y++) for (let x = mx - 12; x <= mx + 12; x++) {
    if (!inb(x, y) || covers(m, x, y) || Math.hypot(x - mx, y - my) > 12.5) continue;
    if (TD[map[idx(x, y)]].opaque) continue;
    if (los(mx, my, x, y)) out.push([x, y]);
  }
  return out;
}
function dragonBreath(m){
  const cells = breathCells(m), [mx, my] = dragonMouth(m), P = player;
  Snd.boom(); Snd.whoosh(); shake(12);
  flash(mx, my, 12, [1,.5,.15], 3.5, 1100);
  log('Cinder BREATHES. The hall fills with fire!', [1,.5,.2]);
  let hitP = false;
  for (const [x, y] of cells) {
    const i = idx(x, y), d = Math.hypot(x - mx, y - my);
    if (rnd() < .5) part(x + (rnd() - .5) * .6, y + (rnd() - .5) * .6, (x - mx) / (d || 1) * 2, (y - my) / (d || 1) * 2 - 1, .5 + rnd() * .4, pick(['*', '^', '\'']), [1, .3 + rnd() * .5, .08], -1, d * .025);
    if (TD[map[i]].burn) ignite(i);
    if (map[i] === 'ICE') { map[i] = under[i] || 'WATER'; steam(x, y); }
    if (map[i] === 'OBSIDIAN' && rnd() < .3) { map[i] = 'LAVA'; }
    const e = entAt(x, y);
    if (e && e !== m && !e.npc) {
      if (e.isPlayer) hitP = true;
      damage(e, e.isPlayer ? 14 : 10, 'burn', d * 25);
      if (!MONS[e.type]?.immune?.burn || e.isPlayer) e.burning = Math.max(e.burning, 3);
    }
  }
  if (!hitP && !P.dead) log('The fire roars past your hiding place. You are untouched!', [.8,1,.8]);
  else if (!P.dead) log('The flames find you. You are burning!', [1,.4,.3]);
  log('Cinder sags, smoking and panting. NOW is your chance!', [1,.9,.5]);
}
// the lich: every spell is shown before it lands
function lichAct(m){
  const P = player, B = level.bossRoom;
  if (m.cast) {
    m.cast.t--;
    if (m.cast.t <= 0) { lichResolve(m); m.cast = null; m.cd = ri(1, 2); }
    else { Snd.charge(); log(m.cast.kind === 'ray' ? 'The black light in his hand is blinding now. Break his line of sight!' : 'The sigils under your feet burn brighter. MOVE!', [.85,.65,1]); }
    return;
  }
  const d = cheb(m, P), sees = los(m.x, m.y, P.x, P.y);
  if (d === 1 && rnd() < .55) { lichBlink(m); return; }
  if (m.cd > 0) {
    m.cd--; m.seen = [P.x, P.y];
    if (d === 1) attack(m, P); else if (d > 5) stepToward(m, P.x, P.y);
    return;
  }
  const minions = ents.filter(e => e.minion && !e.dead).length;
  const r = rnd();
  if (minions < 3 && r < .25) { lichRaise(m); m.cd = 2; return; }
  if (sees && r < .65) {
    m.cast = {kind:'ray', t:2}; Snd.charge();
    log('King Aurex lifts one finger. Black light gathers on it. (Break his line of sight!)', [.85,.65,1]);
  } else {
    const cells = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cells.push([P.x + dx, P.y + dy]);
    m.cast = {kind:'nova', t:2, cells}; Snd.freeze();
    log('King Aurex points at the floor beneath you. Frost sigils spread out around your feet!', [.7,.8,1]);
  }
}
function lichResolve(m){
  const P = player, c = m.cast;
  if (c.kind === 'ray') {
    const clear = los(m.x, m.y, P.x, P.y) && cheb(m, P) <= 16;
    const end = clear ? [P.x, P.y] : (() => { let last = [m.x, m.y]; for (const [x, y] of bline(m.x, m.y, P.x, P.y)) { last = [x, y]; if (TD[map[idx(x, y)]].opaque) break; } return last; })();
    bolts.push({pts:[[m.x, m.y], ...bline(m.x, m.y, end[0], end[1])], t0:now(), dur:520, col:[.7,.4,1]});
    flash(end[0], end[1], 5, [.7,.4,1], 2.5, 700); sparks(end[0], end[1], 12); shake(8); Snd.zap();
    if (clear) { damage(P, 13, 'magic'); log('The black ray hits you full in the chest!', [1,.4,.5]); }
    else log('The black ray splashes harmlessly against stone.', [.8,1,.8]);
  } else {
    Snd.shatter(); shake(5);
    let hit = false;
    for (const [x, y] of c.cells) {
      if (!inb(x, y)) continue;
      frostT[idx(x, y)] = now(); frostBits(x, y); frostBits(x, y);
      const e = entAt(x, y); if (e && e !== m && !e.npc) { if (e.isPlayer) hit = true; damage(e, e.isPlayer ? 11 : 6, 'frost'); }
    }
    flash(c.cells[4][0], c.cells[4][1], 4, [.6,.85,1], 2.2, 600);
    log(hit ? 'The frost sigils erupt around you. Cold bites to the bone!' : 'The frost sigils erupt — on an empty floor.', hit ? [1,.5,.5] : [.8,1,.8]);
  }
}
function lichBlink(m){
  const B = level.bossRoom, P = player;
  for (let tries = 0; tries < 60; tries++) {
    const x = ri(B.x + 1, B.x + B.w - 2), y = ri(B.y + 1, B.y + B.h - 2);
    if (cheb({x, y}, P) < 5 || !fits(m, x, y)) continue;
    for (let k = 0; k < 14; k++) part(m.x, m.y, (rnd() - .5) * 3, (rnd() - .5) * 3, .6, '·', [.7,.5,1], 0);
    flash(m.x, m.y, 4, [.6,.4,1], 1.8, 400);
    m.x = m.vx = x; m.y = m.vy = y; m.anim = null;
    flash(x, y, 4, [.6,.4,1], 1.8, 400); Snd.frost();
    log('King Aurex folds into shadow and steps out somewhere else.', [.8,.65,1]);
    return;
  }
}
function lichRaise(m){
  let n = 0;
  for (const [dx, dy] of DIR8) {
    if (n >= 2) break;
    const x = m.x + dx * 2, y = m.y + dy * 2;
    if (!inb(x, y) || TD[map[idx(x, y)]].block || entAt(x, y)) continue;
    const s = mkEnt('skeleton', x, y, {minion:true, name:'risen skeleton', hp:6, maxhp:6});
    ents.push(s); n++;
    for (let k = 0; k < 10; k++) part(x, y + .3, (rnd() - .5) * 2, -rnd() * 2, .6, pick([';', ',', '.']), [.9,.88,.8], 3);
  }
  if (n) { Snd.slam(); log('King Aurex spreads his hands. The floor coughs up bones, and the bones stand up.', [.85,.75,1]); }
}
// the broodmother spits webs from a distance, then comes in to bite
function broodAct(m){
  const P = player, d = cheb(m, P);
  m.cd = (m.cd || 0) - 1;
  if (d >= 2 && d <= 6 && m.cd <= 0 && losE(m, P.x, P.y) && rnd() < .5) {
    m.cd = 4;
    const [sx, sy] = nearCell(m, P.x, P.y), cells = bline(sx, sy, P.x, P.y);
    projs.push({cells, msPer:28, ch:'%', col:[.9,.9,.95], trail:(x, y) => { if (rnd() < .4) part(x, y, 0, 0, .3, '·', [.8,.8,.85]); },
      onDone:() => {}, t0:now(), sx, sy, x:sx, y:sy});
    const i = idx(P.x, P.y);
    if (!TD[map[i]].water && !TD[map[i]].block) map[i] = 'WEB';
    P.webbed = 2; log('The Broodmother spits a gob of web. You are stuck fast!', [.85,.85,.9]);
    return true;
  }
  return false;
}

function ignite(i){ const d = TD[map[i]]; if (d.burn && !fire[i]) { fire[i] = d.fuel + ri(0, 1); snowAcc[i] = 0; } }
function burnItemsAt(x, y){
  items = items.filter(it => { if (ITEMS[it.kind].burn && it.x === x && it.y === y) { if (vis[idx(x,y)]) log('A scroll curls up and burns away.', [1,.6,.3]); return false; } return true; });
}
function burnOut(i){
  const x = i % MW, y = (i / MW) | 0;
  if (map[i] === 'CHEST') { items.push({x, y, kind:'gold'}); if (vis[i]) log('The chest burns away, spilling gold.', [1,.8,.3]); }
  if (map[i] === 'EGGSAC') {
    state.eggs = (state.eggs || 0) + 1; Snd.death();
    for (let k = 0; k < 10; k++) part(x, y, (rnd() - .5) * 3, -rnd() * 2, .6, pick(['.', ',', '°']), [.9,.85,.6], 4);
    log(state.eggs >= 3 ? 'The last egg sac pops and shrivels. That\'s all three. Eli will want to know.' : `An egg sac bursts in the flames. (${state.eggs} of 3)`, [1,.8,.5]);
  }
  if (map[i] === 'BRAMBLE' && vis[i]) log('The brambles crumble to ash. There was something behind them!', [1,.8,.5]);
  if (map[i] === 'BARRICADE' && vis[i]) log('The coffin barricade collapses into embers. The way is open.', [1,.8,.5]);
  map[i] = zone[i] === Z.MIRE ? 'MUD' : 'ASH';
}
function tickFire(){
  const ign = [];
  for (let i = 0; i < fire.length; i++) {
    if (fire[i] <= 0) continue;
    const x = i % MW, y = (i / MW) | 0, L = localW(zone[i]);
    const damp = 1 - .75 * L.rain - .5 * Math.min(1, snowAcc[i] + L.snow * .5);
    burnItemsAt(x, y);
    for (const [dx, dy] of DIR8) {
      const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
      const j = idx(nx, ny), d = TD[map[j]];
      const windB = 1 + L.wind * (Math.sign(dx) === W.dir ? .8 : -.4);
      if (d.burn && !fire[j] && rnd() < d.spread * damp * windB * (dx && dy ? .6 : 1)) ign.push(j);
      snowAcc[j] *= .6;
    }
    fire[i]--; if (L.rain > .4 && rnd() < L.rain * .5) { fire[i]--; if (rnd() < .2 && vis[i]) steam(x, y); }
    if (fire[i] <= 0) { fire[i] = 0; burnOut(i); }
  }
  ign.forEach(ignite);
}

function stormStrike(){
  if (state.weather.type !== 'storm' || rnd() > .045) return;
  const P = player;
  state.thunderT = now(); setTimeout(() => Snd.thunder(), 120 + rnd() * 500);
  for (let tries = 0; tries < 30; tries++) {
    const x = P.x + ri(-13, 13), y = P.y + ri(-10, 10);
    if (!inb(x, y) || cheb({x, y}, P) < 4) continue;
    const i = idx(x, y); if (!ZONES[zone[i]].outdoor || !vis[i]) continue;
    bolts.push({pts:[[x + ri(-2, 2), y - 14], [x + ri(-1, 1), y - 7], [x, y]], t0:now(), dur:380});
    flash(x, y, 6, [.8,.85,1], 2.5, 600); sparks(x, y, 10); shake(6);
    log('Lightning strikes nearby!', [.8,.85,1]);
    const e = entAt(x, y); if (e) damage(e, 8, 'shock');
    if (TD[map[i]].water) electrify([i], now());
    else if (TD[map[i]].burn) ignite(i);
    return;
  }
}

function checkZone(){
  const z = zone[idx(player.x, player.y)], m = state.mem;
  if (z !== state.zone) {
    state.zone = z;
    const first = !m.visited[z]; m.visited[z] = 1;
    log(`— ${ZONES[z].name} —`, [.95,.9,.65]);
    if (first) log(ZONES[z].enter, [.75,.75,.6]);
    if (first && state.turn > 0) Snd.zone();
  }
  if (!m.called && !npc.dead && cheb(player, npc) <= 8 && canSee(npc) && !m.met) {
    m.called = true;
    log('A voice by the fire: "Come and sit, you look half frozen. Mind the step."', [.85,.8,1]);
  }
}

function endTurn(){
  state.turn++;
  for (const m of ents.slice()) if (!m.isPlayer && !m.dead) monsterAct(m);
  for (const e of ents) {
    if (e.dead || e.npc) continue;
    const i = idx(e.x, e.y), d = TD[map[i]], fireproof = MONS[e.type]?.immune?.burn && !e.isPlayer;
    if (fire[i] > 0 && !d.water && !fireproof) e.burning = Math.max(e.burning, 3);
    if (fireproof) e.burning = 0;
    if (e.burning > 0) {
      e.burnT = state.turn;
      if (d.water) { e.burning = 0; steam(e.x, e.y); if (e.isPlayer) log('The water douses your flames.', [.7,.85,1]); }
      else if (localW(zone[i]).rain > .5 && rnd() < .5) { e.burning = 0; steam(e.x, e.y); if (e.isPlayer) log('The rain puts you out.', [.7,.85,1]); }
      else { if (e.isPlayer) log('You are burning!', [1,.55,.2]); damage(e, 1, 'burn'); e.burning--; ignite(i); }
    }
    if (e.smite > 0 && !e.dead) {
      e.smite--; damage(e, 2, 'holy');
      if (!e.dead) for (let k = 0; k < 3; k++) part(e.x + (rnd() - .5) * .6, e.y, (rnd() - .5) * .3, -.8, .8, pick(['+', '·']), [1,.9,.55], -.2);
    }
    if (e.poison > 0 && !e.dead) {
      e.poison--; damage(e, 1, 'poison');
      if (e.isPlayer) { Snd.poison(); part(e.x, e.y - .2, 0, -.6, .8, '•', [.5,1,.3], -.2); if (!e.poison) log('The venom wears off.', [.7,.9,.7]); }
    }
  }
  tickFire();
  { let n = 0; for (let i = 0; i < fire.length; i++) if (fire[i] > 0 && vis[i]) n++; Snd.crackle(n); }
  tickWeather();
  stormStrike();
  if (!player.dead) player.mp = Math.min(player.maxmp, player.mp + 1);
  ents = ents.filter(e => !e.dead || e.isPlayer);
  rebuildLights(); computeFOV();
  computeDanger();
  checkZone();
  if (!state.dead && !state.won) maybeEcho();
  saveGame();
}
// tiles about to be hit by a telegraphed attack
function computeDanger(){
  danger.fill(0);
  for (const m of ents) {
    if (m.dead) continue;
    if (m.phase === 'charge') for (const [x, y] of breathCells(m)) danger[idx(x, y)] = 1;
    if (m.cast?.kind === 'ray') { for (const [x, y] of bline(m.x, m.y, player.x, player.y)) { if (!inb(x, y) || TD[map[idx(x, y)]].opaque) break; danger[idx(x, y)] = 2; } }
    if (m.cast?.kind === 'nova') for (const [x, y] of m.cast.cells) if (inb(x, y)) danger[idx(x, y)] = 3;
  }
}

function pickUp(it){
  const P = player, I = ITEMS[it.kind];
  if (it.kind === 'gold')   { const g = ri(5, 15) + 3 * state.floor; state.gold += g; Snd.coin(); log(`You pick up ${g} gold.`, [1,.85,.3]); }
  else if (I.pack) { state.inv[it.kind] = (state.inv[it.kind] || 0) + 1; Snd.coin();
    log(`You pack away a ${I.name}. (${it.kind === 'potion' ? '5' : '6'} to drink, I for your pack)`, it.kind === 'potion' ? [1,.5,.6] : [.6,.7,1]); }
  else if (it.kind === 'scroll') { P.maxmp += 4; P.mp = P.maxmp; Snd.scroll(); log('You read a scroll of insight: max MP +4.', [.95,.9,.7]); }
  else if (I.key) { state.keys[it.kind] = (state.keys[it.kind] || 0) + 1; Snd.scroll();
    const q = questFor(state.floor), have = state.keys[it.kind];
    log(it.kind === 'lily' ? `You pick a moonlily. It glows faintly in your hand. (${have} of 3)` : `You found ${I.name}!`, [.85,.9,1]);
    if (q && q.item === it.kind && have >= q.need && state.quest.stage === 1) log('That should do it. Back to the fire, then.', [.8,.75,1]); }
  else if (it.kind === 'tome') learnSpell(it.spell);
  else if (it.kind === 'stone') takeStone();
}
function learnSpell(id){
  const P = player, k = spellKey(id), sp = SPELLS[k];
  state.spells[id] = true; P.mp = P.maxmp;
  flash(P.x, P.y, 8, sp.col, 2.6, 1500); Snd.scroll(); Snd.zone();
  for (let n = 0; n < 30; n++) part(P.x + (rnd() - .5) * 2, P.y + (rnd() - .5) * 1.5, (rnd() - .5) * .5, -1 - rnd() * 1.5, 1.4, pick(['·', '*', '+']), sp.col, -.3, n * .02);
  log(`You learn ${sp.name}! Press ${k} (or click it below), then aim.`, sp.col);
  inspect = {x:P.x, y:P.y, key:'tome:' + id, title:`${sp.name}`, sub:'a spell, learned · press ' + k, text:gonzoPick('tome:' + id, GONZO.tomes[id]),
    fact:GONZO.tomeFacts[id], col:sp.col, t0:now(), turn:state.turn + 1};
  Snd.page();
}
function takeStone(){
  const P = player;
  state.hasStone = true;
  flash(P.x, P.y, 12, [1,.95,.8], 3, 2600); Snd.win(); shake(6);
  for (let n = 0; n < 50; n++) part(P.x, P.y, (rnd() - .5) * 6, (rnd() - .5) * 6, 1.6, pick(['·', '*', '◆', '+']), [1, .9 + rnd() * .1, .7 + rnd() * .3], 0, n * .01);
  log('You pick up the immortality stone. It is warm, and it is beating, very slowly, like a heart that has all the time in the world.', [1,.95,.8]);
  // he took the stairs. all of them.
  const spots = [];
  for (let r = 2; r <= 4 && !spots.length; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = P.x + dx, y = P.y + dy; if (inb(x, y) && !TD[map[idx(x, y)]].block && !entAt(x, y) && cheb({x, y}, P) === r) spots.push([x, y]);
  }
  if (spots.length) {
    const [x, y] = pick(spots);
    npc.x = npc.vx = x; npc.y = npc.vy = y; npc.home = [x, y]; npc.anim = null;
    setTimeout(() => log(`Footsteps behind you, slow and familiar. "Took the stairs," says ${state.mem.knowsName ? 'Eli' : 'the old man'}. "All of them. My knees will never forgive you."`, [.85,.8,1]), 900);
  }
}
function finishFloor(){
  const n = state.floor;
  Snd.zone();
  if (state.quest.stage === 1) log('You leave the favour undone. Somewhere behind you, a kettle sighs.', [.7,.65,.8]);
  log(`You go down. ${n === 4 ? 'The air turns cold and dry and very old.' : 'Down, and down, and down.'}`, [1,1,.6]);
  enterLevel(n + 1);
}

function playerMove([dx, dy]){
  const P = player, nx = P.x + dx, ny = P.y + dy;
  if (!inb(nx, ny)) return;
  if (dx) P.face = dx;
  const e = entAt(nx, ny);
  if (e && e.npc) { P.lunge = null; talkToOldMan(); return; }
  if (P.webbed > 0) {
    P.webbed--; P.act = {style:'latch', t0:now(), dx:dx * .3, dy:dy * .3, s:dx || 1};
    log(P.webbed ? 'You tear at the sticky web...' : 'You rip free of the web!', [.85,.85,.9]);
    if (!P.webbed) { const j = idx(P.x, P.y); if (map[j] === 'WEB') map[j] = zone[j] === Z.MIRE ? 'MUD' : ZONES[zone[j]].floor; }
    endTurn(); return;
  }
  if (e) { attack(P, e); endTurn(); return; }
  const i = idx(nx, ny), key = map[i], d = TD[key];
  const nudge = () => { P.act = {style:'bite', t0:now(), dx:dx * .5, dy:dy * .5, s:dx || 1}; };
  if (key === 'GRAVE') { nudge(); visitGrave(i); endTurn(); return; }
  if (key === 'SECRET') { openSecret(nx, ny, i); nudge(); endTurn(); return; }
  if (key === 'ALTAR' || key === 'ALTARSPENT') { nudge(); pray(i, nx, ny); endTurn(); return; }
  if (key === 'DOOR') { map[i] = 'OPEN'; nudge(); Snd.door(); log('You open the door.'); endTurn(); return; }
  if (key === 'CHEST') { map[i] = 'CHESTOPEN'; const g = ri(15, 30); state.gold += g; nudge(); Snd.coin(); log(`You open the chest: ${g} gold!`, [1,.85,.3]); endTurn(); return; }
  if (d.block) {
    nudge(); Snd.bump();
    const hint = hintFor(key);
    if (hint) log(hint, [.6,.75,.65]);
    return;
  }
  const wasWater = TD[map[idx(P.x, P.y)]].water;
  moveEnt(P, nx, ny); Snd.step(key === 'BOG' ? 'WATER' : key === 'SNOW' || snowAcc[i] > .4 ? 'ICE' : key);
  if (d.water && !wasWater) log(d.bog ? 'You squelch into the bog. Lightning would love this.' : 'You wade into the water. Careful with lightning!', [.5,.75,1]);
  if (key === 'ICE' && map[idx(P.x - dx, P.y - dy)] !== 'ICE') log('The ice creaks under your feet.', [.7,.9,1]);
  if (key === 'WEB' && !P.webbed) { P.webbed = 2; log('You blunder into a web. It clings like a bad decision.', [.85,.85,.9]); }
  const here = items.filter(it => it.x === nx && it.y === ny);
  items = items.filter(it => !(it.x === nx && it.y === ny));
  here.forEach(pickUp);
  if (key === 'STAIRS') { finishFloor(); return; }
  if (key === 'UPSTAIRS' && (P.x - dx !== nx || P.y - dy !== ny)) log('The way back up. Not today.', [.6,.7,.6]);
  endTurn();
}

// =====================================================================
//  Spells
// =====================================================================
function tracePath(sp, tx, ty){
  const P = player, cells = []; let hit = null;
  for (const [x, y] of bline(P.x, P.y, tx, ty)) {
    if (cells.length >= sp.range || !inb(x, y)) break;
    const d = TD[map[idx(x, y)]];
    if (d.opaque || (d.block && !d.water && !d.lava && !d.chasm)) { hit = [x, y]; break; }
    cells.push([x, y]);
    if (sp.stopAtEnt && entAt(x, y)) break;
  }
  return {cells, hit};
}
function beginCast(k){
  const sp = SPELLS[k];
  if (!knows(k)) { Snd.error(); log(state.floor === 1 && !Object.keys(state.spells).length ? "You don't know any spells yet. Somewhere down here, someone does." : "You haven't learned that spell yet.", [.7,.6,.6]); return; }
  if (player.mp < cost(k)) { Snd.error(); log(`Not enough mana for ${sp.name}.`, [.8,.5,.5]); return; }
  state.targeting = k; Snd.select(SPELLS[k].id);
  log(`${sp.name}: direction key or click a target. Esc cancels.`, sp.col);
}
function castAt(tx, ty){
  const k = state.targeting; state.targeting = null;
  if (!knows(k)) return;
  if (tx === player.x && ty === player.y) return;
  const sp = SPELLS[k], tr = tracePath(sp, tx, ty);
  player.mp -= cost(k);
  const dx = Math.sign(tx - player.x); if (dx) player.face = dx;
  player.act = {style:'spear', t0:now(), dx:Math.sign(tx - player.x) * .4, dy:Math.sign(ty - player.y) * .4, s:dx || 1};
  const id = SPELLS[k].id;
  if (id === 'lightning') castLightning(tr); else if (id === 'fire') castFire(tr); else if (id === 'holy') castHoly(tr); else castFrost(tr);
}
function floodWater(seeds){
  const body = new Set(seeds), st = [...seeds], ox = seeds[0] % MW, oy = (seeds[0] / MW) | 0;
  while (st.length) {
    const i = st.pop(), x = i % MW, y = (i / MW) | 0;
    for (const [dx, dy] of DIR8) { const nx = x + dx, ny = y + dy;
      if (!inb(nx, ny) || Math.abs(nx - ox) > 22 || Math.abs(ny - oy) > 16) continue;
      const j = idx(nx, ny); if (!body.has(j) && TD[map[j]].water) { body.add(j); st.push(j); } }
  }
  return body;
}
function electrify(seeds, tn){
  const body = floodWater(seeds);
  let n = 0;
  for (const i of body) { elecT[i] = tn + rnd()*120; if (n++ % 6 === 0) flash(i % MW, (i / MW) | 0, 2.5, [.7,.85,1], 2, 600); }
  log('The water surges with electricity!', [.6,.85,1]); Snd.electrify();
  for (const e of ents) if (!e.dead && cellsOf(e).some(([x, y]) => body.has(idx(x, y)))) {
    damage(e, 14, 'shock'); sparks(e.x, e.y, 8);
    if (e.isPlayer) log('You are standing in it. Ouch.', [1,.4,.4]);
  }
  // a rune that touches the water drinks the whole charge
  for (const i of body) { const x = i % MW, y = (i / MW) | 0;
    for (const [dx, dy] of DIR8) { const j = idx(x + dx, y + dy); if (inb(x + dx, y + dy) && map[j] === 'RUNE') powerRune(j); } }
}
function castLightning(tr){
  const P = player, tn = now();
  const pts = [[P.x, P.y], ...tr.cells]; if (tr.hit) pts.push(tr.hit);
  bolts.push({pts, t0:tn, dur:420});
  shake(9); Snd.zap();
  log('Lightning cracks from your fingers!', [.7,.85,1]);
  const seeds = [], hit = new Set();
  tr.cells.forEach(([x, y], n) => {
    const e = entAt(x, y); if (e && !hit.has(e)) { hit.add(e); damage(e, 4, 'shock'); }
    const i = idx(x, y); if (TD[map[i]].water) seeds.push(i);
    if (n % 2 === 0) flash(x, y, 3, [.6,.75,1], 2.2, 380);
    sparks(x, y, 2);
  });
  if (tr.hit) {
    const [hx, hy] = tr.hit, i = idx(hx, hy);
    if (map[i] === 'ICEWALL') { map[i] = ZONES[zone[i]].floor; frostBits(hx, hy); sparks(hx, hy, 10); Snd.shatter(); log('The frozen wall shatters!', [.7,.9,1]); }
    else if (map[i] === 'TORCHOUT') lightTorch(i);
    else if (map[i] === 'RUNE') log('The rune drinks the spark and flickers, hungry. One bolt isn\'t enough. It wants a whole pool of lightning.', [.7,.75,1]);
    else if (TD[map[i]].burn) ignite(i);
    sparks(hx, hy, 8);
  }
  if (seeds.length) electrify(seeds, tn);
  endTurn();
}
// ---- puzzles: cold torches that open a gate, a rune that wants a pool full of lightning, a grave
function lightTorch(i){
  map[i] = 'TORCH'; log('The torch flares back to life.', [1,.7,.3]);
  const T = level.torches;
  if (!T.length || !T.some(([x, y]) => idx(x, y) === i)) return;
  const lit = T.filter(([x, y]) => map[idx(x, y)] === 'TORCH').length;
  if (lit < T.length) { log(`${lit} of ${T.length} torches burn now.`, [1,.8,.5]); Snd.select('fire'); return; }
  openGates('Four torches burn. Somewhere, heavy chains rattle: the iron gate grinds open!');
}
function openGates(msg){
  for (const [x, y] of level.gates) { const i = idx(x, y); if (map[i] !== 'GATE') continue;
    map[i] = ZONES[zone[i]].floor === 'SNOW' ? 'FLOOR' : ZONES[zone[i]].floor;
    flash(x, y, 6, [1,.9,.6], 2.4, 1200);
    for (let k = 0; k < 14; k++) part(x + (rnd() - .5) * .8, y + (rnd() - .5) * .6, (rnd() - .5) * 3, -rnd() * 2, .6 + rnd() * .6, pick(['.', ',', ':']), [.7,.7,.75], 3); }
  setTimeout(() => { Snd.slam(); Snd.door(); shake(6); }, 250);
  log(msg, [1,.9,.6]);
}
function powerRune(i){
  if (map[i] !== 'RUNE') return;
  map[i] = 'RUNELIT';
  const x = i % MW, y = (i / MW) | 0;
  setTimeout(() => { flash(x, y, 8, [.6,.85,1], 3, 1500); sparks(x, y, 16); Snd.zap(); }, 200);
  openGates('The rune drinks the lightning and BLAZES. Somewhere nearby, a gate shudders open!');
}
function visitGrave(i){
  const q = state.quest;
  if (map[i] === 'GRAVEDONE') { log('Marta\'s grave. The pressed flower is still there. It always will be, now.', [1,.75,.85]); return; }
  if (state.floor === 5 && q.stage === 1 && state.keys.flower) {
    map[i] = 'GRAVEDONE'; delete state.keys.flower;
    const x = i % MW, y = (i / MW) | 0;
    flash(x, y, 5, [1,.75,.85], 1.8, 2000); Snd.scroll();
    for (let k = 0; k < 16; k++) part(x + (rnd() - .5) * .6, y, (rnd() - .5) * .8, -.6 - rnd(), 1.6, pick(['·', '*', '°']), [1,.75,.85], -.2, k * .05);
    log('You lay the pressed flower on the little stone. MARTA, it says. And underneath, smaller: "Courage is love with its boots on."', [1,.8,.88]);
    log('That\'s done. He\'ll want to know.', [.8,.75,1]);
    return;
  }
  log('A small, plain grave. The name on it is MARTA. Someone has kept the moss off it, once a year, for a long time.', [.8,.8,.9]);
}
function launch(cells, msPer, ch, col, trail, onDone){
  if (!cells.length) { onDone(); return; }
  projs.push({cells, msPer, ch, col, trail, onDone, t0:now(), sx:player.x, sy:player.y, x:player.x, y:player.y});
}
function fireTile(x, y, center, hit = new Set()){
  if (!inb(x, y)) return;
  const i = idx(x, y), t = map[i];
  snowAcc[i] = 0;
  if (t === 'ICE') { map[i] = under[i] || 'WATER'; steam(x, y); }
  else if (t === 'ICEWALL') { map[i] = 'WATER'; steam(x, y); log('The ice wall melts into a puddle.', [.7,.85,1]); }
  else if (t === 'TORCHOUT') lightTorch(i);
  else if (TD[t].water) steam(x, y);
  else if (TD[t].burn) ignite(i);
  burnItemsAt(x, y);
  const e = entAt(x, y);
  if (e && e.npc) damage(e, 0, 'burn');
  else if (e && !e.isPlayer && !hit.has(e)) {
    hit.add(e);
    e.frozen = 0;
    if (TD[map[i]].water) { steam(x, y); damage(e, 1, 'burn'); }
    else { if (!MONS[e.type]?.immune?.burn) e.burning = Math.max(e.burning, 4); damage(e, center ? 4 : 2, 'burn'); }
  }
  for (let k = 0; k < 5; k++) part(x + (rnd()-.5)*.8, y + (rnd()-.5)*.8, (rnd()-.5)*2, -rnd()*2.5, .4 + rnd()*.4,
                                  ['*','^','\'','.'][ri(0,3)], [1, .3 + rnd()*.5, .08], -1);
}
function castFire(tr){
  log('You hurl a ball of fire!', [1,.6,.25]); Snd.whoosh();
  launch(tr.cells, 32, '*', [1,.6,.2], (x, y) => ember(x, y + .2, [1,.5,.1]), () => {
    const c = tr.cells.length ? tr.cells[tr.cells.length - 1] : tr.hit || [player.x, player.y];
    let bog = 0;
    const hit = new Set();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { fireTile(c[0] + dx, c[1] + dy, !dx && !dy, hit); if (inb(c[0]+dx, c[1]+dy) && TD[map[idx(c[0]+dx, c[1]+dy)]].bog) bog++; }
    if (tr.hit) fireTile(tr.hit[0], tr.hit[1], false, hit);
    flash(c[0], c[1], 6, [1,.5,.15], 2.4, 650);
    shake(5); Snd.boom();
    if (bog >= 3 && rnd() < .85) {   // swamp gas!
      log('Swamp gas ignites with a WHUMPF!', [1,.7,.3]);
      setTimeout(() => { Snd.boom(); shake(9); flash(c[0], c[1], 8, [1,.6,.2], 3, 800);
        for (let k = 0; k < 40; k++) { const a = rnd() * PI * 2, s = 2 + rnd() * 5; part(c[0], c[1], Math.cos(a) * s, Math.sin(a) * s, .6, pick(['*','^','°']), [1, .5 + rnd() * .4, .15], -.5); } }, 180);
      for (const e of ents) if (!e.dead && cheb(e, {x:c[0], y:c[1]}) <= 2) damage(e, 3, 'burn', 180);
      if (cheb(npc, {x:c[0], y:c[1]}) <= 2) damage(npc, 0, 'burn');
    }
    endTurn();
  });
}
// holy light: a pillar of it falls from somewhere very high up. The dead burn; the living just feel warm.
function castHoly(tr){
  const c = tr.cells.length ? tr.cells[tr.cells.length - 1] : tr.hit || [player.x, player.y];
  log('You raise your hand. Light falls from somewhere very far above.', [1,.92,.6]); Snd.choir();
  pillars.push({x:c[0], y:c[1], t0:now(), dur:1500});
  setTimeout(() => { flash(c[0], c[1], 8, [1,.9,.6], 3.6, 1400); shake(4); }, 120);
  for (let k = 0; k < 40; k++) { const a = rnd() * PI * 2, r = rnd() * 2.4;
    part(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * .8, (rnd() - .5) * .4, -.6 - rnd() * 1.4, 1 + rnd() * .8, pick(['+', '·', '*', '†']), [1, .85 + rnd() * .15, .5 + rnd() * .4], -.25, .1 + rnd() * .3); }
  const hit = new Set();
  let burned = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const x = c[0] + dx, y = c[1] + dy, d = Math.hypot(dx, dy);
    if (d > 2.3 || !inb(x, y) || !los(c[0], c[1], x, y)) continue;
    const e = entAt(x, y);
    if (!e || e.npc || hit.has(e)) continue;
    hit.add(e);
    if (MONS[e.type]?.undead) { burned++; damage(e, d < .5 || covers(e, c[0], c[1]) ? 12 : 8, 'holy', 250); if (!e.dead) e.smite = 3; }
    else if (!e.isPlayer) damage(e, 0, 'holy', 250);
  }
  if (burned) log(burned > 1 ? 'The dead scream and smoke in the light!' : 'The dead thing screams and smokes in the light!', [1,.85,.5]);
  else log('The light is warm, and harms nothing living.', [.9,.85,.7]);
  endTurn();
}
function freezeTile(x, y, walls, hit = new Set()){
  if (!inb(x, y)) return;
  const i = idx(x, y), t = map[i];
  frostT[i] = now();
  if (ZONES[zone[i]].outdoor) snowAcc[i] = Math.max(snowAcc[i], .9);
  if (TD[t].water) { under[i] = t; map[i] = 'ICE'; }
  else if (t === 'LAVA') { map[i] = 'OBSIDIAN'; steam(x, y); steam(x, y); if (!state.obsMsg) { state.obsMsg = 1; log('The lava hisses and cools into obsidian!', [.75,.65,1]); } }
  else if (walls && t === 'WALL' && !border(x, y)) map[i] = 'ICEWALL';
  else if (t === 'TORCH') { map[i] = 'TORCHOUT'; log('The torch is snuffed out by frost.', [.6,.8,1]); }
  if (fire[i] > 0) { fire[i] = 0; steam(x, y); }
  const e = entAt(x, y);
  if (e && !e.isPlayer && !e.npc && !hit.has(e)) {
    hit.add(e);
    if (MONS[e.type]?.immune?.frost) damage(e, 1, 'frost');
    else if (e.boss) { if (!e.frozen) log(`Frost crusts over ${e.name}, slowing it for a moment!`, [.6,.9,1]); e.frozen = 1; e.burning = 0; damage(e, 3, 'frost'); }
    else { if (!e.frozen) log(`The ${e.name} is frozen solid!`, [.6,.9,1]); e.frozen = 5; e.burning = 0; damage(e, 3, 'frost'); }
  }
  frostBits(x, y);
}
function castFrost(tr){
  log('A freezing beam lances out!', [.6,.9,1]); Snd.frost(); state.obsMsg = 0;
  launch(tr.cells, 18, '*', [.7,.95,1], (x, y) => frostBits(x, y), () => {
    const hit = new Set();
    tr.cells.forEach(([x, y]) => freezeTile(x, y, false, hit));
    const c = tr.hit || tr.cells[tr.cells.length - 1];
    if (c) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) freezeTile(c[0] + dx, c[1] + dy, true, hit);
      flash(c[0], c[1], 5, [.5,.8,1], 1.8, 600);
    }
    Snd.freeze();
    endTurn();
  });
}

// =====================================================================
//  Mouse travel
// =====================================================================
const canSee = e => e.s > 1 ? cellsOf(e).some(([x, y]) => vis[idx(x, y)]) : !!vis[idx(e.x, e.y)];
const visibleMonsters = () => ents.filter(e => !e.isPlayer && !e.npc && !e.dead && canSee(e));
let pathCache = {key:'', path:null};
function findPath(sx, sy, tx, ty){
  const dest = idx(tx, ty), start = idx(sx, sy);
  if (!seen[dest]) return null;
  const key = `${sx},${sy},${tx},${ty},${state.turn}`;
  if (pathCache.key === key) return pathCache.path;
  const prev = new Int32Array(MW * MH).fill(-1); prev[start] = start;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const i = q[h]; if (i === dest) break;
    const x = i % MW, y = (i / MW) | 0;
    for (const [dx, dy] of DIR8) {
      const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
      const j = idx(nx, ny); if (prev[j] !== -1) continue;
      const t = map[j];
      if (j !== dest && (!seen[j] || fire[j] || (TD[t].block && t !== 'DOOR'))) continue;
      prev[j] = i; q.push(j);
    }
  }
  let path = null;
  if (prev[dest] !== -1) { path = []; for (let i = dest; i !== start; i = prev[i]) path.push([i % MW, (i / MW) | 0]); path.reverse(); }
  pathCache = {key, path};
  return path;
}
function mouseGo(tx, ty){
  const P = player;
  if (tx === P.x && ty === P.y) { endTurn(); return; }
  const e = entAt(tx, ty), target = e && !e.isPlayer && canSee(e) ? e : null;
  if (!target && !seen[idx(tx, ty)] && Math.max(Math.abs(tx - P.x), Math.abs(ty - P.y)) > 1) { log("You don't know what's there.", [.55,.65,.55]); return; }
  state.travel = {tx, ty, target, cautious:visibleMonsters().length > 0, next:0};
  travelStep(now());
}
function travelStep(tn){
  const tr = state.travel, P = player;
  if (tr.target) { if (tr.target.dead || !canSee(tr.target)) { state.travel = null; return; } tr.tx = tr.target.x; tr.ty = tr.target.y; }
  if (P.x === tr.tx && P.y === tr.ty) { state.travel = null; return; }
  let step;
  if (Math.max(Math.abs(tr.tx - P.x), Math.abs(tr.ty - P.y)) === 1) step = [tr.tx, tr.ty];
  else {
    const path = findPath(P.x, P.y, tr.tx, tr.ty);
    if (!path) { log("You can't find a way there.", [.6,.6,.5]); state.travel = null; return; }
    step = path[0];
  }
  const blocker = entAt(step[0], step[1]);
  if (blocker && blocker !== tr.target) { log(`The ${blocker.name} is in the way.`, [1,.8,.5]); state.travel = null; return; }
  const final = step[0] === tr.tx && step[1] === tr.ty, turn = state.turn;
  playerMove([step[0] - P.x, step[1] - P.y]);
  if (!state.travel) return;
  if (state.turn === turn || state.dead || state.won || (final && tr.target) || dlg) { state.travel = null; return; }
  // bumped something solid at the destination (altar, chest...): that was the point, don't keep bumping it
  if (final && (P.x !== tr.tx || P.y !== tr.ty) && TD[map[idx(tr.tx, tr.ty)]].block) { state.travel = null; return; }
  // with monsters in sight, every click is a single careful step
  if (tr.cautious) { state.travel = null; return; }
  const seenNow = visibleMonsters();
  if (seenNow.length) {
    log(`You spot ${seenNow.length > 1 ? 'monsters' : 'a ' + seenNow[0].name}. You slow down.`, [1,.8,.5]); Snd.alert(); state.travel = null; return;
  }
  tr.next = tn + 135;
}
const HINT = {SECRET:'This wall is different from the rest. Walk into it.', ALTAR:'Walk into it to pray.', ALTARSPENT:'Its gift has been given.', DEEP:'Too deep to wade. Frost could bridge it.', ICEWALL:'A wall of solid ice. Fire melts it, lightning shatters it.',
      CRATE:'A wooden crate. Looks flammable.', CHESTOPEN:'An empty chest.', TORCHOUT:'A frozen torch. Fire would relight it.',
      BUSH:'A thick bush. It would burn nicely.', LAVA:'Lava. Even looking at it is warm. Frost would make it a floor.',
      HEARTH:'The kettle sings quietly to itself.', SHELF:'Books on birds, boats, bread, and "Being Brave, Vol. II".',
      BED:'A patchwork quilt. Every patch is a different colour.', WINDOW:'Through the glass: weather, and the long road.',
      TABLE:'Two bowls, two spoons. He always sets two.', TREE:'An old tree. Its bark is warm where the light touches it.',
      ROCK:'Cold mountain stone.', DEADTREE:'A dead tree, bone-white and patient.', VENT:'A vent breathes scalding steam.',
      CAMPFIRE:'A small, determined fire. Eli keeps it going.', EGGSAC:'A pulsing egg sac. Fire would end it.',
      BRAMBLE:'Dry brambles, thick as a wall. Something glints behind them. Fire would clear them.',
      GATE:() => state.floor === 2 ? `A heavy iron gate. Old miners' torches are set round here: light all four and it opens. (${level.torches.filter(([x, y]) => map[idx(x, y)] === 'TORCH').length} of 4 lit)`
        : 'A heavy gate with no handle and no lock. A dull rune nearby is meant to open it.',
      CHASM:'A crevasse. You cannot cross it, but fire can.', PILLAR:'A thick stone pillar. Good to hide behind.',
      SARCO:'A sealed sarcophagus. Let it stay sealed.', RUNE:'A rune, dull and thirsty. Water lies against it. Lightning in that water might wake it.',
      RUNELIT:'The rune blazes with stored lightning.', BARRICADE:'Old coffins, stacked into a barricade. Dry wood. Very dry wood.',
      GRAVEDONE:"Marta's grave, with a pressed flower on it."};
const HINT_X = {WATER:'Lightning arcs through connected water.', BOG:'Conducts lightning. Fire may ignite the swamp gas.',
  ICE:'Walkable. Fire melts it back to water.', TORCH:'Lights the area. Frost snuffs it.', CHEST:'Bump to open.', DOOR:'Bump to open.',
  STAIRS:'Step on it to go down to the next floor.', UPSTAIRS:'The way you came. Not today.', WEB:'Sticky. Walking in will hold you a turn or two. Burns in a flash.',
  GRAVE:'Walk into it.', TFLOOR:'', BONES:'', OBSIDIAN:'Safe to walk on.', SNOW:'Fire melts it.', PINE:'Burns.', REEDS:'Burns.',
  GRASS:'Burns.', MEADOW:'Burns, slowly.', FLOWER:'Burns.', PLANK:'Nothing in the old man\'s house will burn. He made sure.'};
const ITEM_FACT = {potion:`Goes in your pack. Drink with 5: +${POTION_HEAL} HP and cures poison.`, mana:`Goes in your pack. Drink with 6: +${MANA_GAIN} MP.`,
  scroll:'Step on it: max MP +4. Fire destroys it.', gold:'Step on it to pick up.', specs:'Eli lost these. Bring them back to him.',
  lily:'Eli wants three of these for his tea.', hammer:"Eli's old hammer. He'll want it back.", tome:'Step on it to learn the spell inside.',
  stone:'The thing you came for.'};
const hintFor = k => typeof HINT[k] === 'function' ? HINT[k]() : HINT[k];

// ---------- right-click inspection, in the gonzo register ----------
let inspect = null;
const inspN = {};
function gonzoPick(key, arr){
  if (!(key in inspN)) inspN[key] = Math.floor(rnd() * arr.length);
  return arr[inspN[key]++ % arr.length];
}
const capF = s => s.charAt(0).toUpperCase() + s.slice(1);
function buildInspect(x, y){
  const i = idx(x, y);
  if (!seen[i]) return null;
  const G = GONZO, K = [];
  const e = entAt(x, y);
  let key, title, sub = '', text, fact = '', col = [.75,.95,.8];
  if (e && (e.isPlayer || canSee(e))) {
    if (e.isPlayer) {
      const kind = state.belief ? 'playerBelief' : e.hp < e.maxhp * .4 ? 'playerHurt' : 'player';
      key = 'player'; title = state.mem.name ? `${state.mem.name} (you)` : 'You';
      text = e.burning > 0 ? condText('pl:burn', G.burningPlayer) : e.frozen > 0 ? condText('pl:frozen', G.frozenPlayer) : gonzoPick(kind, G[kind]);
      if (e.burning > 0) title += ', on fire'; else if (e.frozen > 0) title += ', frozen';
      sub = `${Math.max(0, e.hp)}/${e.maxhp} HP · ${e.mp}/${e.maxmp} MP · AC ${playerAC()}` + (e.poison ? ' · poisoned' : '');
      col = [1,.95,.75];
    } else if (e.npc) {
      const kind = state.mem.knowsName ? 'manNamed' : 'man';
      key = 'man'; title = state.mem.knowsName ? 'Eli' : 'An old man';
      text = gonzoPick(kind, G[kind]);
      fact = 'Walk into him to talk.'; col = [.9,.85,1];
    } else {
      const cn = condName(e);
      key = 'mon:' + e.type + (e.burning > 0 ? ':burn' : e.frozen > 0 ? ':frozen' : ''); title = capF(cn);
      if (e.minion) key = 'mon:minion';
      text = e.burning > 0 ? condText('mon:burn', G.burningMon, e.name) : e.frozen > 0 ? condText('mon:frozen', G.frozenMon, e.name)
        : gonzoPick(key, G.mons[e.type] || ['Something with teeth. I could not get a good look at it and I did not try very hard.']);
      const d = describe(x, y) || ''; sub = d.slice(cn.length + 1).replace(/^(\d+\/\d+)/, '$1 HP').replace(/^· /, '');
      if (e.boss) sub = MONS[e.type].title + ' · ' + sub;
      if (e.carry) K.push(G.states.specs);
      if (e.phase === 'charge') K.push(G.states.charging); else if (e.spent) K.push(G.states.spent);
      if (/^big /.test(e.name)) K.push(G.states.big); else if (/^scrawny /.test(e.name)) K.push(G.states.scrawny);
      if (!e.burning && !e.frozen && e.hp < e.maxhp * .5) K.push(G.states.hurt);
      if (TD[map[i]].water && !(MONS[e.type].immune || {}).shock) K.push(G.states.inWater);
      col = e.col.map(v => .45 + v * .55);
    }
  } else {
    const it = items.find(o => o.x === x && o.y === y);
    if (it && vis[i]) {
      key = 'item:' + it.kind; title = capF(ITEMS[it.kind].name);
      if (it.kind === 'tome') title = `Spellbook of ${SPELLS[spellKey(it.spell)].name}`;
      text = gonzoPick(key, G.items[it.kind]); fact = ITEM_FACT[it.kind] || ''; col = ITEMS[it.kind].col.map(v => .5 + v * .5);
    } else {
      const t = map[i]; key = 'tile:' + t; title = capF(TNAME[t] || t);
      const D = (t === 'ALTAR' || t === 'ALTARSPENT') ? altarDeity(i) : null;
      if (D) { title = `Altar of ${D.name}`; sub = D.title + (t === 'ALTARSPENT' ? ' · spent' : ''); col = D.col; }
      text = gonzoPick(key + (D ? ':' + altars[i] : ''), D && t === 'ALTAR' ? D.gonzo : G.tiles[t] || ['A thing. Not much to say about it, which in this place is a luxury.']);
      fact = hintFor(t) || HINT_X[t] || '';
      if (fire[i] > 0 && vis[i]) { key += ':burn'; title = 'Burning ' + (TNAME[t] || t); text = condText('tile:burn', G.burningTile, TNAME[t] || t); fact = TD[t].block ? 'On fire. Soon it will be ash.' : 'On fire. Standing in it sets you alight.'; }
      if (snowAcc[i] > .5 && TD[t].snowy) K.push(G.states.snowed);
      if (!vis[i]) K.push(G.states.remembered);
    }
  }
  // the sky has opinions too
  const z = zone[i];
  if (vis[i] && ZONES[z].outdoor && rnd() < .5) {
    const L = localW(z);
    if (L.snow > .4 && L.wind > .5) K.push(G.states.blizzard);
    else if (state.weather.type === 'storm' && L.rain > .4) K.push(G.states.storm);
  }
  if (K.length) text += ' ' + K.join(' ');
  return {x, y, key, title, sub, text, fact, col, t0:now(), turn:state.turn};
}
function buildHudInspect(tx, ty){
  const G = GONZO.hud; let k = null, title = '';
  if (ty === VH) { k = 'zone'; title = ZONES[state.zone]?.name || 'Somewhere'; }
  else if (ty === VH + 1) {
    if (sndBtn && tx >= sndBtn[0] && tx < sndBtn[1]) { k = 'sound'; title = 'Sound'; }
    else if (hudZones.hp && tx >= hudZones.hp[0] && tx < hudZones.hp[1]) { k = 'hp'; title = 'Health'; }
    else if (hudZones.mp && tx >= hudZones.mp[0] && tx < hudZones.mp[1]) { k = 'mp'; title = 'Mana'; }
    else if (hudZones.gold && tx >= hudZones.gold[0] && tx < hudZones.gold[1]) { k = 'gold'; title = 'Gold'; }
    else if (hudZones.ac && tx >= hudZones.ac[0] && tx < hudZones.ac[1]) { k = 'ac'; title = `Armour class ${playerAC()}`; }
  } else if (ty === VH + 2 || ty === VH + 3) {
    const b = spellBtns.find(b => VH + b.row === ty && tx >= b.c0 && tx < b.c1);
    if (b && b.k in SPELLS) { k = knows(b.k) ? SPELLS[b.k].id : 'unknown'; title = knows(b.k) ? `${SPELLS[b.k].name} · ${cost(b.k)} MP` : 'A spell you do not know yet'; }
    else if (b) { k = b.k; title = {potion:'Healing potions', mana:'Mana potions', pack:'Your pack'}[b.k]; }
  }
  if (!k) return null;
  const sc = Object.values(SPELLS).find(s => s.id === k);
  return {hud:true, hx:tx, key:'hud:' + k, title, sub:'', text:gonzoPick('hud:' + k, G[k]), fact:'',
    col:sc ? sc.col.map(v => .4 + v * .6) : [.75,.95,.8], t0:now(), turn:state.turn};
}
const INS_W = 40;
const inspectTyping = () => inspect && inspect.lines && (now() - inspect.t0) * .16 < inspect.total;
function openInspect(o){
  if (!o) { inspect = null; return; }
  // right-clicking the same thing while it's still typing just finishes the text
  if (inspect && inspect.key === o.key && inspect.x === o.x && inspect.y === o.y && inspect.hx === o.hx && inspectTyping()) { inspect.t0 = -1e9; return; }
  inspect = o; Snd.page();
}
function inspectLayout(){
  const I = inspect;
  if (!I.lines) { I.lines = wrap(I.text, INS_W - 4); I.flines = I.fact ? wrap(I.fact, INS_W - 4) : []; I.total = I.text.length; }
  const H = 3 + (I.sub ? 1 : 0) + I.lines.length + (I.flines.length ? 1 + I.flines.length : 0);
  let px, py;
  if (I.confirm) { px = Math.round((VW - INS_W) / 2); py = Math.max(0, Math.round((VH - H) / 2) - 2); }
  else if (I.hud) { px = clamp(I.hx - 6, 0, VW - INS_W); py = VH - H; }
  else {
    const ax = (I.x - CXr + .5) * ZOOM, ay = (I.y - CYr + .5) * ZOOM;
    if (ax + 1.6 + INS_W <= VW) { px = Math.round(ax + 1.6); py = clamp(Math.round(ay - H / 2), 0, Math.max(0, VH - H)); }
    else if (ax - 1.6 - INS_W >= 0) { px = Math.round(ax - 1.6 - INS_W); py = clamp(Math.round(ay - H / 2), 0, Math.max(0, VH - H)); }
    else { // no room at the sides: hang it below (or above) the thing, never on top of it
      px = clamp(Math.round(ax - INS_W / 2), 0, VW - INS_W);
      py = ay + 1.2 + H <= VH ? Math.round(ay + 1.2) : Math.max(0, Math.round(ay - 1.2 - H));
    }
  }
  return {px, py, H};
}
function askRestart(){
  state.travel = null; state.targeting = null;
  inspect = {confirm:true, key:'restart', title:'BEGIN AGAIN?', sub:'restart the run · everything is lost',
    text:gonzoPick('restart', GONZO.restart), col:[1,.55,.4], t0:now(), turn:state.turn};
  Snd.page();
}
let inspLastC = 0;
function drawInspect(t){
  const I = inspect; if (!I) return;
  if ((!I.confirm && I.turn !== state.turn) || dlg) { inspect = null; return; }
  const {px, py, H} = inspectLayout();
  const fc = I.col.map(v => v * .55), n = Math.floor((now() - I.t0) * .16);
  ctx.fillStyle = 'rgba(2,3,3,.94)'; ctx.fillRect(px * TW + TW * .5, py * TH + TH * .5, (INS_W - 1) * TW, (H - 1) * TH);
  scrText(px, py, '╔' + '═'.repeat(INS_W - 2) + '╗', fc);
  for (let r = py + 1; r < py + H - 1; r++) { scrText(px, r, '║', fc); scrText(px + INS_W - 1, r, '║', fc); }
  scrText(px, py + H - 1, '╚' + '═'.repeat(INS_W - 2) + '╝', fc);
  const ttl = ` ${I.title.slice(0, INS_W - 6)} `;
  ctx.fillStyle = 'rgb(2,3,3)'; ctx.fillRect((px + 2) * TW, py * TH, ttl.length * TW, TH);
  scrText(px + 2, py, ttl, I.col);
  let row = py + 1;
  if (I.sub) { scrText(px + 2, row, I.sub.slice(0, INS_W - 4), I.col.map(v => v * .6)); row++; }
  row++;
  let c = 0;
  for (const ln of I.lines) {
    const v = Math.max(0, Math.min(ln.length, n - c));
    if (v) scrText(px + 2, row, ln.slice(0, v), [.86,.88,.8]);
    c += ln.length + 1; row++;
  }
  if (n < I.total && n > inspLastC) { const ch = I.text[n] || ' '; if (ch !== ' ' && n % 3 === 0) Snd.talk(ch.charCodeAt(0), 'gonzo'); }
  inspLastC = n;
  if (n >= I.total) {
    if (I.flines.length) { row++; for (const ln of I.flines) { scrText(px + 2, row, ln, [.45,.75,.55]); row++; } }
    const foot = I.confirm ? ' [Y] yes  ·  any other key: no ' : '';
    if (foot) {
      ctx.fillStyle = 'rgb(2,3,3)'; ctx.fillRect((px + INS_W - 2 - foot.length) * TW, (py + H - 1) * TH, foot.length * TW, TH);
      scrText(px + INS_W - 2 - foot.length, py + H - 1, foot, fc.map(v => v * .8));
    }
  }
}

// ---------- secret walls and forgotten gods ----------
let altars = {};
const altarDeity = i => GONZO.deities[altars[i]];
const deityFull = D => D.name + (D.title.startsWith('of ') ? ' ' : ', ') + D.title;
function openSecret(x, y, i){
  map[i] = 'RUBBLE'; Snd.slam(); Snd.door(); shake(4);
  for (let k = 0; k < 14; k++) part(x + (rnd() - .5) * .8, y + (rnd() - .5) * .6, (rnd() - .5) * 3, -rnd() * 2, .6 + rnd() * .6, pick(['.', ',', ':', '\'']), [.7,.55,.8], 3);
  log('The odd wall grinds aside. Warm, ancient air rolls out.', [.85,.7,1]);
}
function pray(i, x, y){
  const D = altarDeity(i), P = player;
  if (!D) return;
  if (map[i] === 'ALTARSPENT') { log(`${D.name}'s altar is quiet now. Its light lives in you.`, [.6,.58,.66]); return; }
  map[i] = 'ALTARSPENT';
  if (D.gift === 'mp') { P.maxmp += 5; P.mp = P.maxmp; }
  else if (D.gift === 'both') { P.maxhp += 3; P.maxmp += 3; P.hp = P.maxhp; P.mp = P.maxmp; }
  else if (D.gift === 'armor') state.acBonus = (state.acBonus || 0) + 1;
  else if (D.gift === 'cost') state.costDown = (state.costDown || 0) + 1;
  state.prayed = (state.prayed || 0) + 1;
  flash(x, y, 7, D.col, 2.2, 1400); Snd.zone(); Snd.potion();
  for (let k = 0; k < 24; k++) part(x + (rnd() - .5) * .6, y, (rnd() - .5) * 2.5, -1 - rnd() * 2.5, 1.2 + rnd(), pick(['·', '*', '+', '°']), D.col, -.4, k * .03);
  log(`You kneel before ${deityFull(D)}.`, D.col);
  log(`${D.name} blesses you: ${D.boon}`, D.col.map(v => v * .9 + .1));
  inspect = {x:P.x, y:P.y, key:'prayer', title:D.name, sub:D.title + ' · a blessing', text:D.prayer, fact:D.boon, col:D.col, t0:now(), turn:state.turn + 1};
  Snd.page();
}
// name with its condition up front: 'burning goblin', 'frozen giant leech'
const condName = e => (e.burning > 0 ? 'burning ' : e.frozen > 0 ? 'frozen ' : '') + e.name;
const condText = (key, arr, it) => gonzoPick(key, arr).replace(/\{it\}/g, it);
function describe(x, y){
  const i = idx(x, y);
  if (!seen[i]) return null;
  const e = entAt(x, y);
  if (e && (e.isPlayer || canSee(e))) {
    if (e.isPlayer) return (e.burning > 0 ? 'you, on fire' : e.frozen > 0 ? 'you, frozen' : 'you') + (state.belief ? ' (you believe in yourself)' : '');
    if (e.npc) return (state.mem.knowsName ? 'Eli, the old man' : 'an old man') + ' · trade, talk';
    const D = MONS[e.type], tags = [];
    if (D.hydra) return `${condName(e)} · ${e.heads} head${e.heads === 1 ? '' : 's'}` + (e.stumps ? ` · ${e.stumps} stump${e.stumps > 1 ? 's' : ''}` : '') + ' · burn, then cut';
    if (D.immune?.burn) tags.push('fireproof'); if (D.immune?.frost) tags.push('frostproof'); if (D.immune?.shock) tags.push('shockproof');
    if (D.immune?.melee) tags.push('blades pass through');
    if (D.weak?.burn) tags.push('hates fire'); if (D.weak?.frost) tags.push('hates frost'); if (D.weak?.shock) tags.push('hates lightning');
    if (D.undead) tags.push('undead'); if (D.regen) tags.push('regenerates'); if (D.poison) tags.push('venomous'); if (e.ac >= 17) tags.push('heavily armoured');
    if (e.spent) tags.push('exhausted');
    return `${condName(e)} ${Math.max(0, e.hp)}/${e.maxhp}` + (tags.length ? ' · ' + tags.join(', ') : '');
  }
  const it = items.find(o => o.x === x && o.y === y);
  if (it && vis[i]) return ITEMS[it.kind].name;
  return (fire[i] > 0 && vis[i] ? 'burning ' : '') + TNAME[map[i]] + (snowAcc[i] > .5 && TD[map[i]].snowy ? ', under snow' : '') + (vis[i] ? '' : ' (remembered)');
}

// =====================================================================
//  Drawing
// =====================================================================
let CXr = 0, CYr = 0;   // camera rounded to whole pixels
function css(r, g, b){ return `rgb(${(clamp(r,0,1)*255)|0},${(clamp(g,0,1)*255)|0},${(clamp(b,0,1)*255)|0})`; }
const sx = x => (x - CXr) * TW + TW / 2, sy = y => (y - CYr) * TH + TH / 2;
function glyph(ch, x, y, r, g, b, ox = 0, oy = 0, rot = 0, scx = 1, scy = 1, fill = false){
  const s = css(r, g, b); ctx.fillStyle = s; ctx.strokeStyle = s;
  const cx = sx(x) + ox, cy = sy(y) + oy;
  if (rot || scx !== 1 || scy !== 1) {
    ctx.save(); ctx.translate(cx, cy + TH * .35); ctx.rotate(rot); ctx.scale(scx, scy);
    if (!fill) ctx.strokeText(ch, 0, -TH * .35); ctx.fillText(ch, 0, -TH * .35); ctx.restore();
  } else { if (!fill) ctx.strokeText(ch, cx, cy); ctx.fillText(ch, cx, cy); }
}
function scrText(cx, row, str, col){
  ctx.fillStyle = css(col[0], col[1], col[2]);
  for (let k = 0; k < str.length; k++) if (str[k] !== ' ') ctx.fillText(str[k], (cx + k) * TW + TW / 2, row * TH + TH / 2);
  return cx + str.length;
}
const hudText = (cx, row, str, col) => scrText(cx, VH + row, str, col);
const FLAMES = ['^', '*', '^', '"', '\''];
// a wall torch: wooden handle with a wrapped head and a living flame (or a frost-capped stub)
function drawTorch(x, y, t, h, lit, k, hr, hg, hb){
  const cx = sx(x), cy = sy(y), f = flick(t, h * 50);
  // handle, leaning slightly out from the wall
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(hr * k, hg * k, hb * k); ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(cx - 1.5, cy + TH * .42); ctx.lineTo(cx + .5, cy + TH * .02); ctx.stroke();
  // wrapped head
  ctx.strokeStyle = css(hr * k * .7, hg * k * .6, hb * k * .5); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx + .2, cy + TH * .06); ctx.lineTo(cx + .6, cy - TH * .04); ctx.stroke();
  ctx.lineWidth = 1.3; ctx.lineCap = 'butt';
  if (lit === 'mem') return;   // remembered, out of sight: just the shape
  if (!lit) { // frozen: icy cap, no flame
    ctx.fillStyle = css(.55 * k, .75 * k, 1 * k);
    ctx.beginPath(); ctx.ellipse(cx + .6, cy - TH * .08, 4, 2.6, 0, 0, PI * 2); ctx.fill();
    return;
  }
  const ht = TH * (.42 + .16 * f) * (k < 1 ? .8 : 1), wd = TW * (.26 + .05 * Math.sin(t * 9 + h * 7));
  const sw = Math.sin(t * 5.3 + h * 11) * 2.2 + Math.sin(t * 13 + h * 3) * 1 + (ZONES[zone[idx(x, y)]].outdoor ? W.wind * W.dir * 3 : 0);
  const bx = cx + .6, by = cy - TH * .05;
  const flame = (w, hh, col) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - w, by);
    ctx.bezierCurveTo(bx - w * 1.1, by - hh * .45, bx + sw * .4 - w * .3, by - hh * .7, bx + sw, by - hh);
    ctx.bezierCurveTo(bx + sw * .4 + w * .3, by - hh * .7, bx + w * 1.1, by - hh * .45, bx + w, by);
    ctx.quadraticCurveTo(bx, by + w * .9, bx - w, by); ctx.fill();
  };
  flame(wd, ht, css(1 * k * 1.1, (.38 + .2 * f) * k, .08 * k));
  flame(wd * .6, ht * .68, css(1.2 * k, (.72 + .2 * f) * k, .25 * k));
  flame(wd * .3, ht * .38, css(1.3 * k, 1.15 * k, .75 * k));
}
const FLOWERC = [[1,.55,.75],[1,.9,.4],[.9,.9,1],[.75,.6,1]];

function drawTiles(t, tn){
  const x0 = Math.max(0, Math.floor(CXr) - 1), x1 = Math.min(MW - 1, Math.floor(CXr) + WVW + 1);
  const y0 = Math.max(0, Math.floor(CYr) - 1), y1 = Math.min(MH - 1, Math.floor(CYr) + WVH + 1);
  const mist = .05 + .05 * Math.sin(t * .05);
  const fogQ = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y*MW + x; if (!seen[i]) continue;
    const key = map[i], d = TD[key], z = zone[i], Zd = ZONES[z];
    const far = !vis[i];
    if (far && !farv[i]) { const m = d.block ? .15 : .085;
      if (key === 'TORCH' || key === 'TORCHOUT') drawTorch(x, y, t, hash(i), 'mem', 1, m*.9, m*.8, m*.7); else glyph(d.ch, x, y, m*.8, m, m*.9); continue; }
    let r = lr[i], g = lg[i], b = lb[i];
    let ch = d.ch, cr = d.col[0], cg = d.col[1], cb = d.col[2], ox = 0, oy = 0, rot = 0, br = 1, em = 0;
    const h = hash(i), L = Zd.outdoor ? localW(z) : null, snow = Zd.outdoor ? snowAcc[i] : 0;
    if (d.water) {
      const sp = d.bog ? .5 : 1;
      const w = Math.sin(t*1.7*sp + x*.7 + y*.45) + Math.sin(t*2.3*sp - x*.4 + y*.9);
      br = .8 + .18*w; em = (d.bog ? .05 : .09) + .04*w;
      oy = Math.sin(t*2*sp + x*.8 + y*.3) * (d.bog ? .8 : 1.4);
      ch = key === 'DEEP' ? (((t*.7 + h*5) | 0) % 4 === 0 ? '~' : '≈') : (((t*.9*sp + h*7) | 0) % 3 === 0 ? '≈' : '~');
      const s = (t*.23 + h*3) % 1;
      if (s < .045 && !d.bog) { const k = 1 - s/.045; br += 1.3*k; em += .5*k; cr += (1-cr)*k; cg += (1-cg)*k; }
      if (L && L.rain > .2 && hash(i + Math.floor(t * 9)) < .05 * L.rain) { ch = 'o'; em += .3; }   // raindrop rings
      if (d.bog && rnd() < .0025) { part(x + (rnd() - .5) * .5, y, 0, -.5, .9, '°', [.6,.75,.45], -.2); if (cheb({x, y}, player) < 6) Snd.blup(); }
      const et = tn - elecT[i];
      if (et > 0 && et < 750) { const k = 1 - et/750; em += 1.6*k; cr += (.85-cr)*k; cg += (.95-cg)*k; cb = 1;
        if (rnd() < .35*k) ch = rnd() < .5 ? '*' : '≈'; ox += (rnd()-.5)*4*k; if (rnd() < .04*k) sparks(x, y, 1); }
    } else if (d.lava) {
      const n = noise2(x * .7 + t * .15, y * .7 - t * .1);
      r = g = b = 0; em = .7 + .6 * n; cr = 1; cg = .22 + .45 * n * n; cb = .05 + .1 * n * n * n;
      ch = n > .72 ? '*' : ((t * .6 + h * 4) | 0) % 3 === 0 ? '~' : '≈'; oy = Math.sin(t * 1.2 + x * .6) * 1;
      if (rnd() < .002) { part(x, y, 0, -.6, .8, '°', [1,.55,.15], -.1); ember(x, y); }
    } else if (d.plant) {
      const tree = d.tree, wind = L ? L.wind : 0, g2 = L ? gust(t, x) * wind : 0;
      const reed = key === 'REEDS', amp = (key === 'BUSH' ? .6 : tree ? .5 : reed ? 1.2 : 1.7) * (1 + wind * (reed ? 1.4 : 2.2)) * (z === Z.MIRE ? .75 : 1);
      let sw = Math.sin(t*1.4 + x*.55 + y*.25 + h*2) * amp + g2 * (tree ? 2 : reed ? 2.4 : 4) * W.dir + wind * W.dir * (tree ? .6 : reed ? 1 : 1.5);
      if (L && L.rain > .1) sw += (noise2(t * 9, i) - .5) * 3 * L.rain;            // rain shakes the leaves
      ox = sw; rot = sw * (tree ? .035 : key === 'BUSH' ? .03 : reed ? .05 : .08);
      if (key === 'FLOWER') { const c = FLOWERC[Math.floor(h * 4)]; cr = c[0]; cg = c[1]; cb = c[2]; }
      if (tree && L) {
        if (L.rain > .2 && rnd() < .004 * L.rain) part(x + (rnd() - .5) * .6, y, 0, 3, .35, '.', [.6,.75,1], 8);
        if (wind > .3 && rnd() < .0025 * wind && key !== 'PINE' && key !== 'DEADTREE')
          part(x, y, W.dir * (2 + rnd() * 3), -.5 + rnd(), 2 + rnd(), pick([',','`','\'']), pick([[.4,.8,.3],[.8,.6,.25],[.7,.75,.3]]), .4);
        if (snow > .3 && wind > .35 && rnd() < .003) for (let k = 0; k < 3; k++) part(x + (rnd() - .5) * .4, y - .4, W.dir * (1 + rnd()), .3 + rnd(), 1, '·', [.95,.97,1], 1);
      }
    } else if (key === 'TORCH' || key === 'HEARTH' || key === 'CAMPFIRE') {
      const f = flick(t, h*50);
      r = g = b = 0; em = .85 + .35*f; cr = 1; cg = .5 + .3*f; cb = .18; oy = -f*.8;
      if (rnd() < .07) ember(x, y - .3);
    } else if (key === 'WINDOW') { em = .3 + .1 * flick(t, 9); cr = 1; cg = .78; cb = .4; }
    else if (key === 'ALTAR') { const D = altarDeity(i), c = D ? D.col : [1,.8,.5], p = .5 + .5 * Math.sin(t * 2.1 + h * 9);
      r = g = b = 0; em = .8 + .4 * p; cr = .6 + .4 * c[0]; cg = .6 + .4 * c[1]; cb = .6 + .4 * c[2]; oy = -p * 1.2;
      if (rnd() < .06) part(x + (rnd() - .5) * .6, y - .2, (rnd() - .5) * .3, -.5 - rnd() * .5, 1.4, pick(['·', '°', '*']), c, -.15); }
    else if (key === 'SECRET') { const s = (t * .19 + h * 7) % 1; em = .06 + (s < .04 ? .5 * (1 - s / .04) : 0) + .04 * Math.sin(t * 1.3 + h * 20); }
    else if (key === 'RUNELIT') { const p = .5 + .5 * Math.sin(t * 4 + h * 9); r = g = b = 0; em = 1 + .5 * p; cr = .65; cg = .85; cb = 1; oy = -p;
      if (rnd() < .05) sparks(x, y, 1); }
    else if (key === 'RUNE') { em = .08 + .06 * Math.sin(t * 1.1 + h * 5); }
    else if (key === 'EGGSAC') { const p = Math.pow(.5 + .5 * Math.sin(t * 2.4 + h * 9), 3); em = .1 + .25 * p; ox = Math.sin(t * 9 + h) * .6 * p; }
    else if (key === 'WEB') { em = .03 + (((t * .2 + h * 6) % 1) < .03 ? .35 : 0); }
    else if (key === 'GRAVEDONE') { const p = .5 + .5 * Math.sin(t * 1.4); em = .35 + .2 * p; }
    else if (key === 'CHASM') { r *= .25; g *= .25; b *= .3; ch = ((t * .4 + h * 5) | 0) % 5 === 0 ? '▒' : '░'; }
    else if (key === 'VENT') { const f = flick(t * 1.5, h * 30); r = g = b = 0; em = .5 + .4 * f; if (rnd() < .05) steam(x, y - .2); }
    else if (key === 'OBSIDIAN') { const s = (t * .2 + h * 5) % 1; if (s < .03) { em += .8 * (1 - s / .03); } em += .04; }
    else if (key === 'ICE' || key === 'ICEWALL') {
      const s = (t*.15 + h*4) % 1;
      em = .05; if (s < .03) { const k = 1 - s/.03; em += .8*k; cr += (1-cr)*k; cg += (1-cg)*k; }
    }
    // snow lying on the ground
    if (snow > .05 && d.snowy && !fire[i]) { const k = Math.min(1, snow) * .85; cr += (.92 - cr) * k; cg += (.95 - cg) * k; cb += (1 - cb) * k;
      if (snow > .6 && key === 'GRASS') ch = ','; if (rnd() < .0006 * snow) em += .6; }
    const ft = tn - frostT[i]; if (ft < 700) { const k = 1 - ft/700; em += 1.1*k; cr += (.8-cr)*k; cg += (.95-cg)*k; cb = 1; }
    if (fire[i] > 0) {
      const f = hash(i + ((t*14) | 0));
      r = g = b = 0;
      if (d.plant && !d.tree) { ch = FLAMES[((t*11 + h*10) | 0) % FLAMES.length]; cr = 1; cg = .3 + .5*f; cb = .06; em = 1.15; rot = 0; ox *= .3; oy = -1 - Math.sin(t*20 + h*9)*1.5; }
      else { cr = 1; cg = .35 + .3*f; cb = .1; em = .75 + .3*f; ox += (rnd()-.5)*1.5; }
      if (rnd() < (d.tree ? .3 : .14)) ember(x, y);
    }
    let R = cr*(r*br + em), G = cg*(g*br + em), B = cb*(b*br + em);
    // fog / haze, lit by whatever light is nearby
    let fd = Zd.fog + (L ? .14 * L.rain + .12 * L.snow : 0) + mist * (Zd.indoor ? 0 : 1);
    if (fd > 0) {
      const wv = (L ? L.wind : 0) * W.dir;
      const n = noise2(x * .13 + t * (.12 + wv * .7), y * .2 + t * .03) * .65 + noise2(x * .31 - t * .08, y * .37 + 5) * .35;
      const dist = Math.min(1, Math.hypot(x - player.x, y - player.y) / 9);
      const f = clamp(fd * (.3 + 1.2 * smooth(.3, .8, n)) * (.5 + .5 * dist), 0, .88);
      const fl = (lr[i] + lg[i] + lb[i]) / 3, fc = Zd.fogCol, fk = .05 + .45 * fl;
      R = R * (1 - f * .8) + fc[0] * fk * f; G = G * (1 - f * .8) + fc[1] * fk * f; B = B * (1 - f * .8) + fc[2] * fk * f;
      if (f > .38) fogQ.push(x, y, (f - .38) * .9, fc[0] * fk * 1.6, fc[1] * fk * 1.6, fc[2] * fk * 1.6, n);
    }
    if (far) { R *= .38; G *= .38; B *= .42; }   // beyond your circle of sight: dim shapes only
    if (key === 'TORCH' || key === 'TORCHOUT') {
      const lk = Math.min(1.2, (lr[i] + lg[i] + lb[i]) / 3 + (key === 'TORCH' ? .5 : .08)) * (far ? .45 : 1);
      drawTorch(x, y, t, h, key === 'TORCH', 1, .62 * lk, .4 * lk, .22 * lk);
    } else glyph(ch, x, y, R, G, B, ox, oy, rot);
    // snow gathering on tops of trees, rocks, roofs
    if (snow > .08 && d.cap && !fire[i]) {
      const w = (5 + 4 * Math.min(1, snow)) * (key === 'ROCK' ? .8 : 1), lt = .3 + Math.min(1, (r + g + b) / 3 + em);
      ctx.fillStyle = css(.95 * lt, .97 * lt, 1 * lt);
      ctx.beginPath(); ctx.ellipse(sx(x) + ox * .9, sy(y) - TH * (key === 'ROCK' ? .3 : .36) + oy, w, 1.2 + 2.2 * Math.min(1, snow), rot, PI, 0); ctx.fill();
    }
  }
  // drifting fog wisps drawn as soft block characters
  if (fogQ.length) {
    for (let k = 0; k < fogQ.length; k += 7) {
      ctx.globalAlpha = Math.min(.5, fogQ[k + 2]);
      ctx.fillStyle = css(fogQ[k + 3], fogQ[k + 4], fogQ[k + 5]);
      ctx.fillText(fogQ[k + 6] > .62 ? '▒' : '░', sx(fogQ[k]) + Math.sin(t * .4 + fogQ[k + 1]) * 3, sy(fogQ[k + 1]));
    }
    ctx.globalAlpha = 1;
  }
}

function drawItems(t){
  for (const it of items) {
    const i = idx(it.x, it.y); if (!vis[i]) continue;
    const I = ITEMS[it.kind], glow = it.kind === 'tome' || it.kind === 'stone' || it.kind === 'lily' ? .8 + .4 * Math.sin(t * 3 + i) : 0;
    const col = it.kind === 'tome' ? SPELLS[spellKey(it.spell)].col : I.col;
    glyph(I.ch, it.x, it.y, col[0]*(.3 + lr[i] + glow), col[1]*(.3 + lg[i] + glow), col[2]*(.3 + lb[i] + glow), 0, Math.sin(now()/400 + i)*.8);
    if (glow && rnd() < .06) part(it.x + (rnd() - .5) * .6, it.y, 0, -.5, 1, '·', col, -.1);
  }
}

function drawEntity(e, t, tn){
  const i = idx(e.x, e.y), T = e.tf, D = MONS[e.type] || {}, off = (e.s - 1) / 2;
  let [cr, cg, cb] = e.col, ox = T.ox * TW, oy = T.oy + (e.s > 1 ? TH * .3 : 0);
  if (e.isPlayer) { [cr, cg, cb] = state.belief ? [1, .9 + .08 * Math.sin(t * 2), .55] : [1, 1, .85];
    if (state.belief && rnd() < .05) part(e.vx + (rnd() - .5) * .8, e.vy + (rnd() - .5) * .6, 0, -.4, .8, '·', [1,.9,.5]); }
  else if (!e.npc) { cr *= .35 + .8*lr[i]; cg *= .35 + .8*lg[i]; cb *= .35 + .8*lb[i]; }
  else { const f = .4 + .7 * Math.min(1, (lr[i] + lg[i] + lb[i]) / 3); cr *= f; cg *= f; cb *= f;
    if (rnd() < .06) part(e.vx + .25 * e.face, e.vy - .35, (rnd() - .5) * .2, -.45, 1.6, rnd() < .5 ? '~' : '°', [.5,.5,.55], -.08); }
  if (D.glow) { const f = .8 + .3 * flick(t, e.seed); cr *= f; cg *= f; cb *= f; }
  if (e.type === 'wisp' || e.type === 'wraith') { const a = .6 + .4 * Math.sin(t * 5 + e.seed); cr *= a; cg *= a; cb *= a;
    if (rnd() < .08) part(e.vx, e.vy + .2, (rnd() - .5) * .3, .2, .7, '·', e.col.map(c => c * .6)); }
  if ((e.type === 'imp' || e.type === 'golem' || e.type === 'dragon') && rnd() < .12 * e.s) ember(e.vx + off + (rnd() - .5) * off * 2, e.vy - .2);
  if (e.phase === 'charge') { const k = (3 - e.pt) / 2; cr = 1; cg = .5 + .4 * k * (.5 + .5 * Math.sin(t * 20)); cb = .2 + .5 * k; ox += Math.sin(t * 50) * k * 1.5;
    if (rnd() < .4) part(e.vx + off + (rnd() - .5) * 3, e.vy + off + (rnd() - .5) * 3, 0, 0, .4, pick(['·', '*']), [1, .6, .2], 0); }
  if (e.spent && rnd() < .05) part(e.vx + off, e.vy - .4, (rnd() - .5) * .3, -.6, 1.4, '°', [.55,.55,.55], -.08);
  if (e.cast) { const p = .5 + .5 * Math.sin(t * 9); cr = .7 + .3 * p; cg = .5 + .2 * p; cb = 1;
    if (rnd() < .3) part(e.vx + (rnd() - .5) * 1.4, e.vy + (rnd() - .5) * 1.4, (e.vx - e.x) * 0, -.3, .6, '·', e.cast.kind === 'ray' ? [.6,.3,1] : [.6,.85,1], 0); }
  if (e.poison && e.isPlayer && rnd() < .04) part(e.vx + (rnd() - .5) * .5, e.vy, 0, -.4, .9, '•', [.5,1,.3], -.1);
  if (D.puff && ZONES[zone[i]].outdoor && rnd() < .02) for (let k = 0; k < 2; k++) part(e.vx + .2 * e.face, e.vy - .3, e.face * .4, -.2, 1, '°', [.9,.92,1], -.05);
  if (e.frozen) { cr = .6; cg = .9; cb = 1; ox += Math.sin(t*45) * .6; if (rnd() < .03) frostBits(e.x, e.y); }
  if (e.burning) { const f = rnd(); cr = 1; cg = .4 + .4*f; cb = .15; if (rnd() < .3) ember(e.vx, e.vy); }
  if (tn >= e.hitT && tn - e.hitT < 170) { cr = cg = cb = 1.2; ox += (rnd()-.5)*5; }
  // tongue lash
  if (T.tongue > 0 && e.act) {
    const len = T.tongue * 1.05;
    ctx.strokeStyle = css(1, .45, .6); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx(e.vx) + ox, sy(e.vy) + 2); ctx.lineTo(sx(e.vx + e.act.dx * len) + ox, sy(e.vy + e.act.dy * len) + 2); ctx.stroke();
    ctx.fillStyle = css(1, .55, .7); ctx.beginPath(); ctx.arc(sx(e.vx + e.act.dx * len), sy(e.vy + e.act.dy * len) + 2, 3, 0, PI * 2); ctx.fill();
    ctx.lineWidth = 1.3;
  }
  // afterimages for fast, sweeping attacks
  if (e.act && ATK[e.act.style].ghosts) {
    const A = ATK[e.act.style], p = (tn - e.act.t0) / A.dur;
    for (let j = A.ghosts; j >= 1; j--) {
      const q = p - j * .05; if (q <= 0) continue;
      const f = A.f(q, e.act.dx, e.act.dy, e.act.s, t), a = .32 / j;
      ctx.globalAlpha = a;
      glyph(e.ch, e.x + off + f.ox, e.y + off + f.oy, cr, cg, cb, 0, oy, T.rot - (ATK[e.act.style].f(p, e.act.dx, e.act.dy, e.act.s, t).rot - f.rot), T.sx, T.sy, true);
    }
    ctx.globalAlpha = 1;
    // the whip's swoosh arc
    if (e.act.style === 'whip' && p > .35 && p < .8) {
      const k = (p - .35) / .45, base = Math.atan2(e.act.dy, e.act.dx), cxp = sx(e.x + e.act.dx * .35), cyp = sy(e.y + e.act.dy * .35);
      ctx.strokeStyle = css(1, 1, .85); ctx.globalAlpha = .7 * (1 - k); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cxp, cyp, TW * .95, base - 1.4 + k * 1.2 * e.act.s, base + .2 + k * 1.4 * e.act.s); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 1.3;
    }
  }
  ctx.globalAlpha = T.alpha;
  glyph(e.ch, e.vx + off, e.vy + off, cr, cg, cb, ox, oy, T.rot, T.sx * (e.s > 1 ? 1.25 : 1), T.sy);
  ctx.globalAlpha = 1;
  // the hydra's heads, swaying on their necks; stumps show as red nubs
  if (D.hydra && !e.dead) {
    const cx = e.vx + off, n = e.heads + e.stumps;
    ctx.font = PFONT;
    for (let k = 0; k < n; k++) {
      const a = (k + .5) / n * PI - PI, stump = k >= e.heads, sw = Math.sin(t * 2.2 + k * 1.7) * .12;
      const hx = cx + Math.cos(a + sw) * (stump ? .7 : 1.05), hy = e.vy - .15 + Math.sin(a + sw) * (stump ? .55 : .95);
      ctx.strokeStyle = css(cr * .6, cg * .6, cb * .6); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(sx(cx), sy(e.vy + .35)); ctx.lineTo(sx(hx), sy(hy)); ctx.stroke();
      const c = stump ? [1, .3, .25] : [cr, cg, cb];
      ctx.fillStyle = css(c[0] * 1.1, c[1] * 1.1, c[2] * 1.1); ctx.fillText(stump ? '•' : (Math.sin(t * 3 + k) > .7 ? 'O' : 'o'), sx(hx), sy(hy));
    }
    ctx.font = FONT; ctx.lineWidth = 1.3;
  }
  if (!e.isPlayer && !e.npc && !e.boss && e.hp < e.maxhp && !e.dead) {
    ctx.fillStyle = css(.9, .25, .2);
    ctx.fillRect(sx(e.vx) - TW / 2 + 2, sy(e.vy) + TH / 2 - 2, (TW - 4) * Math.max(0, e.hp) / e.maxhp, 2);
  }
}
// the pillar of holy light
function drawPillars(tn){
  pillars = pillars.filter(Pl => {
    const p = (tn - Pl.t0) / Pl.dur; if (p >= 1) return false;
    const fall = Math.min(1, p * 6), fade = p < .15 ? 1 : 1 - (p - .15) / .85, cx = sx(Pl.x), cy = sy(Pl.y), top = sy(CYr - 2);
    const w = TW * (1.6 + .5 * Math.sin(tn / 60)) * (.6 + .4 * fade), bottom = top + (cy + TH * .4 - top) * fall;
    const gr = ctx.createLinearGradient(0, top, 0, bottom);
    gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(.6, `rgba(255,235,170,${.35 * fade})`); gr.addColorStop(1, `rgba(255,250,225,${.8 * fade})`);
    ctx.fillStyle = gr; ctx.fillRect(cx - w, top, w * 2, bottom - top);
    ctx.fillStyle = `rgba(255,255,240,${.7 * fade})`; ctx.fillRect(cx - w * .25, top, w * .5, bottom - top);
    // rings spreading over the floor where it lands
    for (let k = 0; k < 3; k++) {
      const q = (p * 1.6 - k * .22); if (q <= 0 || q >= 1) continue;
      ctx.strokeStyle = `rgba(255,230,160,${.7 * (1 - q)})`; ctx.lineWidth = 2.5 * (1 - q) + .5;
      ctx.beginPath(); ctx.ellipse(cx, cy + TH * .2, TW * 2.8 * q, TH * 1.6 * q, 0, 0, PI * 2); ctx.stroke();
    }
    ctx.lineWidth = 1.3;
    return true;
  });
}
// slashes left by critical hits
function drawSlashes(tn){
  slashes = slashes.filter(S => {
    const p = (tn - S.t0) / S.dur; if (p >= 1) return false;
    const grow = Math.min(1, p * 4), fade = 1 - p, L = S.len * grow;
    const ax = sx(S.x - Math.cos(S.a) * L), ay = sy(S.y - Math.sin(S.a) * L * .8), bx = sx(S.x + Math.cos(S.a) * L), by = sy(S.y + Math.sin(S.a) * L * .8);
    ctx.lineCap = 'round';
    ctx.globalAlpha = .55 * fade; ctx.strokeStyle = css(...S.col); ctx.lineWidth = 7 * fade + 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.globalAlpha = fade; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 1.3; ctx.lineCap = 'butt';
    return true;
  });
}
// telegraphed attacks: the floor tells you where not to be
function drawDanger(t){
  const x0 = Math.max(0, Math.floor(CXr) - 1), x1 = Math.min(MW - 1, Math.floor(CXr) + WVW + 1);
  const y0 = Math.max(0, Math.floor(CYr) - 1), y1 = Math.min(MH - 1, Math.floor(CYr) + WVH + 1);
  const p = .5 + .5 * Math.sin(t * 8);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = danger[idx(x, y)]; if (!k || !vis[idx(x, y)]) continue;
    const c = k === 1 ? [1, .35, .1] : k === 2 ? [.6, .3, 1] : [.5, .8, 1];
    ctx.globalAlpha = (k === 3 ? .1 : .05) + .07 * p;
    ctx.fillStyle = css(...c); ctx.fillRect(sx(x) - TW / 2, sy(y) - TH / 2, TW, TH);
    ctx.globalAlpha = .5 + .4 * p;
    if (k === 3) glyph('×', x, y, c[0], c[1], c[2], 0, 0, 0, 1, 1, true);
  }
  ctx.globalAlpha = 1;
}
// a boss's health, across the top of the view
function drawBossBar(t){
  const b = ents.find(e => e.boss && e.awake && !e.dead);
  if (!b || dlg) return;
  const D = MONS[b.type], name = ` ${b.name.toUpperCase()} `;
  const frac = D.hydra ? b.heads / 9 : clamp(b.hp / b.maxhp, 0, 1), n = 30, f = Math.round(frac * n);
  const x0 = Math.floor((VW - n) / 2);
  ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect((x0 - 1) * TW, 0, (n + 2) * TW, TH * 2.1);
  scrText(Math.floor((VW - name.length) / 2), 0, name, b.col.map(v => .5 + v * .5));
  if (D.hydra) scrText(x0, 1, `${b.heads} heads`.padEnd(10) + (b.stumps ? `${b.stumps} bleeding stump${b.stumps > 1 ? 's' : ''}` : ''), [.6,1,.6]);
  else { scrText(x0, 1, '█'.repeat(f), [1, .3 + (b.spent ? .5 : 0), .25]); scrText(x0 + f, 1, '░'.repeat(n - f), [.35,.15,.15]); }
}
function drawEnts(t, tn){
  for (const e of ents) {
    if (e.dead) continue;
    updateEnt(e, t, tn);
    if (!e.isPlayer && !canSee(e)) continue;
    drawEntity(e, t, tn);
  }
  dying = dying.filter(D => {
    if (tn >= D.at) { shatter(D.e); if (D.e.s > 1) { shake(8); Snd.slam(); } return false; }
    updateEnt(D.e, t, tn); drawEntity(D.e, t, tn); return true;
  });
}

function jag(pts){
  const o = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const ax = sx(pts[k][0]), ay = sy(pts[k][1]), bx = sx(pts[k+1][0]), by = sy(pts[k+1][1]);
    o.push([ax, ay]);
    for (let s = 1; s < 3; s++) { const f = s/3; o.push([ax + (bx-ax)*f + (rnd()-.5)*12, ay + (by-ay)*f + (rnd()-.5)*12]); }
  }
  const l = pts[pts.length - 1]; o.push([sx(l[0]), sy(l[1])]);
  return o;
}
function strokePath(p){ ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length; k++) ctx.lineTo(p[k][0], p[k][1]); ctx.stroke(); }
function drawBolts(tn){
  bolts = bolts.filter(b => {
    const p = (tn - b.t0) / b.dur; if (p >= 1) return false;
    b.jag = jag(b.pts);
    if (!b.forks || tn - (b.jt || 0) > 45) { b.jt = tn; b.forks = [];
      for (let f = 0; f < 3; f++) { let k = ri(1, b.pts.length - 1), fx = b.pts[k][0], fy = b.pts[k][1]; const fp = [[fx, fy]];
        for (let n = 0; n < 4; n++) { fx += (rnd()-.5)*1.6; fy += (rnd()-.5)*1.1; fp.push([fx, fy]); } b.forks.push(fp); } }
    ctx.globalAlpha = (1 - p*p) * (rnd() < .15 ? .4 : 1);
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = b.col ? css(...b.col) : 'rgb(110,160,255)'; ctx.lineWidth = 6; strokePath(b.jag);
    ctx.lineWidth = 2; b.forks.forEach(f => strokePath(f.map(([x, y]) => [sx(x), sy(y)])));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; strokePath(b.jag);
    ctx.globalAlpha = 1; ctx.lineJoin = 'round';
    return true;
  });
}
function updateProjs(tn){
  for (const pr of projs.slice()) {
    const k = (tn - pr.t0) / pr.msPer;
    if (k >= pr.cells.length) { projs.splice(projs.indexOf(pr), 1); pr.onDone(); continue; }
    const a = Math.floor(k), f = k - a, from = a === 0 ? [pr.sx, pr.sy] : pr.cells[a - 1], to = pr.cells[a];
    pr.x = from[0] + (to[0] - from[0]) * f; pr.y = from[1] + (to[1] - from[1]) * f;
    pr.trail(pr.x, pr.y);
  }
}
function drawProjs(){ for (const pr of projs) glyph(pr.ch, pr.x, pr.y, pr.col[0]*1.3, pr.col[1]*1.3, pr.col[2]*1.3, 0, 0, now()/60); }

function drawParticles(dt){
  if (now() < hitStop) dt *= .06;
  ctx.font = PFONT;
  parts = parts.filter(p => {
    if (p.d > 0) { p.d -= dt; return true; }
    p.life -= dt; if (p.life <= 0) return false;
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += p.g*dt;
    ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
    ctx.fillStyle = css(p.col[0], p.col[1], p.col[2]);
    if (p.big) { ctx.font = FONT; ctx.strokeStyle = ctx.fillStyle; ctx.strokeText(p.ch, sx(p.x), sy(p.y)); ctx.fillText(p.ch, sx(p.x), sy(p.y)); ctx.font = PFONT; }
    else ctx.fillText(p.ch, sx(p.x), sy(p.y));
    return true;
  });
  ctx.globalAlpha = 1; ctx.font = FONT;
}

// ----- weather particles, fireflies, birds
function updateWeather(t, dt){
  const tg = WTARGET[state.weather.type];
  for (const k of ['rain', 'snow', 'wind']) W[k] += ((tg[k] || 0) - W[k]) * Math.min(1, dt * .35);
  // accumulate / melt snow on the ground (outdoors only)
  const melt = dt * .006, acc = dt * .014;
  for (let i = 0; i < snowAcc.length; i++) {
    const z = zone[i]; if (!ZONES[z].outdoor) continue;
    const s = localW(z).snow;
    if (s > .05) snowAcc[i] = Math.min(1, snowAcc[i] + acc * s * (.6 + .8 * hash(i)));
    else if (snowAcc[i] > 0) snowAcc[i] = Math.max(z === Z.PASS ? .55 : 0, snowAcc[i] - melt * (1 + W.rain * 3));
  }
  // spawn drops and flakes over the outdoor part of the view
  for (let n = 0; n < 14; n++) {
    const x = CX - 2 + rnd() * (WVW + 4), y = CY - 3 + rnd() * (WVH + 3), i = idx(clamp(Math.floor(x), 0, MW - 1), clamp(Math.floor(y), 0, MH - 1));
    const z = zone[i]; if (!ZONES[z].outdoor || wparts.length > 900) continue;
    const L = localW(z);
    if (rnd() < L.rain * .75) wparts.push({k:0, x, y, vx:L.wind * W.dir * 9, vy:24 + rnd() * 6, life:.25 + rnd() * .35});
    else if (rnd() < L.snow * .45) wparts.push({k:1, x, y, vx:L.wind * W.dir * 4, vy:1.2 + rnd() * 1.3, life:2.5 + rnd() * 3, ph:rnd() * 6});
  }
  // fireflies in the mire
  const inMire = zone[idx(player.x, player.y)] === Z.MIRE;
  if (inMire && flies.length < 16 && rnd() < .2) flies.push({x:player.x + (rnd() - .5) * 36, y:player.y + (rnd() - .5) * 24, vx:0, vy:0, ph:rnd() * 6});
  flies = flies.filter(f => {
    f.vx += (rnd() - .5) * dt * 6; f.vy += (rnd() - .5) * dt * 6; f.vx *= .96; f.vy *= .96;
    f.x += f.vx * dt; f.y += f.vy * dt;
    return Math.abs(f.x - player.x) < 26 && Math.abs(f.y - player.y) < 18 && zone[idx(clamp(Math.round(f.x), 0, MW - 1), clamp(Math.round(f.y), 0, MH - 1))] === Z.MIRE;
  });
  // birds over the pass
  if (zone[idx(player.x, player.y)] === Z.PASS && rnd() < .0015 && W.snow < .5) {
    const y = CY + 2 + rnd() * 6, dir = rnd() < .5 ? 1 : -1, x = dir > 0 ? CX - 1 : CX + WVW + 1;
    for (let k = 0; k < ri(3, 6); k++) parts.push({x:x - dir * k * .9, y:y + (k % 2) * .6 + rnd() * .3, vx:dir * (4 + rnd()), vy:(rnd() - .5) * .3, life:20, max:20, ch:'v', col:[.3,.35,.4], g:0, d:0, bird:1});
  }
}
// weather only shows where you can actually see: in line of sight, and lit (or close)
const wSee = (x, y) => { const tx = clamp(Math.floor(x), 0, MW - 1), ty = clamp(Math.floor(y), 0, MH - 1), i = idx(tx, ty);
  return vis[i] && (lumS[i] > .05 || Math.max(Math.abs(tx - player.x), Math.abs(ty - player.y)) <= 5); };
function drawWeather(t, dt){
  // rain as one batched stroke
  ctx.strokeStyle = 'rgba(160,185,255,.5)'; ctx.lineWidth = 1.2; ctx.beginPath();
  const keep = [];
  for (const p of wparts) {
    p.life -= dt; p.x += (p.vx + (p.k ? Math.sin(t * 1.5 + p.ph) * .8 : 0)) * dt; p.y += p.vy * dt;
    const i = idx(clamp(Math.floor(p.x), 0, MW - 1), clamp(Math.floor(p.y), 0, MH - 1));
    if (!ZONES[zone[i]].outdoor) continue;
    if (p.life <= 0) { if (!p.k && rnd() < .35 && wSee(p.x, p.y)) part(p.x, p.y, (rnd() - .5) * 2, -1.5, .18, '.', [.6,.7,.95], 10); continue; }
    keep.push(p);
    if (!p.k && wSee(p.x, p.y)) { ctx.moveTo(sx(p.x), sy(p.y)); ctx.lineTo(sx(p.x - p.vx * .025), sy(p.y - p.vy * .025)); }
  }
  ctx.stroke(); ctx.lineWidth = 1.3;
  wparts = keep;
  ctx.font = PFONT; ctx.fillStyle = 'rgb(235,240,255)';
  for (const p of wparts) if (p.k && wSee(p.x, p.y)) { ctx.globalAlpha = Math.min(1, p.life) * .85; ctx.fillText(p.ph > 4.5 ? '*' : '·', sx(p.x), sy(p.y)); }
  ctx.globalAlpha = 1;
  for (const f of flies) {
    if (!wSee(f.x, f.y)) continue;
    const a = .5 + .5 * Math.sin(t * 3 + f.ph); ctx.globalAlpha = .4 + .6 * a;
    ctx.fillStyle = css(.85 + .15 * a, 1, .4); ctx.fillText('•', sx(f.x), sy(f.y));
  }
  ctx.globalAlpha = 1; ctx.font = FONT;
  for (const p of parts) if (p.bird) p.ch = Math.sin(t * 12 + p.y * 7) > 0 ? 'v' : '^';
}

function drawTargeting(t){
  if (!state.targeting || !hover) return;
  const sp = SPELLS[state.targeting], tr = tracePath(sp, hover[0], hover[1]);
  const pulse = .5 + .5*Math.sin(t*10);
  tr.cells.forEach(([x, y]) => glyph('·', x, y, sp.col[0]*(.5 + pulse*.5), sp.col[1]*(.5 + pulse*.5), sp.col[2]*(.5 + pulse*.5), 0, -TH*.32));
  const end = tr.hit || tr.cells[tr.cells.length - 1];
  if (end) glyph('×', end[0], end[1], sp.col[0], sp.col[1], sp.col[2], 0, 0);
}
function drawCursor(t){
  if (!hover || state.dead || state.won || dlg) return;
  const [x, y] = hover, P = player;
  if (!state.targeting && !state.travel && seen[idx(x, y)] && !(x === P.x && y === P.y)) {
    const path = Math.max(Math.abs(x - P.x), Math.abs(y - P.y)) === 1 ? [[x, y]] : findPath(P.x, P.y, x, y);
    if (path) path.slice(0, visibleMonsters().length ? Math.min(1, path.length - 1) : -1).forEach(([px, py]) => glyph('·', px, py, .25, .55, .3, 0, -TH*.32));
  }
  const pulse = .55 + .25*Math.sin(t*6);
  const col = state.targeting ? SPELLS[state.targeting].col : [.4, 1, .55];
  ctx.strokeStyle = css(col[0]*pulse, col[1]*pulse, col[2]*pulse); ctx.lineWidth = 1.5;
  ctx.strokeRect(sx(x) - TW / 2 + 1, sy(y) - TH / 2 + 2, TW - 2, TH - 4);
  ctx.lineWidth = 1.3;
}

let spellBtns = [], sndBtn = null, hudZones = {};
function bar(v, m, n = 10){ const f = Math.round(clamp(v / m, 0, 1) * n); return '█'.repeat(f) + '░'.repeat(n - f); }
function weatherLabel(){
  const z = zone[idx(player.x, player.y)];
  if (!ZONES[z].outdoor) return 'underground';
  const L = localW(z), s = [];
  if (state.weather.type === 'storm' && L.rain > .4) return 'storm';
  if (L.snow > .4 && L.wind > .5) return 'blizzard';
  if (L.rain > .35) s.push('rain'); if (L.snow > .35) s.push('snow'); if (L.wind > .35) s.push('wind');
  return s.join(' + ') || 'clear';
}
function drawHUD(t){
  const P = player;
  hudText(0, 0, '─'.repeat(VW), [.2,.3,.22]);
  const zl = ` ${state.floor}/${NFLOORS} · ${ZONES[state.zone]?.name || ''} · ${weatherLabel()} `;
  ctx.fillStyle = '#000'; ctx.fillRect(TW, VH * TH, zl.length * TW, TH);
  hudText(1, 0, zl, [.55,.7,.6]);
  hudZones = {hp:[1]};
  let c = hudText(1, 1, 'HP', [.6,.75,.6]);
  c = hudText(c, 1, bar(P.hp, P.maxhp, 8), P.poison ? [.5,1,.3] : P.hp < P.maxhp*.35 ? [1,.3*(.6+.4*Math.sin(t*8)),.25] : [1,.35,.3]);
  c = hudText(c, 1, ` ${Math.max(0,P.hp)}/${P.maxhp}`.padEnd(7), [.8,.85,.75]);
  hudZones.hp.push(c); hudZones.mp = [c];
  c = hudText(c, 1, 'MP', [.6,.75,.6]);
  c = hudText(c, 1, bar(P.mp, P.maxmp, 8), [.4,.7,1]);
  c = hudText(c, 1, ` ${P.mp}/${P.maxmp}`.padEnd(7), [.8,.85,.75]);
  hudZones.mp.push(c); hudZones.gold = [c, c + `$${state.gold}`.length];
  c = hudText(c, 1, `$${state.gold} `, [1,.85,.3]);
  hudZones.ac = [c, c + 5];
  c = hudText(c, 1, `AC${playerAC()} `, [.75,.8,.9]);
  if (state.belief) hudText(c, 1, '✦', [1,.9,.5 + .3 * Math.sin(t * 3)]);
  { const sl = `[M] ${Snd.label()}`; sndBtn = [VW - 1 - sl.length, VW - 1];
    const ov = hoverAny && hoverAny[1] === VH + 1 && hoverAny[0] >= sndBtn[0] && hoverAny[0] < sndBtn[1];
    hudText(sndBtn[0], 1, sl, ov ? [.7,.95,.75] : [.4,.55,.45]); }
  c = 1; spellBtns = [];
  let hv = hoverAny && hoverAny[1] === VH + 2 ? hoverAny[0] : -1;
  for (const k of Object.keys(SPELLS)) {
    const sp = SPELLS[k], sel = state.targeting === k, kn = knows(k), ok = kn && P.mp >= cost(k);
    const label = kn ? `${sel?'>':'['}${k}${sel?'<':']'} ${sp.name}` : `[${k}] ···`;
    const over = hv >= c && hv < c + label.length;
    const m = !kn ? .25 : sel ? .75 + .35*Math.sin(t*10) : over ? 1.25 : ok ? .8 : .3;
    spellBtns.push({k, row:2, c0:c, c1:c + label.length});
    c = hudText(c, 2, label + '  ', kn ? sp.col.map(v => v*m) : [.3,.35,.32]);
  }
  // potions and pack get a row of their own
  c = 1; hv = hoverAny && hoverAny[1] === VH + 3 ? hoverAny[0] : -1;
  for (const [k, key, glyph, name, col] of [['potion', '5', '♥', 'healing', [1,.35,.4]], ['mana', '6', '♦', 'mana', [.4,.6,1]]]) {
    const n = state.inv[k] || 0, label = `[${key}] ${glyph} ${name} ×${n}`, over = hv >= c && hv < c + label.length, m = over ? 1.25 : n ? .85 : .3;
    spellBtns.push({k, row:3, c0:c, c1:c + label.length});
    c = hudText(c, 3, label + '   ', col.map(v => v * m));
  }
  { const label = '[I] pack', over = hv >= c && hv < c + label.length;
    spellBtns.push({k:'pack', row:3, c0:c, c1:c + label.length});
    c = hudText(c, 3, label + '   ', over || packOpen ? [.85,.95,.8] : [.5,.62,.52]); }
  { const st = [];
    if (P.poison) st.push(['poisoned', [.5,1,.3]]); if (P.webbed) st.push(['webbed', [.85,.85,.9]]); if (P.burning) st.push(['burning', [1,.55,.2]]);
    for (const [s, col] of st) c = hudText(c, 3, s + ' ', col.map(v => v * (.75 + .25 * Math.sin(t * 6)))); }
  if (hover && !dlg) {
    const d = describe(hover[0], hover[1]);
    if (d) { const str = ` ${d.slice(0, 30)} `, x0 = VW - 2 - str.length;
      ctx.fillStyle = '#000'; ctx.fillRect(x0*TW, VH*TH, str.length*TW, TH);
      hudText(x0, 0, str, [.75,.95,.75]); }
  }
  const m1 = msgs[msgs.length - 2], m2 = msgs[msgs.length - 1];
  if (m1) hudText(2, 4, m1.text.slice(0, VW - 4), m1.col.map(v => v*.45));
  if (m2) hudText(2, 5, m2.text.slice(0, VW - 4), m2.col);
}

// ---------- the pack: what you carry, what you wear, what you can drink ----------
let packOpen = false, packRows = [];
function questLine(){
  const q = questFor(state.floor), st = state.quest;
  if (!q || !st.stage) return 'none yet. Ask the old man.';
  if (st.stage === 3) return 'done. He was very pleased.';
  return q.short() + (questDone() ? ' · done, tell him!' : '');
}
function drawPack(t){
  if (!packOpen) return;
  const w = 52, Wp = weaponStats(), P = player, rows = [];
  const add = (a, b = '', col = [.82,.86,.8], act = null) => wrap(b, w - 14).forEach((ln, k) => rows.push({a:k ? '' : a, b:ln, col, act}));
  add('Weapon', capF(Wp.name) + `  ${Wp.lo}-${Wp.hi} dmg, +${playerHit()} to hit`, [.95,.9,.75]);
  add('', Wp.note, [.55,.65,.58]);
  for (const s of SLOTS) { const g = state.gear[s]; add(capF(s), g ? `${capF(g.name)}  (+${g.ac} AC)` : '—', g ? [.82,.86,.8] : [.4,.45,.42]); }
  add('Armour', `AC ${playerAC()}  (what a foe's d20 roll must beat)`, [.75,.8,.95]);
  add('');
  add('[a]', `♥ Healing ×${state.inv.potion || 0}   +${POTION_HEAL} HP, cures poison`, state.inv.potion ? [1,.55,.6] : [.4,.35,.36], 'potion');
  add('[b]', `♦ Mana ×${state.inv.mana || 0}      +${MANA_GAIN} MP`, state.inv.mana ? [.55,.7,1] : [.35,.38,.45], 'mana');
  add('');
  const sp = Object.values(SPELLS).filter(s => state.spells[s.id]).map(s => s.name);
  add('Spells', sp.length ? sp.join(', ') : 'none yet', sp.length ? [.7,.85,1] : [.4,.45,.42]);
  const keys = Object.keys(state.keys).filter(k => state.keys[k] > 0).map(k => k === 'flower' ? 'a pressed flower' : (state.keys[k] > 1 ? state.keys[k] + ' ' : '') + ITEMS[k].name + (state.keys[k] > 1 ? 's' : ''));
  if (state.mem.spoon) keys.push('a wooden spoon');
  add('Carrying', keys.length ? keys.join(', ') : 'nothing else', [.82,.86,.8]);
  add('Favour', questLine(), [.85,.8,1]);
  const h = rows.length + 4, px = Math.floor((VW - w) / 2), py = Math.max(1, Math.floor((VH - h) / 2));
  const fc = [.45,.6,.5];
  ctx.fillStyle = 'rgba(2,3,3,.95)'; ctx.fillRect(px * TW + TW * .5, py * TH + TH * .5, (w - 1) * TW, (h - 1) * TH);
  scrText(px, py, '╔' + '═'.repeat(w - 2) + '╗', fc);
  for (let r = py + 1; r < py + h - 1; r++) { scrText(px, r, '║', fc); scrText(px + w - 1, r, '║', fc); }
  scrText(px, py + h - 1, '╚' + '═'.repeat(w - 2) + '╝', fc);
  ctx.fillStyle = 'rgb(2,3,3)'; ctx.fillRect((px + 2) * TW, py * TH, 8 * TW, TH);
  scrText(px + 2, py, ' PACK ', [.9,.95,.8]);
  packRows = [];
  rows.forEach((r, k) => {
    const y = py + 2 + k, over = r.act && hoverAny && hoverAny[1] === y && hoverAny[0] > px && hoverAny[0] < px + w - 1;
    if (r.act) packRows.push({y, act:r.act});
    scrText(px + 2, y, r.a, over ? [1,1,.8] : [.5,.62,.52]);
    scrText(px + 12, y, r.b.slice(0, w - 14), over ? r.col.map(v => Math.min(1, v * 1.3)) : r.col);
  });
  const foot = ' a/b or click: drink · I / Esc: close ';
  ctx.fillStyle = 'rgb(2,3,3)'; ctx.fillRect((px + w - 2 - foot.length) * TW, (py + h - 1) * TH, foot.length * TW, TH);
  scrText(px + w - 2 - foot.length, py + h - 1, foot, fc);
}

function drawScene(t, tn, dt){
  ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
  ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, SW, VH * TH); ctx.clip(); ctx.scale(ZOOM, ZOOM);
  drawTiles(t, tn);
  drawDanger(t);
  drawItems(t);
  drawTargeting(t);
  drawCursor(t);
  drawEnts(t, tn);
  drawProjs();
  drawWeather(t, dt);
  drawBolts(tn);
  drawSlashes(tn);
  drawPillars(tn);
  drawParticles(dt);
  ctx.restore();
  { const p = (tn - screenFlashT) / 130; if (p < 1) { ctx.fillStyle = `rgba(255,245,215,${.2 * (1 - p)})`; ctx.fillRect(0, 0, SW, VH * TH); } }
  drawBossBar(t);
  Dialog.draw(t);
  drawHUD(t);
  drawPack(t);
  drawInspect(t);
  drawSplash(t);
}

// ---------- startup splash ----------
let splash = true, splashT = 1, splashOff = 0;
function drawSplash(t){
  if (!splash) { if (!splashT) return; if (!splashOff) splashOff = now(); splashT = Math.max(0, 1 - (now() - splashOff) / 350); if (!splashT) return; }
  const a = splashT, cx = VW / 2;
  ctx.globalAlpha = a * .82; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH); ctx.globalAlpha = a;
  const bw = 50, bx = Math.floor(cx - bw / 2), by = 7, bh = 18, fc = [.3,.5,.38];
  ctx.fillStyle = 'rgba(2,4,3,.95)'; ctx.fillRect(bx * TW + TW * .5, by * TH + TH * .5, (bw - 1) * TW, (bh - 1) * TH);
  scrText(bx, by, '╔' + '═'.repeat(bw - 2) + '╗', fc);
  for (let r = by + 1; r < by + bh - 1; r++) { scrText(bx, r, '║', fc); scrText(bx + bw - 1, r, '║', fc); }
  scrText(bx, by + bh - 1, '╚' + '═'.repeat(bw - 2) + '╝', fc);
  // title, in big glowing letters that breathe
  ctx.save(); ctx.font = 'bold 46px "DejaVu Sans Mono", Menlo, Consolas, monospace';
  const title = 'AFTERGLOW', g = .85 + .15 * Math.sin(t * 2.2);
  for (let k = 0; k < title.length; k++) {
    const x = SW / 2 + (k - (title.length - 1) / 2) * 34, y = (by + 2.6) * TH + Math.sin(t * 2 + k * .7) * 2.5;
    ctx.fillStyle = css(1 * g, .78 * g, .45 * g); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2;
    ctx.strokeText(title[k], x, y); ctx.fillText(title[k], x, y);
  }
  ctx.restore();
  const line = (row, key, what, kc = [.95,.85,.55]) => { scrText(bx + 4, row, key, kc); scrText(bx + 19, row, what, [.78,.86,.8]); };
  const tag = 'somewhere below, a stone that never dies';
  scrText(Math.floor(cx - tag.length / 2), by + 4, tag, [.45,.6,.5]);
  line(by + 6,  'left-click',  'move · attack · talk');
  line(by + 7,  'right-click', 'inspect anything');
  line(by + 8,  'WASD',        'move (Q E Z C diagonals)');
  line(by + 9,  'numpad · vi', 'move (hjkl yubn)');
  line(by + 11, '1 2 3 4',     'spells, once you find them', [.7,.85,1]);
  line(by + 12, '5  6',        'healing · mana potion', [1,.6,.65]);
  line(by + 13, 'I',           'pack (gear, potions, favours)');
  line(by + 14, 'space',       'wait  ·  M sound');
  const pr = '~ press any key or click ~';
  if (Math.sin(t * 3.5) > -.3) scrText(Math.floor(cx - pr.length / 2), by + bh - 2, pr, [.6,.95,.7]);
  ctx.globalAlpha = 1;
}

// =====================================================================
//  Input
// =====================================================================
const DIRS = {ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
  k:[0,-1], j:[0,1], h:[-1,0], l:[1,0], y:[-1,-1], u:[1,-1], b:[-1,1], n:[1,1],
  w:[0,-1], s:[0,1], a:[-1,0], d:[1,0], q:[-1,-1], e:[1,-1], z:[-1,1], c:[1,1]};
const NUMPAD = {Numpad8:[0,-1], Numpad2:[0,1], Numpad4:[-1,0], Numpad6:[1,0], Numpad7:[-1,-1], Numpad9:[1,-1], Numpad1:[-1,1], Numpad3:[1,1]};

addEventListener('keydown', ev => {
  Snd.start();
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (splash) { if (!['Shift','Control','Alt','Meta'].includes(ev.key)) { splash = false; Snd.page(); } ev.preventDefault(); return; }
  if (dlg) { Dialog.key(ev); return; }
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (k === 'm') { Snd.cycle(); return; }
  if (packOpen) {
    ev.preventDefault();
    if (k === 'a') quaff('potion'); else if (k === 'b') quaff('mana');
    else if (k === 'i' || k === 'Escape' || k === ' ' || k === 'Enter') { packOpen = false; Snd.cancel(); }
    return;
  }
  if (inspect && inspect.confirm) {
    ev.preventDefault();
    if (k === 'y' || k === 'Enter') { inspect = null; Snd.cancel(); init(); }
    else { inspect = null; Snd.cancel(); }
    return;
  }
  if (inspect) { inspect = null; if (ev.key === 'Escape') return; }
  if (k === 'r') { if (state.dead) retryFloor(); else if (state.won) init(); else askRestart(); return; }
  if (k === 'i' && !state.dead && !state.won) { packOpen = true; state.targeting = null; state.travel = null; Snd.page(); return; }
  const dir = NUMPAD[ev.code] || DIRS[k];
  if (state.travel) { state.travel = null; if (dir || k === ' ') ev.preventDefault(); return; }
  if (dir || k === ' ') ev.preventDefault();
  if (state.dead || state.won || projs.length) return;
  if (k === 'Escape') { if (state.targeting) { state.targeting = null; Snd.cancel(); log('Cancelled.', [.5,.6,.5]); } return; }
  if (ev.code.startsWith('Digit') && SPELLS[k]) { beginCast(k); return; }
  if (ev.code === 'Digit5') { quaff('potion'); return; }
  if (ev.code === 'Digit6') { quaff('mana'); return; }
  if (state.targeting) { if (dir) castAt(player.x + dir[0]*40, player.y + dir[1]*40); return; }
  if (ev.code === 'Numpad5' || k === ' ' || k === '.') { endTurn(); return; }
  if (dir) playerMove(dir);
});

function curveJS(u, v){ let x = u*2-1, y = v*2-1; const ox = Math.abs(y)/5.5, oy = Math.abs(x)/4.5; x += x*ox*ox; y += y*oy*oy; return [x*.5+.5, y*.5+.5]; }
out.addEventListener('mousemove', ev => {
  const rc = out.getBoundingClientRect();
  let [u, v] = [(ev.clientX - rc.left) / rc.width, (ev.clientY - rc.top) / rc.height];
  if (gl) [u, v] = curveJS(u, v);
  const gx = u * SW / TW, gy = v * SH / TH;
  hoverAny = gx >= 0 && gx < VW && gy >= 0 && gy < VH + HUDROWS ? [Math.floor(gx), Math.floor(gy)] : null;
  const tx = Math.floor(gx / ZOOM + CXr), ty = Math.floor(gy / ZOOM + CYr);
  hover = gy >= 0 && gy < VH && inb(tx, ty) ? [tx, ty] : null;
  if (dlg && hoverAny) Dialog.hover(hoverAny[0], hoverAny[1]);
});
out.addEventListener('mouseleave', () => { hover = null; hoverAny = null; });
out.addEventListener('mousedown', ev => {
  ev.preventDefault();
  Snd.start();
  if (splash) { splash = false; Snd.page(); return; }
  if (dlg) { if (ev.button === 0 && hoverAny) Dialog.click(hoverAny[0], hoverAny[1]); return; }
  if (packOpen) {
    const r = ev.button === 0 && hoverAny && packRows.find(r => r.y === hoverAny[1]);
    if (r) quaff(r.act); else { packOpen = false; Snd.cancel(); }
    return;
  }
  if (ev.button === 2) {
    if (state.targeting) { Snd.cancel(); log('Cancelled.', [.5,.6,.5]); state.targeting = null; return; }
    state.travel = null;
    if (hover) openInspect(buildInspect(hover[0], hover[1]));
    else if (hoverAny && hoverAny[1] >= VH) openInspect(buildHudInspect(hoverAny[0], hoverAny[1]));
    else inspect = null;
    return;
  }
  if (inspect) { inspect = null; if (ev.button === 0) return; }
  if (ev.button !== 0 || !hoverAny) return;
  const [tx, ty] = hoverAny;
  if (ty === VH + 1 && sndBtn && tx >= sndBtn[0] && tx < sndBtn[1]) { Snd.cycle(); return; }
  if (ty === VH + 2 || ty === VH + 3) {
    const b = spellBtns.find(b => VH + b.row === ty && tx >= b.c0 && tx < b.c1);
    if (b && !state.dead && !state.won) {
      if (b.k === 'potion' || b.k === 'mana') quaff(b.k);
      else if (b.k === 'pack') { packOpen = true; Snd.page(); }
      else if (state.targeting === b.k) { state.targeting = null; Snd.cancel(); log('Cancelled.', [.5,.6,.5]); } else beginCast(b.k);
    }
    return;
  }
  if (!hover || projs.length || state.dead || state.won) return;
  if (state.travel) { state.travel = null; return; }
  if (state.targeting) castAt(hover[0], hover[1]);
  else mouseGo(hover[0], hover[1]);
});
out.addEventListener('contextmenu', ev => ev.preventDefault());

// =====================================================================
//  Main loop
// =====================================================================
let last = now();
function frame(){
  const tn = now(), dt = Math.min(.05, (tn - last) / 1000); last = tn;
  const t = tn / 1000;
  shakeAmp *= Math.pow(.004, dt);
  updateProjs(tn);
  if (state.travel && !projs.length && tn >= state.travel.next && !dlg && !packOpen) travelStep(tn);
  Dialog.update(dt);
  updateWeather(t, dt);
  // camera follows the @ smoothly (and lifts when the old man is talking)
  const tx = clamp(player.vx + .5 - WVW / 2, 0, MW - WVW), ty = clamp(player.vy + .5 - WVH / 2 + (dlg && dlg.kind === 'man' ? 5 : 0), 0, MH - WVH);
  CX += (tx - CX) * Math.min(1, dt * 5); CY += (ty - CY) * Math.min(1, dt * 5);
  CXr = Math.round(CX * TW * ZOOM) / (TW * ZOOM); CYr = Math.round(CY * TH * ZOOM) / (TH * ZOOM);
  // sound of the place
  const z = zone[idx(player.x, player.y)], L = localW(z);
  Snd.ambient({rain:ZONES[z].outdoor ? L.rain : 0, wind:ZONES[z].outdoor ? L.wind : 0,
               lava:z === Z.DEEPS ? 1 : 0, swamp:z === Z.MIRE ? 1 : 0, indoor:z === Z.TOMB ? .6 : 0, gust:gust(t, player.x)});
  Snd.tone2(ZONES[z].music * (L.snow > .4 ? .75 : 1), dlg ? .4 : 1);
  computeLight(t, tn);
  drawScene(t, tn, dt);
  present(t, dt);
  requestAnimationFrame(frame);
}
if (!loadGame()) init(); resize(); requestAnimationFrame(frame);
// for testing in the console: warp(n) jumps to floor n with that floor's spells and a fitting kit
function warp(n){
  const ids = ['fire', 'lightning', 'frost', 'holy'];
  for (let k = 0; k < Math.min(4, n - 1); k++) state.spells[ids[k]] = true;
  state.weapon = {type:'sword', tier:n}; for (let k = 1; k < n; k++) state.gear[GIFTS[k].slot] = GIFTS[k];
  player.maxhp = 24 + 6 * (n - 1); player.hp = player.maxhp; state.inv.potion = 3; state.inv.mana = 2;
  enterLevel(n);
}
