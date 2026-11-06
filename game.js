'use strict';
// =====================================================================
//  State
// =====================================================================
const SPELLS = {
  '1': {name:'Lightning', cost:5, range:12, col:[.6,.8,1.0]},
  '2': {name:'Fire',      cost:4, range:9,  col:[1.0,.5,.15], stopAtEnt:1},
  '3': {name:'Frost',     cost:4, range:8,  col:[.55,.9,1.0]},
};
const cost = k => Math.max(1, SPELLS[k].cost - (state.costDown || 0));

let fire, elecT, frostT, seen, vis, lumS, lr, lg, lb, snowAcc;
let ents, player, npc, items, parts, wparts, bolts, projs, flashes, lights, msgs, state, dying, flies;
let shakeAmp = 0, phosphor = 0;
const PHOS = [ {name:'COLOR', tint:[1,1,1], mono:0} ];
let hover = null, hoverAny = null;
const W = {rain:0, snow:0, wind:0, dir:1};    // smoothed weather intensities

function mkEnt(type, x, y){
  const d = MONS[type];
  const e = {type, ch:d.ch, name:d.name, col:d.col.slice(), hp:d.hp, maxhp:d.hp, dmg:d.dmg,
             x, y, vx:x, vy:y, anim:null, act:null, knock:null, hitT:-1e9, burning:0, frozen:0, dead:false, seen:null,
             face:rnd() < .5 ? 1 : -1, seed:rnd() * 100, sz:1, tf:{ox:0, oy:0, rot:0, sx:1, sy:1}};
  // individual variety
  const r = rnd();
  if (r < .2) { e.name = 'big ' + e.name; e.hp = e.maxhp = Math.ceil(d.hp * 1.5); e.dmg = d.dmg + 1; e.sz = 1.16; }
  else if (r < .35) { e.name = 'scrawny ' + e.name; e.hp = e.maxhp = Math.max(1, Math.floor(d.hp * .7)); e.sz = .88; }
  const v = .88 + rnd() * .24; e.col = e.col.map((c, i) => clamp(c * (i === 1 ? v : 2 - v), 0, 1));
  return e;
}

function init(){
  const W0 = buildWorld();
  const N = MW * MH;
  fire = new Int8Array(N); elecT = new Float64Array(N).fill(-1e9); frostT = new Float64Array(N).fill(-1e9);
  seen = new Uint8Array(N); vis = new Uint8Array(N); lumS = new Float32Array(N);
  lr = new Float32Array(N); lg = new Float32Array(N); lb = new Float32Array(N);
  snowAcc = new Float32Array(N);
  for (let i = 0; i < N; i++) if (zone[i] === Z.PASS) snowAcc[i] = .85;
  parts = []; wparts = []; bolts = []; projs = []; flashes = []; msgs = []; dying = []; flies = [];
  state = {turn:0, targeting:null, dead:false, won:false, gold:0, travel:null, zone:-1, costDown:0, armor:0, belief:false,
           weather:{type:'clear', until:30}, thunderT:-1e9,
           mem:{name:'friend', ch:0, lastTalk:-99, met:false, visited:{}, kills:0, idleI:0, echoUsed:{}, nextEcho:0, called:false}};
  dlg = null;
  player = mkEnt('rat', ...W0.start);
  Object.assign(player, {ch:'@', name:'you', col:[1,1,.85], hp:24, maxhp:24, mp:20, maxmp:20, dmg:0, sz:1, isPlayer:true});
  npc = mkEnt('rat', ...W0.npc);
  Object.assign(npc, {ch:'@', name:'old man', col:[.86,.8,1], hp:99, maxhp:99, sz:1, npc:true, face:1});
  ents = [player, npc];
  for (const [t, x, y] of W0.spawns) ents.push(mkEnt(t, x, y));
  items = W0.items.map(o => ({...o}));
  altars = {}; for (const a of W0.altars || []) altars[idx(a.x, a.y)] = a.deity;
  CX = clamp(player.x + .5 - WVW / 2, 0, MW - WVW); CY = clamp(player.y + .5 - WVH / 2, 0, MH - WVH);

  log('AFTERGLOW // somewhere, a kettle is on', [.6,1,.7]);
  log('Move: keys/click. Click @ to wait. Right-click cancels', [.55,.7,.55]);
  log('Cast: 1/2/3 or click a spell, then aim with keys/mouse', [.55,.7,.55]);
  rebuildLights(); computeFOV(); checkZone();
}

function log(text, col = [.7,.85,.7]){ msgs.push({text, col}); if (msgs.length > 40) msgs.shift(); }
function healPlayer(n, quiet){
  const P = player, before = P.hp; P.hp = Math.min(P.maxhp, P.hp + n);
  if (P.hp > before) part(P.x, P.y - .3, 0, -1.2, .9, '+' + (P.hp - before), [.5,1,.6], 1);
  if (!quiet && P.hp > before) Snd.potion();
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
  else if (z === Z.HOUSE && next !== 'clear') log(next === 'storm' ? 'Thunder grumbles over the roof.' : 'You hear the weather change outside.', [.6,.65,.7]);
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
      else if (t === 'HEARTH') addLight(x, y, 9, [1,.58,.28], 1.6, 1);
      else if (t === 'LAVA' && hash(i) < .4) addLight(x, y, 4, [1,.38,.1], .7, 2);
      else if (t === 'VENT') addLight(x, y, 3, [1,.5,.2], .6, 2);
      else if (t === 'ALTAR') { const D = altarDeity(i); addLight(x, y, 6, D ? D.col : [1,.8,.5], 1.3, 1); }
      if (fire[i] > 0) addLight(x, y, 4, [1,.45,.12], .9, 2);
    }
  for (const e of ents) {
    if (e.dead || cheb(e, P) > R) continue;
    if (e.burning > 0) addLight(e.x, e.y, 3, [1,.5,.15], .7, 2);
    const g = MONS[e.type]?.glow; if (g && !e.npc && !e.isPlayer) addLight(e.x, e.y, 3.5, g, .8, 1);
  }
  if (!P.dead) state.belief ? addLight(P.x, P.y, 7.5, [1,.85,.55], 1.05, 0) : addLight(P.x, P.y, 6, [.5,.58,.5], .85, 0);
  lumS.fill(0);
  for (const L of lights) { const m = Math.max(...L.col) * L.int; for (let j = 0; j < L.c.length; j += 2) lumS[L.c[j]] += L.c[j+1] * m; }
  for (let y = Math.max(0, P.y - R); y <= Math.min(MH - 1, P.y + R); y++)
    for (let x = Math.max(0, P.x - R); x <= Math.min(MW - 1, P.x + R); x++) { const i = idx(x, y); lumS[i] += dayLight(zone[i]); }
}
function flash(x, y, r, col, int, dur){ flashes.push({col, int, dur, t0:now(), c:computeContribs(x, y, r)}); }

function computeFOV(){
  vis.fill(0);
  const P = player, R = 31;
  for (let y = Math.max(0, P.y - R); y <= Math.min(MH - 1, P.y + R); y++)
    for (let x = Math.max(0, P.x - R); x <= Math.min(MW - 1, P.x + R); x++) {
      if (los(P.x, P.y, x, y)) {
        const i = idx(x, y); vis[i] = 1;
        if (lumS[i] > .07 || Math.max(Math.abs(x-P.x), Math.abs(y-P.y)) <= 4) seen[i] = 1;
      }
    }
}

// daylight under the open sky (dimmer in rain, gloomier in the mire)
function dayLight(z){
  if (!ZONES[z].outdoor) return 0;
  const base = z === Z.MIRE ? .3 : z === Z.PASS ? .5 : .55;
  return base * (1 - .35 * W.rain - .15 * W.snow);
}
const DAYCOL = {[Z.MEADOW]:[.92,.95,1], [Z.MIRE]:[.75,.9,.72], [Z.PASS]:[.85,.9,1.05]};
const AMB = .03;
function computeLight(t, tn){
  lr.fill(AMB); lg.fill(AMB); lb.fill(AMB);
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
const entAt = (x, y) => ents.find(e => !e.dead && e.x === x && e.y === y);
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

function part(x, y, vx, vy, life, ch, col, g = 0, delay = 0){ if (parts.length < 1400) parts.push({x, y, vx, vy, life, max:life, ch, col, g, d:delay}); }
function ember(x, y, col = [1,.55,.15]){ part(x + (rnd()-.5)*.6, y - .2, (rnd()-.5)*.4, -1 - rnd()*1.2, .5 + rnd()*.6, rnd()<.5?'.':'\'', col, -.3); }
function steam(x, y){ Snd.sizzle(); for (let k = 0; k < 6; k++) part(x + (rnd()-.5)*.8, y, (rnd()-.5)*.6, -.6 - rnd()*.8, .8 + rnd()*.6, rnd()<.5?'°':'.', [.8,.85,.9], -.2); }
function frostBits(x, y){ for (let k = 0; k < 4; k++) part(x + (rnd()-.5)*.8, y + (rnd()-.5)*.8, (rnd()-.5)*.8, (rnd()-.5)*.8, .6 + rnd()*.5, rnd()<.5?'*':'·', [.7,.95,1]); }
function sparks(x, y, n = 4){ for (let k = 0; k < n; k++) { const a = rnd()*PI*2, s = 2 + rnd()*4; part(x, y, Math.cos(a)*s, Math.sin(a)*s, .25 + rnd()*.3, rnd()<.5?'+':'·', [.85,.92,1], 4); } }
function shatter(e){
  const chars = [e.ch, '.', ',', '\'', '`', ':'];
  for (let k = 0; k < 18; k++) { const a = rnd()*PI*2, s = 1 + rnd()*4;
    part(e.x, e.y, Math.cos(a)*s, Math.sin(a)*s - 1.5, .6 + rnd()*.7, chars[ri(0, chars.length-1)], e.col, 7); }
}
function shake(a){ shakeAmp = Math.max(shakeAmp, a); }

function damage(e, n, src, delay = 0, from = null){
  if (e.dead) return;
  if (e.npc) {
    if (src !== 'melee' && now() - (state.npcSpark || 0) > 3000) { state.npcSpark = now();
      log('The old man brushes a spark off his sleeve. "Careful, now."', [.8,.75,1]); }
    return;
  }
  const D = MONS[e.type] || {};
  if (!e.isPlayer && D.immune?.[src]) { part(e.x, e.y - .3, 0, -1, .9, 'immune', [.7,.7,.7], .5, delay / 1000); return; }
  if (!e.isPlayer && D.weak?.[src]) n *= D.weak[src];
  if (e.isPlayer && src === 'melee') n = Math.max(1, n - (state.armor || 0));
  e.hp -= n;
  const at = now() + delay;
  e.hitT = at;
  if (from) e.knock = {dx:Math.sign(e.x - from.x), dy:Math.sign(e.y - from.y), t0:at};
  part(e.x, e.y - .3, (rnd()-.5)*.5, -1.6, .8, String(n), e.isPlayer ? [1,.3,.3] : [1,1,.8], 1.5, delay / 1000);
  if (delay) setTimeout(() => Snd.hit(!!e.isPlayer), delay); else Snd.hit(!!e.isPlayer);
  if (e.isPlayer) { setTimeout(() => shake(4), delay); if (state.travel && !state.travel.target) state.travel = null; }
  if (e.hp <= 0) kill(e, src, delay);
}
function kill(e, src, delay = 0){
  e.dead = true;
  dying.push({e, at:now() + delay});
  setTimeout(() => e.isPlayer ? Snd.gameover() : Snd.death(), delay);
  if (e.isPlayer) { state.dead = true; log('You fall. Press R to try again. (He would tell you to.)', [1,.35,.3]); return; }
  state.mem.kills++;
  const verb = src === 'shock' ? 'is fried' : src === 'burn' ? 'burns to a crisp' : src === 'melee' && e.frozen ? 'shatters into ice shards' : 'dies';
  log(`The ${e.name} ${verb}.`, [.9,.9,.7]);
}

// =====================================================================
//  Turn logic
// =====================================================================
function attack(a, d){
  const D = a.isPlayer ? {atk:'whip'} : MONS[a.type];
  const style = ATK[D.atk] ? D.atk : 'stab', A = ATK[style];
  const dx = Math.sign(d.x - a.x), dy = Math.sign(d.y - a.y);
  a.act = {style, t0:now(), dx, dy, s:dx || a.face || 1};
  if (dx) a.face = dx;
  const delay = A.dur * A.hit;
  if (style === 'whip') Snd.whip(); else Snd.swing();
  if (style === 'tongue') Snd.tongue();
  if (style === 'slam' || style === 'punch') setTimeout(() => { shake(5); Snd.slam();
    for (let k = 0; k < 6; k++) part(d.x + (rnd() - .5), d.y + .3, (rnd() - .5) * 3, -rnd() * 2, .5, '.', [.7,.6,.5], 5); }, delay);
  if (a.isPlayer) {
    const dmg = ri(2, 4) * (d.frozen ? 2 : 1);
    log(d.frozen ? `You whip the frozen ${d.name}. It cracks!` : pick([`Your tail whips the ${d.name}.`, `You lash the ${d.name}.`, `You spin and strike the ${d.name}.`]));
    damage(d, dmg, 'melee', delay, a);
  } else {
    const dmg = a.dmg + ri(0, 1);
    log(`The ${a.name} ${{bite:'bites', stab:'stabs', engulf:'engulfs', cleave:'cleaves', tongue:'lashes its tongue at', latch:'latches onto',
      pounce:'pounces on', clap:'claps its great hands on', swoop:'swoops through', spear:'jabs', slam:'slams', punch:'punches', dive:'dives at',
      whip:'tail-whips'}[style] || 'hits'} you.`, [1,.6,.5]);
    damage(d, dmg, 'melee', delay, a);
    if (D.drain && !a.dead) { a.hp = Math.min(a.maxhp, a.hp + dmg); }
  }
}

const blocksFor = (m, i) => { const t = map[i], d = TD[t]; return d.block && t !== 'DOOR' && !(d.lava && MONS[m.type]?.lavawalk); };
function tryStep(m, nx, ny, style){
  if (!inb(nx, ny)) return false;
  const i = idx(nx, ny);
  if (map[i] === 'DOOR') { map[i] = 'OPEN'; if (vis[i]) Snd.door(); return true; }
  if (blocksFor(m, i) || entAt(nx, ny)) return false;
  if (m.npc && zone[i] !== Z.HOUSE) return false;
  moveEnt(m, nx, ny, style); return true;
}
function stepToward(m, tx, ty){
  const cur = Math.max(Math.abs(tx - m.x), Math.abs(ty - m.y));
  let best = null, bs = 1e9;
  for (const [dx, dy] of DIR8) {
    const nx = m.x + dx, ny = m.y + dy;
    if (!inb(nx, ny)) continue;
    const i = idx(nx, ny);
    if (blocksFor(m, i) || entAt(nx, ny)) continue;
    const s = Math.max(Math.abs(tx - nx), Math.abs(ty - ny)) + (fire[i] && !MONS[m.type]?.immune?.burn ? 4 : 0) + rnd()*.2;
    if (s < bs) { bs = s; best = [nx, ny]; }
  }
  if (best && bs <= cur + .2) return tryStep(m, best[0], best[1]);
  return false;
}
function monsterAct(m){
  if (m.npc) { if (rnd() < .04 && cheb(m, player) > 1) { const [dx, dy] = pick(DIR8); tryStep(m, m.x + dx, m.y + dy); } return; }
  const D = MONS[m.type];
  if (m.frozen > 0) { m.frozen--; if (!m.frozen && vis[idx(m.x, m.y)]) log(`The ${m.name} thaws out.`); return; }
  if (D.slow && state.turn % 2) return;
  if (D.regen && m.hp < m.maxhp && !m.burning && state.turn - (m.burnT || -99) > 3) {
    m.hp++; if (canSee(m) && rnd() < .3) part(m.x, m.y - .3, 0, -.8, .7, '+', [.5,1,.5], .5);
  }
  for (let n = D.fast ? 2 : 1; n > 0 && !m.dead && !player.dead && !m.frozen; n--) actOnce(m, D);
}
function actOnce(m, D){
  const P = player, d = cheb(m, P);
  if (d <= 9 && los(m.x, m.y, P.x, P.y)) {
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
    if (m.x === m.seen[0] && m.y === m.seen[1]) m.seen = null;
  } else if (rnd() < .3) { const [dx, dy] = pick(DIR8); tryStep(m, m.x + dx, m.y + dy); }
}

function ignite(i){ const d = TD[map[i]]; if (d.burn && !fire[i]) { fire[i] = d.fuel + ri(0, 1); snowAcc[i] = 0; } }
function burnItemsAt(x, y){
  items = items.filter(it => { if (ITEMS[it.kind].burn && it.x === x && it.y === y) { if (vis[idx(x,y)]) log('A scroll curls up and burns away.', [1,.6,.3]); return false; } return true; });
}
function burnOut(i){
  const x = i % MW, y = (i / MW) | 0;
  if (map[i] === 'CHEST') { items.push({x, y, kind:'gold'}); if (vis[i]) log('The chest burns away, spilling gold.', [1,.8,.3]); }
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
    log('A voice from the house: "Door\'s open! Wipe your feet. Or don\'t, I\'m not your mother."', [.85,.8,1]);
  }
}

function endTurn(){
  state.turn++;
  for (const m of ents) if (!m.isPlayer && !m.dead) monsterAct(m);
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
  }
  tickFire();
  { let n = 0; for (let i = 0; i < fire.length; i++) if (fire[i] > 0 && vis[i]) n++; Snd.crackle(n); }
  tickWeather();
  stormStrike();
  if (!player.dead) player.mp = Math.min(player.maxmp, player.mp + 1);
  ents = ents.filter(e => !e.dead || e.isPlayer);
  rebuildLights(); computeFOV();
  checkZone();
  if (!state.dead && !state.won) maybeEcho();
}

function playerMove([dx, dy]){
  const P = player, nx = P.x + dx, ny = P.y + dy;
  if (!inb(nx, ny)) return;
  if (dx) P.face = dx;
  const e = entAt(nx, ny);
  if (e && e.npc) { P.lunge = null; talkToOldMan(); return; }
  if (e) { attack(P, e); endTurn(); return; }
  const i = idx(nx, ny), key = map[i], d = TD[key];
  const nudge = () => { P.act = {style:'bite', t0:now(), dx:dx * .5, dy:dy * .5, s:dx || 1}; };
  if (key === 'SECRET') { openSecret(nx, ny, i); nudge(); endTurn(); return; }
  if (key === 'ALTAR' || key === 'ALTARSPENT') { nudge(); pray(i, nx, ny); endTurn(); return; }
  if (key === 'DOOR') { map[i] = 'OPEN'; nudge(); Snd.door(); log('You open the door.'); endTurn(); return; }
  if (key === 'CHEST') { map[i] = 'CHESTOPEN'; const g = ri(15, 30); state.gold += g; nudge(); Snd.coin(); log(`You open the chest: ${g} gold!`, [1,.85,.3]); endTurn(); return; }
  if (d.block) {
    nudge(); Snd.bump();
    const hint = HINT[key];
    if (hint) log(hint, [.6,.75,.65]);
    return;
  }
  const wasWater = TD[map[idx(P.x, P.y)]].water;
  moveEnt(P, nx, ny); Snd.step(key === 'BOG' ? 'WATER' : key === 'SNOW' || snowAcc[i] > .4 ? 'ICE' : key);
  if (d.water && !wasWater) log(d.bog ? 'You squelch into the bog. Lightning would love this.' : 'You wade into the water. Careful with lightning!', [.5,.75,1]);
  if (key === 'ICE' && map[idx(P.x - dx, P.y - dy)] !== 'ICE') log('The ice creaks under your feet.', [.7,.9,1]);
  items = items.filter(it => {
    if (it.x !== nx || it.y !== ny) return true;
    if (it.kind === 'gold')   { const g = ri(5, 15); state.gold += g; Snd.coin(); log(`You pick up ${g} gold.`, [1,.85,.3]); }
    if (it.kind === 'potion') { healPlayer(10, true); Snd.potion(); log('You drink a potion. You feel better.', [1,.5,.6]); }
    if (it.kind === 'scroll') { P.maxmp += 4; P.mp = P.maxmp; Snd.scroll(); log('You read a scroll of insight: max MP +4.', [.95,.9,.7]); }
    return false;
  });
  if (key === 'STAIRS') {
    state.won = true; Snd.win();
    log(state.belief ? 'You step through into the dark beyond, carrying a light of your own. Demo complete! (R)' :
        `You step through into the dark beyond with ${state.gold} gold. Demo complete! (R)`, [1,1,.6]);
  }
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
    if (d.opaque || (d.block && !d.water && !d.lava)) { hit = [x, y]; break; }
    cells.push([x, y]);
    if (sp.stopAtEnt && entAt(x, y)) break;
  }
  return {cells, hit};
}
function beginCast(k){
  const sp = SPELLS[k];
  if (player.mp < cost(k)) { Snd.error(); log(`Not enough mana for ${sp.name}.`, [.8,.5,.5]); return; }
  state.targeting = k; Snd.select(k);
  log(`${sp.name}: direction key or click a target. Esc cancels.`, sp.col);
}
function castAt(tx, ty){
  const k = state.targeting; state.targeting = null;
  if (tx === player.x && ty === player.y) return;
  const sp = SPELLS[k], tr = tracePath(sp, tx, ty);
  player.mp -= cost(k);
  const dx = Math.sign(tx - player.x); if (dx) player.face = dx;
  player.act = {style:'spear', t0:now(), dx:Math.sign(tx - player.x) * .4, dy:Math.sign(ty - player.y) * .4, s:dx || 1};
  if (k === '1') castLightning(tr); else if (k === '2') castFire(tr); else castFrost(tr);
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
  for (const e of ents) if (!e.dead && body.has(idx(e.x, e.y))) {
    damage(e, 14, 'shock'); sparks(e.x, e.y, 8);
    if (e.isPlayer) log('You are standing in it. Ouch.', [1,.4,.4]);
  }
}
function castLightning(tr){
  const P = player, tn = now();
  const pts = [[P.x, P.y], ...tr.cells]; if (tr.hit) pts.push(tr.hit);
  bolts.push({pts, t0:tn, dur:420});
  shake(9); Snd.zap();
  log('Lightning cracks from your fingers!', [.7,.85,1]);
  const seeds = [];
  tr.cells.forEach(([x, y], n) => {
    const e = entAt(x, y); if (e) damage(e, 4, 'shock');
    const i = idx(x, y); if (TD[map[i]].water) seeds.push(i);
    if (n % 2 === 0) flash(x, y, 3, [.6,.75,1], 2.2, 380);
    sparks(x, y, 2);
  });
  if (tr.hit) {
    const [hx, hy] = tr.hit, i = idx(hx, hy);
    if (map[i] === 'ICEWALL') { map[i] = 'FLOOR'; frostBits(hx, hy); sparks(hx, hy, 10); Snd.shatter(); log('The frozen wall shatters!', [.7,.9,1]); }
    else if (TD[map[i]].burn) ignite(i);
    sparks(hx, hy, 8);
  }
  if (seeds.length) electrify(seeds, tn);
  endTurn();
}
function launch(cells, msPer, ch, col, trail, onDone){
  if (!cells.length) { onDone(); return; }
  projs.push({cells, msPer, ch, col, trail, onDone, t0:now(), sx:player.x, sy:player.y, x:player.x, y:player.y});
}
function fireTile(x, y, center){
  if (!inb(x, y)) return;
  const i = idx(x, y), t = map[i];
  snowAcc[i] = 0;
  if (t === 'ICE') { map[i] = under[i] || 'WATER'; steam(x, y); }
  else if (t === 'ICEWALL') { map[i] = 'WATER'; steam(x, y); log('The ice wall melts into a puddle.', [.7,.85,1]); }
  else if (t === 'TORCHOUT') { map[i] = 'TORCH'; log('The torch flares back to life.', [1,.7,.3]); }
  else if (TD[t].water) steam(x, y);
  else if (TD[t].burn && zone[i] !== Z.HOUSE) ignite(i);
  burnItemsAt(x, y);
  const e = entAt(x, y);
  if (e && !e.isPlayer) {
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
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { fireTile(c[0] + dx, c[1] + dy, !dx && !dy); if (inb(c[0]+dx, c[1]+dy) && TD[map[idx(c[0]+dx, c[1]+dy)]].bog) bog++; }
    if (tr.hit) fireTile(tr.hit[0], tr.hit[1], false);
    flash(c[0], c[1], 6, [1,.5,.15], 2.4, 650);
    shake(5); Snd.boom();
    if (bog >= 3 && rnd() < .85) {   // swamp gas!
      log('Swamp gas ignites with a WHUMPF!', [1,.7,.3]);
      setTimeout(() => { Snd.boom(); shake(9); flash(c[0], c[1], 8, [1,.6,.2], 3, 800);
        for (let k = 0; k < 40; k++) { const a = rnd() * PI * 2, s = 2 + rnd() * 5; part(c[0], c[1], Math.cos(a) * s, Math.sin(a) * s, .6, pick(['*','^','°']), [1, .5 + rnd() * .4, .15], -.5); } }, 180);
      for (const e of ents) if (!e.dead && cheb(e, {x:c[0], y:c[1]}) <= 2) damage(e, 3, 'burn', 180);
    }
    endTurn();
  });
}
function freezeTile(x, y, walls){
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
  if (e && !e.isPlayer && !e.npc) {
    if (MONS[e.type]?.immune?.frost) damage(e, 1, 'frost');
    else { if (!e.frozen) log(`The ${e.name} is frozen solid!`, [.6,.9,1]); e.frozen = 5; e.burning = 0; damage(e, 1, 'frost'); }
  }
  frostBits(x, y);
}
function castFrost(tr){
  log('A freezing beam lances out!', [.6,.9,1]); Snd.frost(); state.obsMsg = 0;
  launch(tr.cells, 18, '*', [.7,.95,1], (x, y) => frostBits(x, y), () => {
    tr.cells.forEach(([x, y]) => freezeTile(x, y, false));
    const c = tr.hit || tr.cells[tr.cells.length - 1];
    if (c) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) freezeTile(c[0] + dx, c[1] + dy, true);
      flash(c[0], c[1], 5, [.5,.8,1], 1.8, 600);
    }
    Snd.freeze();
    endTurn();
  });
}

// =====================================================================
//  Mouse travel
// =====================================================================
const canSee = e => { const i = idx(e.x, e.y); return vis[i] && (lumS[i] > .05 || cheb(e, player) <= 5); };
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
      ROCK:'Cold mountain stone.', DEADTREE:'A dead tree, bone-white and patient.', VENT:'A vent breathes scalding steam.'};
const HINT_X = {WATER:'Lightning arcs through connected water.', BOG:'Conducts lightning. Fire may ignite the swamp gas.',
  ICE:'Walkable. Fire melts it back to water.', TORCH:'Lights the area. Frost snuffs it.', CHEST:'Bump to open.', DOOR:'Bump to open.',
  STAIRS:'Step on it to finish the demo.', OBSIDIAN:'Safe to walk on.', SNOW:'Fire melts it.', PINE:'Burns.', REEDS:'Burns.',
  GRASS:'Burns.', MEADOW:'Burns, slowly.', FLOWER:'Burns.', PLANK:'Nothing in the old man\'s house will burn. He made sure.'};
const ITEM_FACT = {potion:'Step on it: +10 HP.', scroll:'Step on it: max MP +4. Fire destroys it.', gold:'Step on it to pick up.'};

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
      text = gonzoPick(kind, G[kind]);
      sub = `${Math.max(0, e.hp)}/${e.maxhp} HP · ${e.mp}/${e.maxmp} MP` + (state.armor ? ` · armour ${state.armor}` : '');
      col = [1,.95,.75];
    } else if (e.npc) {
      const kind = state.mem.knowsName ? 'manNamed' : 'man';
      key = 'man'; title = state.mem.knowsName ? 'Eli' : 'An old man';
      text = gonzoPick(kind, G[kind]);
      fact = 'Walk into him to talk.'; col = [.9,.85,1];
    } else {
      key = 'mon:' + e.type; title = capF(e.name);
      text = gonzoPick(key, G.mons[e.type] || ['Something with teeth. I could not get a good look at it and I did not try very hard.']);
      const d = describe(x, y) || ''; sub = d.slice(e.name.length + 1).replace(/^(\d+\/\d+)/, '$1 HP');
      if (/^big /.test(e.name)) K.push(G.states.big); else if (/^scrawny /.test(e.name)) K.push(G.states.scrawny);
      if (e.burning) K.push(G.states.burning); else if (e.frozen) K.push(G.states.frozen);
      else if (e.hp < e.maxhp * .5) K.push(G.states.hurt);
      if (TD[map[i]].water && !(MONS[e.type].immune || {}).shock) K.push(G.states.inWater);
      col = e.col.map(v => .45 + v * .55);
    }
  } else {
    const it = items.find(o => o.x === x && o.y === y);
    if (it && vis[i]) {
      key = 'item:' + it.kind; title = capF(ITEMS[it.kind].name);
      text = gonzoPick(key, G.items[it.kind]); fact = ITEM_FACT[it.kind] || ''; col = ITEMS[it.kind].col.map(v => .5 + v * .5);
    } else {
      const t = map[i]; key = 'tile:' + t; title = capF(TNAME[t] || t);
      const D = (t === 'ALTAR' || t === 'ALTARSPENT') ? altarDeity(i) : null;
      if (D) { title = `Altar of ${D.name}`; sub = D.title + (t === 'ALTARSPENT' ? ' · spent' : ''); col = D.col; }
      text = gonzoPick(key + (D ? ':' + altars[i] : ''), D && t === 'ALTAR' ? D.gonzo : G.tiles[t] || ['A thing. Not much to say about it, which in this place is a luxury.']);
      fact = HINT[t] || HINT_X[t] || '';
      if (fire[i] > 0) K.push(G.states.tileFire);
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
  } else if (ty === VH + 2) {
    const b = spellBtns.find(b => tx >= b.c0 && tx < b.c1);
    if (b) { k = b.k; title = `${SPELLS[b.k].name} · ${cost(b.k)} MP`; }
  }
  if (!k) return null;
  return {hud:true, hx:tx, key:'hud:' + k, title, sub:'', text:gonzoPick('hud:' + k, G[k]), fact:'',
    col:k in SPELLS ? SPELLS[k].col.map(v => .4 + v * .6) : [.75,.95,.8], t0:now(), turn:state.turn};
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
    const foot = I.confirm ? ' [Y] yes  ·  any other key: no ' : ' right-click: more ';
    ctx.fillStyle = 'rgb(2,3,3)'; ctx.fillRect((px + INS_W - 2 - foot.length) * TW, (py + H - 1) * TH, foot.length * TW, TH);
    scrText(px + INS_W - 2 - foot.length, py + H - 1, foot, fc.map(v => v * .8));
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
  else if (D.gift === 'armor') state.armor = (state.armor || 0) + 1;
  else if (D.gift === 'cost') state.costDown = (state.costDown || 0) + 1;
  state.prayed = (state.prayed || 0) + 1;
  flash(x, y, 7, D.col, 2.2, 1400); Snd.zone(); Snd.potion();
  for (let k = 0; k < 24; k++) part(x + (rnd() - .5) * .6, y, (rnd() - .5) * 2.5, -1 - rnd() * 2.5, 1.2 + rnd(), pick(['·', '*', '+', '°']), D.col, -.4, k * .03);
  log(`You kneel before ${deityFull(D)}.`, D.col);
  log(`${D.name} blesses you: ${D.boon}`, D.col.map(v => v * .9 + .1));
  inspect = {x:P.x, y:P.y, key:'prayer', title:D.name, sub:D.title + ' · a blessing', text:D.prayer, fact:D.boon, col:D.col, t0:now(), turn:state.turn + 1};
  Snd.page();
}
function describe(x, y){
  const i = idx(x, y);
  if (!seen[i]) return null;
  const e = entAt(x, y);
  if (e && (e.isPlayer || canSee(e))) {
    if (e.isPlayer) return state.belief ? 'you (you believe in yourself)' : 'you';
    if (e.npc) return state.mem.knowsName ? 'Eli, the old man' : 'an old man';
    const D = MONS[e.type], tags = [];
    if (D.immune?.burn) tags.push('fireproof'); if (D.immune?.frost) tags.push('frostproof'); if (D.immune?.shock) tags.push('shockproof');
    if (D.weak?.burn) tags.push('hates fire'); if (D.weak?.frost) tags.push('hates frost'); if (D.regen) tags.push('regenerates');
    return `${e.name} ${Math.max(0, e.hp)}/${e.maxhp}` + (e.frozen ? ' frozen' : '') + (e.burning ? ' burning' : '') + (tags.length ? ' · ' + tags.join(', ') : '');
  }
  const it = items.find(o => o.x === x && o.y === y);
  if (it && vis[i]) return ITEMS[it.kind].name;
  return TNAME[map[i]] + (fire[i] > 0 ? ' (burning)' : '') + (snowAcc[i] > .5 && TD[map[i]].snowy ? ', under snow' : '') + (vis[i] ? '' : ' (remembered)');
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
    if (!vis[i]) { const m = d.block ? .15 : .085;
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
    } else if (key === 'TORCH' || key === 'HEARTH') {
      const f = flick(t, h*50);
      r = g = b = 0; em = .85 + .35*f; cr = 1; cg = .5 + .3*f; cb = .18; oy = -f*.8;
      if (rnd() < .07) ember(x, y - .3);
    } else if (key === 'WINDOW') { em = .3 + .1 * flick(t, 9); cr = 1; cg = .78; cb = .4; }
    else if (key === 'ALTAR') { const D = altarDeity(i), c = D ? D.col : [1,.8,.5], p = .5 + .5 * Math.sin(t * 2.1 + h * 9);
      r = g = b = 0; em = .8 + .4 * p; cr = .6 + .4 * c[0]; cg = .6 + .4 * c[1]; cb = .6 + .4 * c[2]; oy = -p * 1.2;
      if (rnd() < .06) part(x + (rnd() - .5) * .6, y - .2, (rnd() - .5) * .3, -.5 - rnd() * .5, 1.4, pick(['·', '°', '*']), c, -.15); }
    else if (key === 'SECRET') { const s = (t * .19 + h * 7) % 1; em = .06 + (s < .04 ? .5 * (1 - s / .04) : 0) + .04 * Math.sin(t * 1.3 + h * 20); }
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
    if (key === 'TORCH' || key === 'TORCHOUT') {
      const lk = Math.min(1.2, (lr[i] + lg[i] + lb[i]) / 3 + (key === 'TORCH' ? .5 : .08));
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

function drawItems(){
  for (const it of items) {
    const i = idx(it.x, it.y); if (!vis[i] || lumS[i] < .05) continue;
    const I = ITEMS[it.kind];
    glyph(I.ch, it.x, it.y, I.col[0]*(.3 + lr[i]), I.col[1]*(.3 + lg[i]), I.col[2]*(.3 + lb[i]), 0, Math.sin(now()/400 + i)*.8);
  }
}

function drawEntity(e, t, tn){
  const i = idx(e.x, e.y), T = e.tf, D = MONS[e.type] || {};
  let [cr, cg, cb] = e.col, ox = T.ox * TW, oy = T.oy;
  if (e.isPlayer) { [cr, cg, cb] = state.belief ? [1, .9 + .08 * Math.sin(t * 2), .55] : [1, 1, .85];
    if (state.belief && rnd() < .05) part(e.vx + (rnd() - .5) * .8, e.vy + (rnd() - .5) * .6, 0, -.4, .8, '·', [1,.9,.5]); }
  else if (!e.npc) { cr *= .35 + .8*lr[i]; cg *= .35 + .8*lg[i]; cb *= .35 + .8*lb[i]; }
  else { const f = .4 + .7 * Math.min(1, (lr[i] + lg[i] + lb[i]) / 3); cr *= f; cg *= f; cb *= f;
    if (rnd() < .06) part(e.vx + .25 * e.face, e.vy - .35, (rnd() - .5) * .2, -.45, 1.6, rnd() < .5 ? '~' : '°', [.5,.5,.55], -.08); }
  if (D.glow) { const f = .8 + .3 * flick(t, e.seed); cr *= f; cg *= f; cb *= f; }
  if (e.type === 'wisp' || e.type === 'wraith') { const a = .6 + .4 * Math.sin(t * 5 + e.seed); cr *= a; cg *= a; cb *= a;
    if (rnd() < .08) part(e.vx, e.vy + .2, (rnd() - .5) * .3, .2, .7, '·', e.col.map(c => c * .6)); }
  if ((e.type === 'imp' || e.type === 'golem') && rnd() < .12) ember(e.vx, e.vy - .2);
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
      glyph(e.ch, e.x + f.ox, e.y + f.oy, cr, cg, cb, 0, T.oy, T.rot - (ATK[e.act.style].f(p, e.act.dx, e.act.dy, e.act.s, t).rot - f.rot), T.sx, T.sy, true);
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
  glyph(e.ch, e.vx, e.vy, cr, cg, cb, ox, oy, T.rot, T.sx, T.sy);
  ctx.globalAlpha = 1;
  if (!e.isPlayer && !e.npc && e.hp < e.maxhp && !e.dead) {
    ctx.fillStyle = css(.9, .25, .2);
    ctx.fillRect(sx(e.vx) - TW / 2 + 2, sy(e.vy) + TH / 2 - 2, (TW - 4) * Math.max(0, e.hp) / e.maxhp, 2);
  }
}
function drawEnts(t, tn){
  for (const e of ents) {
    if (e.dead) continue;
    updateEnt(e, t, tn);
    if (!e.isPlayer && !canSee(e)) continue;
    drawEntity(e, t, tn);
  }
  dying = dying.filter(D => {
    if (tn >= D.at) { shatter(D.e); return false; }
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
    ctx.strokeStyle = 'rgb(110,160,255)'; ctx.lineWidth = 6; strokePath(b.jag);
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
  ctx.font = PFONT;
  parts = parts.filter(p => {
    if (p.d > 0) { p.d -= dt; return true; }
    p.life -= dt; if (p.life <= 0) return false;
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += p.g*dt;
    ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
    ctx.fillStyle = css(p.col[0], p.col[1], p.col[2]);
    ctx.fillText(p.ch, sx(p.x), sy(p.y));
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
  // birds over the meadow
  if (zone[idx(player.x, player.y)] === Z.MEADOW && rnd() < .0025 && W.rain < .5) {
    const y = CY + 2 + rnd() * 8, dir = rnd() < .5 ? 1 : -1, x = dir > 0 ? CX - 1 : CX + WVW + 1;
    for (let k = 0; k < ri(3, 6); k++) parts.push({x:x - dir * k * .9, y:y + (k % 2) * .6 + rnd() * .3, vx:dir * (4 + rnd()), vy:(rnd() - .5) * .3, life:20, max:20, ch:'v', col:[.3,.35,.4], g:0, d:0, bird:1});
  }
}
function drawWeather(t, dt){
  // rain as one batched stroke
  ctx.strokeStyle = 'rgba(160,185,255,.5)'; ctx.lineWidth = 1.2; ctx.beginPath();
  const keep = [];
  for (const p of wparts) {
    p.life -= dt; p.x += (p.vx + (p.k ? Math.sin(t * 1.5 + p.ph) * .8 : 0)) * dt; p.y += p.vy * dt;
    const i = idx(clamp(Math.floor(p.x), 0, MW - 1), clamp(Math.floor(p.y), 0, MH - 1));
    if (!ZONES[zone[i]].outdoor) continue;
    if (p.life <= 0) { if (!p.k && rnd() < .35 && seen[i]) part(p.x, p.y, (rnd() - .5) * 2, -1.5, .18, '.', [.6,.7,.95], 10); continue; }
    keep.push(p);
    if (!p.k) { ctx.moveTo(sx(p.x), sy(p.y)); ctx.lineTo(sx(p.x - p.vx * .025), sy(p.y - p.vy * .025)); }
  }
  ctx.stroke(); ctx.lineWidth = 1.3;
  wparts = keep;
  ctx.font = PFONT; ctx.fillStyle = 'rgb(235,240,255)';
  for (const p of wparts) if (p.k) { ctx.globalAlpha = Math.min(1, p.life) * .85; ctx.fillText(p.ph > 4.5 ? '*' : '·', sx(p.x), sy(p.y)); }
  ctx.globalAlpha = 1;
  for (const f of flies) {
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
  if (!ZONES[z].outdoor) return z === Z.HOUSE ? 'by the fire' : 'underground';
  const L = localW(z), s = [];
  if (state.weather.type === 'storm' && L.rain > .4) return 'storm';
  if (L.snow > .4 && L.wind > .5) return 'blizzard';
  if (L.rain > .35) s.push('rain'); if (L.snow > .35) s.push('snow'); if (L.wind > .35) s.push('wind');
  return s.join(' + ') || 'clear';
}
function drawHUD(t){
  const P = player;
  hudText(0, 0, '─'.repeat(VW), [.2,.3,.22]);
  const zl = ` ${ZONES[state.zone]?.name || ''} · ${weatherLabel()} `;
  ctx.fillStyle = '#000'; ctx.fillRect(TW, VH * TH, zl.length * TW, TH);
  hudText(1, 0, zl, [.55,.7,.6]);
  hudZones = {hp:[1]};
  let c = hudText(1, 1, 'HP ', [.6,.75,.6]);
  c = hudText(c, 1, bar(P.hp, P.maxhp), P.hp < P.maxhp*.35 ? [1,.3*(.6+.4*Math.sin(t*8)),.25] : [1,.35,.3]);
  c = hudText(c, 1, ` ${Math.max(0,P.hp)}/${P.maxhp}`.padEnd(8), [.8,.85,.75]);
  hudZones.hp.push(c); hudZones.mp = [c];
  c = hudText(c, 1, 'MP ', [.6,.75,.6]);
  c = hudText(c, 1, bar(P.mp, P.maxmp), [.4,.7,1]);
  c = hudText(c, 1, ` ${P.mp}/${P.maxmp}`.padEnd(8), [.8,.85,.75]);
  hudZones.mp.push(c); hudZones.gold = [c, c + `$${state.gold}`.length];
  c = hudText(c, 1, `$${state.gold} `, [1,.85,.3]);
  if (state.belief) hudText(c, 1, '✦', [1,.9,.5 + .3 * Math.sin(t * 3)]);
  { const sl = `[M] ${Snd.label()}`; sndBtn = [VW - 1 - sl.length, VW - 1];
    const ov = hoverAny && hoverAny[1] === VH + 1 && hoverAny[0] >= sndBtn[0] && hoverAny[0] < sndBtn[1];
    hudText(sndBtn[0], 1, sl, ov ? [.7,.95,.75] : [.4,.55,.45]); }
  c = 1; spellBtns = [];
  const hv = hoverAny && hoverAny[1] === VH + 2 ? hoverAny[0] : -1;
  for (const k of ['1','2','3']) {
    const sp = SPELLS[k], sel = state.targeting === k, ok = P.mp >= cost(k);
    const label = `${sel?'>':'['}${k}${sel?'<':']'} ${sp.name} ${cost(k)}`;
    const over = hv >= c && hv < c + label.length;
    const m = sel ? .75 + .35*Math.sin(t*10) : over ? 1.25 : ok ? .8 : .3;
    spellBtns.push({k, c0:c, c1:c + label.length});
    c = hudText(c, 2, label + '  ', sp.col.map(v => v*m));
  }
  if (hover && !dlg) {
    const d = describe(hover[0], hover[1]);
    if (d) { const str = ` ${d.slice(0, 34)} `, x0 = VW - 2 - str.length;
      ctx.fillStyle = '#000'; ctx.fillRect(x0*TW, VH*TH, str.length*TW, TH);
      hudText(x0, 0, str, [.75,.95,.75]); }
  }
  const m1 = msgs[msgs.length - 2], m2 = msgs[msgs.length - 1];
  if (m1) hudText(2, 3, m1.text.slice(0, VW - 4), m1.col.map(v => v*.45));
  if (m2) hudText(2, 4, m2.text.slice(0, VW - 4), m2.col);
}

function drawScene(t, tn, dt){
  ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
  ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, SW, VH * TH); ctx.clip(); ctx.scale(ZOOM, ZOOM);
  drawTiles(t, tn);
  drawItems();
  drawTargeting(t);
  drawCursor(t);
  drawEnts(t, tn);
  drawProjs();
  drawWeather(t, dt);
  drawBolts(tn);
  drawParticles(dt);
  ctx.restore();
  Dialog.draw(t);
  drawHUD(t);
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
  const tag = 'somewhere, a kettle is on';
  scrText(Math.floor(cx - tag.length / 2), by + 4, tag, [.45,.6,.5]);
  line(by + 7,  'left-click',  'move · attack · talk');
  line(by + 8,  'right-click', 'inspect anything');
  line(by + 9,  'WASD',        'move (Q E Z C diagonals)');
  line(by + 10, 'numpad',      'move');
  line(by + 11, 'vi-keys',     'move (hjkl yubn)');
  line(by + 13, '1  2  3',     'lightning · fire · frost', [.7,.85,1]);
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
  if (inspect && inspect.confirm) {
    ev.preventDefault();
    if (k === 'y' || k === 'Enter') { inspect = null; Snd.cancel(); init(); }
    else { inspect = null; Snd.cancel(); }
    return;
  }
  if (inspect) { inspect = null; if (ev.key === 'Escape') return; }
  if (k === 'r') { if (state.dead || state.won) init(); else askRestart(); return; }
  const dir = NUMPAD[ev.code] || DIRS[k];
  if (state.travel) { state.travel = null; if (dir || k === ' ') ev.preventDefault(); return; }
  if (dir || k === ' ') ev.preventDefault();
  if (state.dead || state.won || projs.length) return;
  if (k === 'Escape') { if (state.targeting) { state.targeting = null; Snd.cancel(); log('Cancelled.', [.5,.6,.5]); } return; }
  if (ev.code.startsWith('Digit') && SPELLS[k]) { beginCast(k); return; }
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
  if (ty === VH + 2) {
    const b = spellBtns.find(b => tx >= b.c0 && tx < b.c1);
    if (b && !state.dead && !state.won) { if (state.targeting === b.k) { state.targeting = null; Snd.cancel(); log('Cancelled.', [.5,.6,.5]); } else beginCast(b.k); }
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
  if (state.travel && !projs.length && tn >= state.travel.next && !dlg) travelStep(tn);
  Dialog.update(dt);
  updateWeather(t, dt);
  // camera follows the @ smoothly (and lifts when the old man is talking)
  const tx = clamp(player.vx + .5 - WVW / 2, 0, MW - WVW), ty = clamp(player.vy + .5 - WVH / 2 + (dlg && dlg.kind === 'man' ? 5 : 0), 0, MH - WVH);
  CX += (tx - CX) * Math.min(1, dt * 5); CY += (ty - CY) * Math.min(1, dt * 5);
  CXr = Math.round(CX * TW * ZOOM) / (TW * ZOOM); CYr = Math.round(CY * TH * ZOOM) / (TH * ZOOM);
  // sound of the place
  const z = zone[idx(player.x, player.y)], L = localW(z);
  Snd.ambient({rain:ZONES[z].outdoor ? L.rain : z === Z.HOUSE ? W.rain * .8 : 0, wind:ZONES[z].outdoor ? L.wind : z === Z.HOUSE ? W.wind * .6 : 0,
               lava:z === Z.DEEPS ? 1 : 0, swamp:z === Z.MIRE ? 1 : 0, indoor:z === Z.HOUSE ? 1 : 0, gust:gust(t, player.x)});
  Snd.tone2(ZONES[z].music * (L.snow > .4 ? .75 : 1), dlg ? .4 : 1);
  computeLight(t, tn);
  drawScene(t, tn, dt);
  present(t, dt);
  requestAnimationFrame(frame);
}
init(); resize(); requestAnimationFrame(frame);
