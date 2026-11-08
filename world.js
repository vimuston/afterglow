'use strict';
// =====================================================================
//  Tiles
// =====================================================================
const TD = {
  // cellars
  WALL:     {ch:'#', col:[.62,.66,.60], block:1, opaque:1},
  FLOOR:    {ch:'.', col:[.40,.44,.38]},
  ASH:      {ch:',', col:[.42,.36,.32]},
  WATER:    {ch:'~', col:[.25,.60,1.0], water:1},
  DEEP:     {ch:'≈', col:[.15,.40,1.0], water:1, block:1},
  ICE:      {ch:'≡', col:[.65,.90,1.0], snowy:1},
  ICEWALL:  {ch:'#', col:[.55,.85,1.0], block:1, opaque:1},
  GRASS:    {ch:'"', col:[.35,.95,.35], burn:1, plant:1, fuel:3, spread:.55, snowy:1},
  BUSH:     {ch:'♣', col:[.25,.85,.30], burn:1, plant:1, block:1, opaque:1, fuel:5, spread:.4, cap:1},
  DOOR:     {ch:'+', col:[.85,.55,.25], burn:1, block:1, opaque:1, fuel:6, spread:.3},
  OPEN:     {ch:"'", col:[.85,.55,.25], burn:1, fuel:6, spread:.3},
  CRATE:    {ch:'=', col:[.90,.62,.30], burn:1, block:1, fuel:6, spread:.3},
  CHEST:    {ch:'&', col:[1.0,.82,.25], burn:1, block:1, fuel:6, spread:.25},
  CHESTOPEN:{ch:'&', col:[.55,.42,.22], burn:1, block:1, fuel:6, spread:.25},
  TORCH:    {ch:'Ψ', col:[1.0,.75,.35], block:1, opaque:1},
  TORCHOUT: {ch:'Ψ', col:[.40,.45,.55], block:1, opaque:1},
  STAIRS:   {ch:'>', col:[1.0,1.0,.60]},
  // meadow
  MEADOW:   {ch:',', col:[.30,.58,.30], snowy:1},
  FLOWER:   {ch:'*', col:[1.0,.6,.8], burn:1, plant:1, fuel:2, spread:.4, snowy:1},
  TREE:     {ch:'♣', col:[.22,.78,.32], burn:1, plant:1, tree:1, block:1, opaque:1, fuel:8, spread:.32, cap:1},
  DIRT:     {ch:'.', col:[.55,.45,.32], snowy:1},
  // house
  STONE:    {ch:'#', col:[.72,.64,.52], block:1, opaque:1, cap:1},
  WINDOW:   {ch:'░', col:[.85,.75,.45], block:1},
  PLANK:    {ch:'.', col:[.62,.46,.30]},
  RUG:      {ch:':', col:[.80,.32,.30]},
  HEARTH:   {ch:'Θ', col:[1.0,.6,.25], block:1, opaque:1},
  TABLE:    {ch:'π', col:[.78,.56,.34], block:1},
  CHAIR:    {ch:'h', col:[.72,.50,.30], block:1},
  BED:      {ch:'Ξ', col:[.78,.48,.55], block:1},
  SHELF:    {ch:'▤', col:[.68,.52,.36], block:1, opaque:1},
  // mire
  MUD:      {ch:'.', col:[.45,.40,.26], snowy:1},
  BOG:      {ch:'~', col:[.40,.56,.28], water:1, bog:1},
  REEDS:    {ch:'|', col:[.60,.75,.32], burn:1, plant:1, fuel:2, spread:.6, snowy:1},
  DEADTREE: {ch:'¥', col:[.58,.52,.42], burn:1, plant:1, tree:1, block:1, opaque:1, fuel:6, spread:.3, cap:1},
  // pass
  SNOW:     {ch:'.', col:[.80,.86,.95], snowy:1},
  ROCK:     {ch:'▲', col:[.58,.60,.70], block:1, opaque:1, cap:1},
  PINE:     {ch:'♠', col:[.22,.62,.45], burn:1, plant:1, tree:1, block:1, opaque:1, fuel:7, spread:.28, cap:1},
  // deeps
  BASALT:   {ch:'#', col:[.55,.30,.26], block:1, opaque:1},
  CAVE:     {ch:'.', col:[.48,.36,.30]},
  LAVA:     {ch:'≈', col:[1.0,.38,.06], block:1, lava:1},
  OBSIDIAN: {ch:'▪', col:[.50,.38,.68]},
  VENT:     {ch:'^', col:[1.0,.55,.2], block:1},
  // secrets
  SECRET:   {ch:'#', col:[.74,.52,.86], block:1, opaque:1},
  RUBBLE:   {ch:':', col:[.55,.48,.58]},
  ALTAR:    {ch:'Ω', col:[1.0,.85,.55], block:1},
  ALTARSPENT:{ch:'Ω', col:[.45,.42,.48], block:1},
  // the long way down
  CAMPFIRE: {ch:'Θ', col:[1.0,.6,.25], block:1, opaque:1},
  UPSTAIRS: {ch:'<', col:[.80,.80,.62]},
  WEB:      {ch:'%', col:[.82,.82,.88], burn:1, fuel:1, spread:.75, web:1},
  EGGSAC:   {ch:'0', col:[.92,.86,.70], burn:1, block:1, fuel:3, spread:.4},
  BRAMBLE:  {ch:'§', col:[.70,.55,.32], burn:1, plant:1, block:1, opaque:1, fuel:4, spread:.55, snowy:1},
  GATE:     {ch:'╫', col:[.72,.72,.78], block:1},
  CHASM:    {ch:'░', col:[.22,.25,.36], block:1, chasm:1},
  PILLAR:   {ch:'■', col:[.62,.52,.46], block:1, opaque:1, cap:1},
  TWALL:    {ch:'#', col:[.50,.50,.64], block:1, opaque:1},
  TFLOOR:   {ch:'.', col:[.36,.36,.44]},
  BONES:    {ch:';', col:[.78,.76,.66]},
  SARCO:    {ch:'□', col:[.66,.62,.72], block:1},
  GRAVE:    {ch:'∩', col:[.80,.80,.90], block:1},
  GRAVEDONE:{ch:'∩', col:[1.0,.75,.85], block:1},
  RUNE:     {ch:'◊', col:[.45,.40,.72], block:1, opaque:1},
  RUNELIT:  {ch:'◊', col:[.70,.90,1.0], block:1, opaque:1},
  BARRICADE:{ch:'Ħ', col:[.72,.52,.30], burn:1, block:1, opaque:1, fuel:6, spread:.3},
};
const TNAME = {WALL:'wall', FLOOR:'floor', ASH:'ash', WATER:'shallow water', DEEP:'deep water', ICE:'ice',
  ICEWALL:'frozen wall', GRASS:'grass', BUSH:'bush', DOOR:'door', OPEN:'open door', CRATE:'wooden crate',
  CHEST:'chest', CHESTOPEN:'empty chest', TORCH:'torch', TORCHOUT:'cold torch', STAIRS:'the way down',
  MEADOW:'short grass', FLOWER:'wildflowers', TREE:'tree', DIRT:'dirt path', STONE:'stone wall', WINDOW:'window',
  PLANK:'wooden floor', RUG:'woven rug', HEARTH:'hearth (the kettle is on)', TABLE:'table', CHAIR:'chair', BED:'bed',
  SHELF:'bookshelf', MUD:'mud', BOG:'bog water', REEDS:'reeds', DEADTREE:'dead tree', SNOW:'snow', ROCK:'mountain rock',
  PINE:'pine', BASALT:'basalt', CAVE:'cave floor', LAVA:'lava', OBSIDIAN:'obsidian', VENT:'steam vent',
  SECRET:'odd wall', RUBBLE:'rubble', ALTAR:'forgotten altar', ALTARSPENT:'quiet altar',
  CAMPFIRE:"Eli's campfire", UPSTAIRS:'the way back up', WEB:'spider web', EGGSAC:'egg sac', BRAMBLE:'dry brambles',
  GATE:'iron gate', CHASM:'crevasse', PILLAR:'pillar', TWALL:'tomb wall', TFLOOR:'tomb floor', BONES:'old bones',
  SARCO:'sarcophagus', GRAVE:'a small grave', GRAVEDONE:"Marta's grave", RUNE:'dull rune', RUNELIT:'blazing rune',
  BARRICADE:'coffin barricade'};

// =====================================================================
//  Floors. Each floor of the dungeon is one zone.
// =====================================================================
const Z = {CELLAR:0, PASS:1, MIRE:2, DEEPS:3, TOMB:4};
const ZONES = [
  {name:'The Old Cellars',     outdoor:0, fog:.16, fogCol:[.45,.55,.50], music:4200, floor:'FLOOR',
   enter:'Damp stone. Old torches. Somewhere below, a stone that never dies.'},
  {name:'Greywind Pass',       outdoor:1, fog:.30, fogCol:[.85,.90,1.0], music:4000, cold:1, floor:'SNOW',
   enter:'The stairs come out under an open, freezing sky. A mountain inside the mountain.'},
  {name:'The Whispering Mire', outdoor:1, fog:.58, fogCol:[.50,.68,.50], music:3000, floor:'MUD',
   enter:'Fog sits on the water like a sleeping animal. Something with many necks is breathing.'},
  {name:'The Ember Deeps',     outdoor:0, fog:.28, fogCol:[.80,.38,.22], music:2200, floor:'CAVE',
   enter:'The rock breathes heat. Red light pools in the dark. Something huge is sleeping on it.'},
  {name:'The Sunken Tomb',     outdoor:0, fog:.24, fogCol:[.55,.50,.78], music:1800, floor:'TFLOOR',
   enter:'Cold, dry, patient air. A king who would not die is waiting at the bottom.'},
];
const NFLOORS = ZONES.length;

// =====================================================================
//  Monsters
//   atk  : attack animation style     move : movement style
//   idle : idle animation style       flags: behaviour
//   ac   : armour class (to hit it, d20 + your bonus must reach this)
//   hit  : its own to-hit bonus       s    : size in tiles (bosses are 2x2)
// =====================================================================
const MONS = {
  rat:    {ch:'r', name:'rat',         hp:3,  dmg:1, col:[.85,.70,.50], atk:'bite',   idle:'twitch', flip:1, ac:8},
  goblin: {ch:'g', name:'goblin',      hp:6,  dmg:2, col:[.45,1.0,.35], atk:'stab',   idle:'bounce'},
  slime:  {ch:'s', name:'slime',       hp:8,  dmg:1, col:[.85,.45,1.0], atk:'engulf', idle:'jiggle', move:'slide', slow:1, ac:7},
  orc:    {ch:'o', name:'orc',         hp:12, dmg:3, col:[1.0,.45,.30], atk:'cleave', idle:'breathe', move:'heavy', ac:11},
  frog:   {ch:'f', name:'bog frog',    hp:6,  dmg:2, col:[.55,.95,.35], atk:'tongue', idle:'throat', move:'leap', leap:1, flip:1},
  leech:  {ch:'l', name:'giant leech', hp:6,  dmg:2, col:[.75,.35,.40], atk:'latch',  idle:'wiggle', move:'slide', drain:1},
  wisp:   {ch:'w', name:"will-o'-wisp",hp:5,  dmg:2, col:[.70,1.0,.80], atk:'swoop',  idle:'float', move:'float', erratic:.45,
           glow:[.5,1,.6], immune:{shock:1}},
  troll:  {ch:'T', name:'bog troll',   hp:20, dmg:4, col:[.50,.70,.40], atk:'slam',   idle:'sway', move:'heavy', regen:1, slow:1},
  wolf:   {ch:'d', name:'grey wolf',   hp:8,  dmg:2, col:[.78,.78,.85], atk:'pounce', idle:'pant', move:'quick', fast:1, flip:1, howl:1},
  yeti:   {ch:'Y', name:'yeti',        hp:18, dmg:4, col:[.92,.96,1.0], atk:'clap',   idle:'breathe', move:'heavy', immune:{frost:1}, puff:1},
  wraith: {ch:'W', name:'ice wraith',  hp:9,  dmg:3, col:[.60,.78,1.0], atk:'swoop',  idle:'float', move:'float', glow:[.4,.6,1],
           immune:{frost:1}, weak:{burn:2}},
  spider: {ch:'x', name:'pass spider', hp:6,  dmg:2, col:[.80,.72,.60], atk:'bite',   idle:'twitch', move:'quick', poison:3, weak:{burn:2}, webwalk:1, flip:1},
  imp:    {ch:'i', name:'fire imp',    hp:7,  dmg:3, col:[1.0,.55,.20], atk:'spear',  idle:'flicker', glow:[1,.5,.2], lavawalk:1,
           immune:{burn:1}, weak:{frost:2}, erratic:.2},
  golem:  {ch:'G', name:'magma golem', hp:26, dmg:5, col:[.95,.38,.16], atk:'punch',  idle:'smolder', move:'heavy', slow:1, glow:[1,.4,.1],
           immune:{burn:1}, weak:{frost:2}, ac:15},
  bat:    {ch:'v', name:'ember bat',   hp:4,  dmg:2, col:[.85,.50,.40], atk:'dive',   idle:'flap', move:'float', fast:1, erratic:.55},
  salamander:{ch:'S', name:'salamander',hp:12,dmg:3, col:[1.0,.62,.22], atk:'whip',   idle:'slither', lavawalk:1, immune:{burn:1}, weak:{frost:2}, flip:1},
  skeleton:{ch:'k', name:'skeleton',   hp:10, dmg:3, col:[.92,.90,.82], atk:'stab',   idle:'twitch', ac:13, weak:{shock:2}, undead:1},
  zombie: {ch:'z', name:'zombie',      hp:16, dmg:4, col:[.58,.72,.50], atk:'slam',   idle:'sway', move:'heavy', slow:1, weak:{burn:2}, ac:10, undead:1},
  spectre:{ch:'p', name:'spectre',     hp:9,  dmg:3, col:[.72,.76,1.0], atk:'swoop',  idle:'float', move:'float', glow:[.5,.55,1],
           immune:{melee:1, frost:1}, weak:{shock:2}, erratic:.15, undead:1},
  knight: {ch:'K', name:'bone knight', hp:22, dmg:5, col:[.88,.82,.70], atk:'cleave', idle:'breathe', move:'heavy', ac:19, immune:{burn:1, shock:1}, undead:1},
  // ---- the five who stand in the way
  matriarch:{ch:'O', name:'Gutmother Grukka', hp:44, dmg:5, col:[1.0,.22,.16], atk:'slam', idle:'breathe', move:'heavy',
           boss:1, s:2, ac:12, hit:5, title:'Matriarch of the Pit'},
  brood:  {ch:'X', name:'the Broodmother', hp:46, dmg:3, col:[.84,.78,.66], atk:'bite', idle:'twitch', move:'quick',
           boss:1, s:2, ac:13, hit:6, poison:5, weak:{burn:2}, webwalk:1, title:'Queen of the Pass'},
  hydra:  {ch:'H', name:'the Mire Hydra', hp:99, dmg:2, col:[.42,.86,.48], atk:'bite', idle:'sway', move:'heavy',
           boss:1, s:2, ac:11, hit:5, hydra:1, dry:1, slow:1, title:'Many-Necked'},
  dragon: {ch:'D', name:'Cinder', hp:80, dmg:6, col:[1.0,.32,.12], atk:'punch', idle:'smolder', move:'heavy',
           boss:1, s:2, ac:14, hit:7, immune:{burn:1}, weak:{frost:2}, glow:[1,.4,.1], lavawalk:1, title:'the Old Flame'},
  lich:   {ch:'L', name:'King Aurex', hp:80, dmg:4, col:[.78,.62,1.0], atk:'swoop', idle:'float', move:'float',
           boss:1, s:1, ac:14, hit:7, glow:[.6,.4,1], immune:{frost:1}, undead:1, title:'the Undying'},
};

// =====================================================================
//  World generation helpers (seeded)
// =====================================================================
let map, under, zone, GR = Math.random;
const gri = (a, b) => a + Math.floor(GR() * (b - a + 1));
const gpick = a => a[Math.floor(GR() * a.length)];
const gset = (x, y, t) => { if (inb(x, y)) map[idx(x, y)] = t; };
const gget = (x, y) => inb(x, y) ? map[idx(x, y)] : 'WALL';
const grect = (x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) gset(i, j, t); };
const gdisk = (cx, cy, r, f) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++)
  if (inb(x, y) && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) f(x, y); };
const gpath = (pts, r, f) => { for (let k = 0; k < pts.length - 1; k++) {
  const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
  for (let s = 0; s <= n; s++) { const u = s / n; gdisk(ax + (bx - ax) * u + (noise2(s * .3, k) - .5) * 1.2, ay + (by - ay) * u, r, f); } } };
const gwalk = t => !TD[t].block;
// which tiles can be walked to from (sx, sy); 'extra' lists blockers that count as passable (things a spell can open)
function greach(sx, sy, extra = {}){
  const seen = new Uint8Array(MW * MH), q = [idx(sx, sy)]; seen[q[0]] = 1;
  for (let h = 0; h < q.length; h++) { const i = q[h], x = i % MW, y = (i / MW) | 0;
    for (const [dx, dy] of DIR8) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const j = idx(nx, ny);
      if (seen[j]) continue; const t = map[j]; if (TD[t].block && t !== 'DOOR' && !extra[t]) continue; seen[j] = 1; q.push(j); } }
  return seen;
}
function gscatter(x0, y0, x1, y1, n, ok, f, spread = 0){
  const got = []; let tries = 0;
  while (n > 0 && tries++ < 4000) {
    const x = gri(x0, x1), y = gri(y0, y1);
    if (!inb(x, y) || !ok(map[idx(x, y)], x, y)) continue;
    if (spread && got.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < spread)) continue;
    got.push([x, y]); f(x, y); n--;
  }
}
// a hollow carved into solid rock behind one ordinary wall tile, facing a walkable tile
const SOLID = {WALL:1, ROCK:1, BASALT:1, TWALL:1, DEADTREE:1};
const nookUsed = [];
function findNook(depth = 3, half = 2, avoid = 12){
  const cands = [];
  for (let y = 2; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) {
    if (!SOLID[gget(x, y)] || nookUsed.some(([ux, uy]) => Math.abs(ux - x) < avoid && Math.abs(uy - y) < avoid)) continue;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const ot = gget(x - dx, y - dy);
      if (TD[ot].block || TD[ot].water || TD[ot].lava) continue;
      const px = -dy, py = dx; let ok = true;
      for (let k = 0; k <= depth && ok; k++) for (let sd = -half; sd <= half; sd++) {
        const tx = x + dx * k + px * sd, ty = y + dy * k + py * sd;
        if (!inb(tx, ty) || border(tx, ty) || !SOLID[gget(tx, ty)]) { ok = false; break; }
      }
      if (ok) cands.push([x, y, dx, dy]);
    }
  }
  if (!cands.length) return null;
  const [x, y, dx, dy] = gpick(cands);
  nookUsed.push([x, y]);
  return {x, y, at:(k, sd) => [x + dx * k + -dy * sd, y + dy * k + dx * sd]};
}
// secret shrine: an odd wall hiding a forgotten god
function shrine(L, floorT, deity, loot){
  const n = findNook(3, 2, 14); if (!n) return false;
  for (let k = 1; k <= 2; k++) for (let sd = -1; sd <= 1; sd++) gset(...n.at(k, sd), floorT);
  gset(n.x, n.y, 'SECRET');
  const [ax, ay] = n.at(2, 0); gset(ax, ay, 'ALTAR'); L.altars.push({x:ax, y:ay, deity});
  gset(...n.at(2, 1), 'CHEST');
  { const [gx, gy] = n.at(2, -1); L.items.push({x:gx, y:gy, kind:'gold'}); }
  { const [lx, ly] = n.at(1, 1); L.items.push({x:lx, y:ly, kind:loot}); }
  return true;
}

// rooms in a snaking grid, joined in order by Z-shaped corridors (so a corridor never cuts through a third room)
function dungeon(o){
  const {ox, oy, cols, rows, cw, chh, floor} = o, slots = [];
  for (let r = 0; r < rows; r++) for (let c0 = 0; c0 < cols; c0++) slots.push([r % 2 ? cols - 1 - c0 : c0, r]);
  const rooms = slots.map(([c, r], k) => {
    const last = k === slots.length - 1;
    const w = last ? cw - 3 : gri(8, cw - 7), h = last ? chh - 3 : gri(5, chh - 6);
    const x = ox + c * cw + (last ? 1 : gri(2, cw - w - 2)), y = oy + r * chh + (last ? 1 : gri(2, chh - h - 2));
    return {x, y, w, h, c, r, k, cx:x + (w >> 1), cy:y + (h >> 1)};
  });
  rooms.forEach(m => grect(m.x, m.y, m.w, m.h, floor));
  const links = [];
  for (let k = 0; k < rooms.length - 1; k++) links.push(corridor(rooms[k], rooms[k + 1], floor));
  return {rooms, links};
}
function corridor(A, B, floor){
  const cells = [], push = (x, y) => { const l = cells[cells.length - 1]; if (!l || l[0] !== x || l[1] !== y) cells.push([x, y]); };
  let rev = false;
  if (A.r === B.r) {
    let P = A, Q = B; if (P.c > Q.c) { P = B; Q = A; rev = true; }
    const ya = gri(P.y + 1, P.y + P.h - 2), yb = gri(Q.y + 1, Q.y + Q.h - 2), x0 = P.x + P.w, x1 = Q.x - 1, mx = gri(x0 + 1, Math.max(x0 + 1, x1 - 1));
    for (let x = x0; x <= mx; x++) push(x, ya);
    for (let y = ya; y !== yb; y += Math.sign(yb - ya)) push(mx, y);
    for (let x = mx; x <= x1; x++) push(x, yb);
  } else {
    let P = A, Q = B; if (P.r > Q.r) { P = B; Q = A; rev = true; }
    const xa = gri(P.x + 1, P.x + P.w - 2), xb = gri(Q.x + 1, Q.x + Q.w - 2), y0 = P.y + P.h, y1 = Q.y - 1, my = gri(y0 + 1, Math.max(y0 + 1, y1 - 1));
    for (let y = y0; y <= my; y++) push(xa, y);
    for (let x = xa; x !== xb; x += Math.sign(xb - xa)) push(x, my);
    for (let y = my; y <= y1; y++) push(xb, y);
  }
  if (rev) cells.reverse();
  cells.forEach(([x, y]) => gset(x, y, floor));
  return {cells, A, B};
}
// put a torch in a room's wall, somewhere it won't block a corridor
function wallTorch(m, t = 'TORCH', wall = 'WALL'){
  for (let tries = 0; tries < 40; tries++) {
    const side = gri(0, 3);
    const [x, y] = side === 0 ? [gri(m.x + 1, m.x + m.w - 2), m.y - 1] : side === 1 ? [gri(m.x + 1, m.x + m.w - 2), m.y + m.h]
                 : side === 2 ? [m.x - 1, gri(m.y + 1, m.y + m.h - 2)] : [m.x + m.w, gri(m.y + 1, m.y + m.h - 2)];
    const hz = side < 2;
    if (gget(x, y) !== wall || gget(x + (hz ? 1 : 0), y + (hz ? 0 : 1)) !== wall || gget(x - (hz ? 1 : 0), y - (hz ? 0 : 1)) !== wall) continue;
    gset(x, y, t); return [x, y];
  }
  return null;
}
const inRoom = (m, x, y, pad = 0) => x >= m.x + pad && y >= m.y + pad && x < m.x + m.w - pad && y < m.y + m.h - pad;
function roomSpot(m, ok = t => gwalk(t) && !TD[t].water, pad = 1){
  for (let tries = 0; tries < 60; tries++) { const x = gri(m.x + pad, m.x + m.w - 1 - pad), y = gri(m.y + pad, m.y + m.h - 1 - pad); if (ok(gget(x, y), x, y)) return [x, y]; }
  for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) if (ok(gget(x, y), x, y)) return [x, y];
  return [m.x, m.y];
}
const weighted = tbl => { let s = 0; for (const [, w] of tbl) s += w; let r = GR() * s; for (const [t, w] of tbl) if ((r -= w) < 0) return t; return tbl[0][0]; };

// =====================================================================
//  The five floors
// =====================================================================
function buildLevel(n, seed){
  GR = mulberry32(seed * 7919 + n * 104729);
  const N = MW * MH;
  map = new Array(N).fill('WALL'); under = new Array(N).fill(null); zone = new Uint8Array(N).fill(n - 1);
  nookUsed.length = 0;
  const L = {n, spawns:[], items:[], altars:[], torches:[], gates:[], start:[5, 5], npc:[7, 5], fire:[8, 5], exit:null};
  [null, level1, level2, level3, level4, level5][n](L);
  // walls round the very edge, always
  for (let x = 0; x < MW; x++) { if (!SOLID[gget(x, 0)]) gset(x, 0, 'WALL'); if (!SOLID[gget(x, MH - 1)]) gset(x, MH - 1, 'WALL'); }
  for (let y = 0; y < MH; y++) { if (!SOLID[gget(0, y)]) gset(0, y, 'WALL'); if (!SOLID[gget(MW - 1, y)]) gset(MW - 1, y, 'WALL'); }
  gset(...L.start, 'UPSTAIRS'); gset(...L.fire, 'CAMPFIRE');
  return L;
}
// Eli's corner: a campfire, him beside it, you at the foot of the stairs
function camp(L, sx, sy, floor){
  L.start = [sx, sy]; L.fire = [sx + 3, sy - 1]; L.npc = [sx + 3, sy];
  for (const [x, y] of [[sx, sy], [sx + 1, sy], [sx + 2, sy], [sx + 3, sy], [sx + 4, sy], [sx + 2, sy - 1], [sx + 4, sy - 1]]) if (TD[gget(x, y)].block || TD[gget(x, y)].water) gset(x, y, floor);
}

// ---------------- 1: The Old Cellars ----------------
function level1(L){
  const {rooms, links} = dungeon({ox:2, oy:2, cols:4, rows:3, cw:24, chh:15, floor:'FLOOR'});
  const S = rooms[0], B = rooms[rooms.length - 1];
  links.forEach((l, k) => { if (GR() < .5) gset(...l.cells[0], 'DOOR'); if (k === links.length - 1 || GR() < .35) gset(...l.cells[l.cells.length - 1], 'DOOR'); });
  // a couple of shortcuts between rows, so it isn't one long hallway
  corridor(rooms[1], rooms[6], 'FLOOR'); corridor(rooms[5], rooms[10], 'FLOOR');
  const table = k => k < 4 ? [['rat', 3], ['goblin', 3], ['slime', 1]] : k < 8 ? [['goblin', 3], ['rat', 1], ['slime', 1], ['orc', 1.5]] : [['orc', 3], ['goblin', 2]];
  for (const m of rooms.slice(1, -1)) {
    const th = gpick(['grass', 'pool', 'store', 'plain', 'grass', 'store']);
    if (th === 'grass') for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) { const r = GR(); gset(x, y, r < .06 ? 'BUSH' : r < .7 ? 'GRASS' : 'FLOOR'); }
    if (th === 'pool') gdisk(m.cx, m.cy, Math.min(m.w, m.h) / 2 - 1, (x, y) => { if (inRoom(m, x, y, 1)) gset(x, y, 'WATER'); });
    if (th === 'store') for (let c = gri(3, 7); c > 0; c--) { const [x, y] = roomSpot(m, t => t === 'FLOOR', 0); if (x === m.x || y === m.y || x === m.x + m.w - 1 || y === m.y + m.h - 1) gset(x, y, 'CRATE'); }
    for (let c = gri(1, 2); c > 0; c--) wallTorch(m);
    for (let c = 1 + (m.k > 3) + (GR() < .5 ? 1 : 0); c > 0; c--) {
      const t = weighted(table(m.k));
      const [x, y] = roomSpot(m, (tt, x, y) => gwalk(tt) && (t === 'slime' || !TD[tt].water) && !L.spawns.some(s => s[1] === x && s[2] === y));
      L.spawns.push([t, x, y]);
    }
  }
  wallTorch(S); wallTorch(S); wallTorch(B); wallTorch(B); wallTorch(B);
  // chests, potions, gold, one scroll
  const free = (x, y) => !L.spawns.some(s => s[1] === x && s[2] === y);
  for (const m of gpick([[rooms[2], rooms[5], rooms[9]], [rooms[3], rooms[7], rooms[10]]])) gset(...roomSpot(m, (t, x, y) => (t === 'FLOOR' || t === 'GRASS') && free(x, y)), 'CHEST');
  for (const k of [2, 5, 8]) L.items.push({...xy(roomSpot(rooms[k])), kind:'potion'});
  for (const k of [1, 3, 4, 6, 7, 9]) L.items.push({...xy(roomSpot(rooms[k])), kind:'gold'});
  L.items.push({...xy(roomSpot(rooms[gri(4, 9)])), kind:'scroll'});
  // the goblin who found Eli's spectacles
  { const m = rooms[gri(5, 8)], [x, y] = roomSpot(m); L.spawns.push(['goblin', x, y, {name:'goblin in spectacles', carry:'specs', sz:1.05, hp:9, maxhp:9}]); }
  camp(L, S.x + 1, S.cy, 'FLOOR');
  // her room
  L.spawns.push(['matriarch', B.cx, B.cy - 1]);
  L.spawns.push(['orc', B.cx - 4, B.cy - 3], ['orc', B.cx - 4, B.cy + 2]);
  for (let c = 0; c < 10; c++) { const [x, y] = roomSpot(B); if (Math.abs(x - B.cx) > 2) gset(x, y, 'BONES'); }
  L.exit = [B.x + B.w - 2, B.cy];
  L.bossRoom = B;
  shrine(L, 'FLOOR', 'vessa', 'scroll');
}
const xy = ([x, y]) => ({x, y});

// ---------------- 2: Greywind Pass ----------------
function level2(L){
  grect(0, 0, MW, MH, 'ROCK');
  const j = (x, y) => [x + gri(-2, 2), y + gri(-2, 2)];
  const W = [[6,44], j(16,38), j(26,44), j(36,36), [30,24], j(38,12), j(52,8), [62,16], j(60,28), j(72,36), [84,40]];
  const snow = (x, y) => { if (x > 0 && y > 0 && x < 112 && y < 50) gset(x, y, 'SNOW'); };
  gpath(W, 1.6, snow);
  W.forEach(([x, y], k) => gdisk(x, y, k === 0 ? 4 : gri(2, 4) + .5, snow));
  gpath([[36,36],[48,44],[56,46]], 1.2, snow); gdisk(56, 46, 3, snow);      // a spur to the south
  gpath([[52,8],[44,4]], 1, snow); gdisk(44, 4, 2.2, snow);                 // and one to the north
  for (let y = 2; y < 50; y++) for (let x = 2; x < 90; x++) if (gget(x, y) === 'ROCK' && fbm(x * .2, y * .2) < .36) {
    let open = 0; for (const [dx, dy] of DIR8) if (gget(x + dx, y + dy) === 'SNOW') open++;
    if (open >= 2) gset(x, y, 'SNOW');
  }
  gdisk(26, 44, 1.8, (x, y) => { gset(x, y, 'ICE'); under[idx(x, y)] = 'WATER'; });
  for (let y = 1; y < 50; y++) for (let x = 1; x < 90; x++)
    if (gget(x, y) === 'SNOW' && GR() < .1 && !W.some(([px, py]) => Math.abs(px - x) + Math.abs(py - y) < 3)) gset(x, y, GR() < .75 ? 'PINE' : 'BRAMBLE');
  // an abandoned camp: crates, a chest
  for (let k = 0; k < 4; k++) { const [x, y] = [W[5][0] + gri(-2, 2), W[5][1] + gri(-2, 2)]; if (gget(x, y) === 'SNOW') gset(x, y, 'CRATE'); }
  // the gate plaza, the passage and the spider's den
  gdisk(84, 40, 5, (x, y) => gset(x, y, 'SNOW'));
  grect(88, 33, 22, 15, 'ROCK');
  for (let x = 88; x <= 96; x++) gset(x, 40, 'FLOOR');
  gdisk(103, 40, 6.5, (x, y) => gset(x, y, 'FLOOR'));
  L.gates.push([91, 40]); gset(91, 40, 'GATE');
  for (const p of [[88,39],[88,41]]) { gset(...p, 'TORCHOUT'); L.torches.push(p); }
  // a cold torch across a crevasse, only reachable by a thrown flame
  grect(66, 11, 11, 11, 'ROCK'); gdisk(64, 16, 3.6, (x, y) => gset(x, y, 'SNOW'));
  grect(68, 13, 3, 7, 'CHASM'); gset(67, 16, 'SNOW');
  gset(71, 16, 'TORCHOUT'); L.torches.push([71, 16]);
  // and one behind dry brambles
  grect(18, 20, 10, 9, 'ROCK'); gdisk(30, 24, 3, (x, y) => gset(x, y, 'SNOW'));
  grect(21, 23, 4, 3, 'FLOOR'); gset(25, 24, 'BRAMBLE'); gset(26, 24, 'SNOW'); gset(27, 24, 'SNOW');
  gset(22, 22, 'TORCHOUT'); L.torches.push([22, 22]); gset(23, 25, 'CHEST'); L.items.push({x:21, y:24, kind:'mana'});
  // webs in the den
  gdisk(103, 40, 6.5, (x, y) => { if (GR() < .28 && Math.hypot(x - 103.5, y - 40.5) > 2.5) gset(x, y, 'WEB'); });
  L.spawns.push(['brood', 103, 40]);
  L.exit = [108, 40];
  L.bossRoom = {x:97, y:34, w:13, h:13};
  // secrets hidden behind brambles
  for (let c = 0; c < 3; c++) {
    const nk = findNook(3, 2, 10); if (!nk) break;
    for (let k = 1; k <= 2; k++) for (let sd = -1; sd <= 1; sd++) gset(...nk.at(k, sd), 'SNOW');
    gset(nk.x, nk.y, 'BRAMBLE'); gset(...nk.at(2, 0), 'CHEST');
    L.items.push({...xy(nk.at(1, gpick([-1, 1]))), kind:gpick(['potion', 'mana', 'scroll'])});
  }
  // three egg sacs, each in its own little cave, each with a nervous parent nearby
  for (let c = 0; c < 3; c++) {
    const nk = findNook(3, 2, 12); if (!nk) break;
    for (let k = 1; k <= 2; k++) for (let sd = -1; sd <= 1; sd++) gset(...nk.at(k, sd), 'SNOW');
    gset(nk.x, nk.y, 'SNOW'); gset(...nk.at(2, 0), 'EGGSAC'); gset(...nk.at(1, -1), 'WEB'); gset(...nk.at(2, 1), 'WEB');
    L.spawns.push(['spider', ...nk.at(1, 1)]);
  }
  shrine(L, 'FLOOR', 'quillow', 'potion');
  camp(L, 4, 44, 'SNOW');
  const rch = greach(4, 44);
  const ok = (t, x, y) => t === 'SNOW' && Math.hypot(x - 6, y - 44) > 10 && x < 88 && rch[idx(x, y)];
  gscatter(2, 2, 88, 49, 5, ok, (x, y) => L.spawns.push(['wolf', x, y]), 6);
  gscatter(30, 2, 88, 49, 2, ok, (x, y) => L.spawns.push(['yeti', x, y]), 10);
  gscatter(20, 2, 88, 49, 3, ok, (x, y) => L.spawns.push(['wraith', x, y]), 8);
  gscatter(10, 2, 88, 49, 3, ok, (x, y) => L.spawns.push(['spider', x, y]), 8);
  gscatter(2, 2, 88, 49, 3, ok, (x, y) => L.items.push({x, y, kind:'potion'}), 10);
  gscatter(2, 2, 88, 49, 2, ok, (x, y) => L.items.push({x, y, kind:'mana'}), 10);
  gscatter(2, 2, 88, 49, 5, ok, (x, y) => L.items.push({x, y, kind:'gold'}), 6);
}

// ---------------- 3: The Whispering Mire ----------------
function level3(L){
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const n = fbm(x * .075 + 50, y * .095 + 20);
    let t;
    if (x === 0 || y === 0 || x >= 100 || y >= 52) t = 'DEADTREE';
    else if (n > .66) t = 'DEEP';
    else if (n > .56) t = 'BOG';
    else if (n > .5) t = GR() < .7 ? 'REEDS' : 'MUD';
    else { const r = GR(); t = r < .05 ? 'DEADTREE' : r < .14 ? 'REEDS' : r < .24 ? 'GRASS' : 'MUD'; }
    gset(x, y, t);
  }
  const j = (x, y) => [x + gri(-3, 3), y + gri(-3, 3)];
  const W = [[5,26], j(16,20), j(28,32), j(40,18), j(52,34), j(64,22), [77,28], [84,26]];
  // the hydra's island: dry, ringed with dead trees
  gdisk(89.5, 26.5, 11, (x, y) => gset(x, y, 'DEADTREE'));
  gdisk(89.5, 26.5, 8.6, (x, y) => gset(x, y, GR() < .12 ? 'REEDS' : 'MUD'));
  gpath(W, .9, (x, y) => { if (!border(x, y) && x < 99) gset(x, y, TD[gget(x, y)].water && GR() < .3 ? 'BOG' : 'MUD'); });
  gpath([W[6], W[7], [82, 26]], 1, (x, y) => gset(x, y, 'MUD'));
  gdisk(5, 26, 3.5, (x, y) => gset(x, y, 'MUD'));
  // standing torches along the way
  for (const [x, y] of W.slice(1, 6)) { const tx = x + gpick([-2, 2]), ty = y + gpick([-2, 2]); if (!TD[gget(tx, ty)].water) gset(tx, ty, 'TORCH'); }
  L.spawns.push(['hydra', 90, 25]);
  L.exit = [96, 26];
  L.bossRoom = {x:81, y:18, w:18, h:18};
  camp(L, 3, 26, 'MUD');
  const rch = greach(3, 26);
  const bogOk = (t, x, y) => t === 'BOG' && x < 80 && rch[idx(x, y)], mudOk = (t, x, y) => (t === 'MUD' || t === 'GRASS' || t === 'REEDS') && x < 80 && Math.hypot(x - 5, y - 26) > 9 && rch[idx(x, y)];
  gscatter(10, 2, 79, 50, 3, (t, x, y) => bogOk(t, x, y) && x > 12, (x, y) => L.items.push({x, y, kind:'lily'}), 20);
  gscatter(3, 2, 79, 50, 6, bogOk, (x, y) => L.spawns.push(['frog', x, y]), 6);
  gscatter(3, 2, 79, 50, 5, bogOk, (x, y) => L.spawns.push(['leech', x, y]), 6);
  gscatter(14, 2, 79, 50, 4, mudOk, (x, y) => L.spawns.push(['wisp', x, y]), 8);
  gscatter(25, 2, 79, 50, 3, mudOk, (x, y) => L.spawns.push(['troll', x, y]), 12);
  gscatter(3, 2, 79, 50, 3, mudOk, (x, y) => L.items.push({x, y, kind:'potion'}), 10);
  gscatter(3, 2, 79, 50, 3, mudOk, (x, y) => L.items.push({x, y, kind:'mana'}), 10);
  gscatter(3, 2, 79, 50, 1, mudOk, (x, y) => L.items.push({x, y, kind:'scroll'}));
  gscatter(3, 2, 79, 50, 5, mudOk, (x, y) => L.items.push({x, y, kind:'gold'}), 6);
  gscatter(3, 2, 79, 50, 2, mudOk, (x, y) => gset(x, y, 'CHEST'), 15);
}

// ---------------- 4: The Ember Deeps ----------------
function level4(L){
  const X1 = 104, Y1 = 50;
  let cave = [];
  for (let y = 0; y <= Y1; y++) { cave[y] = []; for (let x = 0; x <= X1; x++) cave[y][x] = x > 1 && y > 1 && x < X1 && y < Y1 && GR() < .55; }
  for (let it = 0; it < 4; it++) {
    const nx = [];
    for (let y = 0; y <= Y1; y++) { nx[y] = []; for (let x = 0; x <= X1; x++) {
      let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (cave[y + dy]?.[x + dx]) c++;
      nx[y][x] = x > 1 && y > 1 && x < X1 && y < Y1 && c >= 5; } }
    cave = nx;
  }
  grect(0, 0, MW, MH, 'BASALT');
  for (let y = 0; y <= Y1; y++) for (let x = 0; x <= X1; x++) if (cave[y][x]) gset(x, y, 'CAVE');
  const prot = new Uint8Array(MW * MH), cav = (x, y) => { if (x > 1 && y > 1 && x < X1 && y < Y1) { gset(x, y, 'CAVE'); prot[idx(x, y)] = 1; } };
  const j = (x, y) => [x + gri(-3, 3), y + gri(-3, 3)];
  const W = [[5,25], j(16,16), j(28,30), [37,24], j(48,34), j(56,20), [65,24], j(74,30), [82,25]];
  gpath(W, 1.3, cav);
  gdisk(5, 25, 3.5, cav);
  // the hammer, on an island in a little lake of fire
  gpath([W[2], [22, 38]], 1.1, cav); gdisk(19, 40, 5, cav);
  // the dragon's hall
  gdisk(91, 25, 9.5, cav);
  for (let y = 2; y < Y1; y++) for (let x = 2; x < X1; x++) {
    const i = idx(x, y);
    if (gget(x, y) === 'CAVE' && !prot[i] && fbm(x * .16 + 90, y * .16 + 30) > .63) gset(x, y, 'LAVA');
  }
  // a river of lava, and an underground river of cold black water: both cut the whole floor in two
  for (let y = 1; y < Y1; y++) {
    for (const x of [38, 39]) if (gget(x, y) !== 'BASALT') gset(x, y, 'LAVA');
    for (const x of [66, 67]) if (gget(x, y) !== 'BASALT') gset(x, y, 'DEEP');
    for (const x of [64, 65, 68, 69]) if (gget(x, y) === 'CAVE' && GR() < .5) gset(x, y, 'WATER');
  }
  gdisk(17.5, 41.5, 2.6, (x, y) => gset(x, y, 'LAVA'));
  gset(17, 41, 'OBSIDIAN'); L.items.push({x:17, y:41, kind:'hammer'});
  for (let y = 2; y < Y1; y++) for (let x = 2; x < X1; x++) if (gget(x, y) === 'CAVE' && !prot[idx(x, y)] && GR() < .015) gset(x, y, 'VENT');
  // pillars to hide behind
  for (const [x, y] of [[85,20],[85,29],[90,16],[90,33],[88,24]]) grect(x, y, 2, 2, 'PILLAR');
  L.spawns.push(['dragon', 94, 24]);
  L.exit = [99, 25];
  L.bossRoom = {x:81, y:15, w:20, h:21};
  camp(L, 3, 25, 'CAVE');
  const rch = greach(3, 25, {LAVA:1, DEEP:1});
  const ok = (t, x, y) => t === 'CAVE' && x < 80 && Math.hypot(x - 5, y - 25) > 9 && rch[idx(x, y)];
  gscatter(8, 2, 79, 49, 6, ok, (x, y) => L.spawns.push(['imp', x, y]), 6);
  gscatter(40, 2, 79, 49, 2, ok, (x, y) => L.spawns.push(['golem', x, y]), 12);
  gscatter(8, 2, 79, 49, 4, ok, (x, y) => L.spawns.push(['bat', x, y]), 6);
  gscatter(8, 2, 79, 49, 3, ok, (x, y) => L.spawns.push(['salamander', x, y]), 8);
  gscatter(3, 2, 79, 49, 3, ok, (x, y) => L.items.push({x, y, kind:'potion'}), 10);
  gscatter(3, 2, 79, 49, 3, ok, (x, y) => L.items.push({x, y, kind:'mana'}), 10);
  gscatter(3, 2, 79, 49, 5, ok, (x, y) => L.items.push({x, y, kind:'gold'}), 6);
  gscatter(3, 2, 79, 49, 2, ok, (x, y) => gset(x, y, 'CHEST'), 15);
  shrine(L, 'CAVE', 'hrask', 'scroll');
}

// ---------------- 5: The Sunken Tomb ----------------
function level5(L){
  grect(0, 0, MW, MH, 'TWALL');
  const {rooms, links} = dungeon({ox:2, oy:2, cols:4, rows:3, cw:24, chh:15, floor:'TFLOOR'});
  const S = rooms[0], B = rooms[rooms.length - 1];
  // four seals, each wanting a different trick
  gset(...links[1].cells[0], 'BARRICADE');                     // fire
  gset(...links[3].cells[0], 'ICEWALL');   // fire or lightning
  { const m = rooms[5];                                          // frost: a flooded crypt
    for (let y = m.y; y < m.y + m.h; y++) { gset(m.cx, y, 'DEEP'); gset(m.cx + 1, y, 'DEEP'); gset(m.cx - 1, y, 'WATER'); gset(m.cx + 2, y, 'WATER'); } }
  { const m = rooms[8], l = links[8];                            // lightning + water: the rune gate
    gset(...l.cells[0], 'GATE'); L.gates.push(l.cells[0]);
    for (let x = m.x; x < m.x + m.w; x++) gset(x, m.y + m.h - 1, 'WATER');
    const rx = m.x + 1 + ((m.w - 2) * .3 | 0); gset(rx, m.y + m.h, 'RUNE'); L.rune = [rx, m.y + m.h]; }
  // Marta's grave, in a quiet corner of the fifth room
  { const m = rooms[4]; L.grave = [m.x + m.w - 2, m.y + 1]; gset(...L.grave, 'GRAVE'); }
  const table = k => k < 4 ? [['skeleton', 3], ['zombie', 2]] : k < 8 ? [['skeleton', 2], ['zombie', 2], ['spectre', 2]] : [['knight', 2], ['spectre', 2], ['skeleton', 1]];
  for (const m of rooms.slice(1, -1)) {
    for (let c = gri(1, 3); c > 0; c--) { const [x, y] = roomSpot(m, t => t === 'TFLOOR', 0); if (x === m.x || x === m.x + m.w - 1) gset(x, y, 'SARCO'); }
    for (let c = gri(2, 5); c > 0; c--) gset(...roomSpot(m, t => t === 'TFLOOR'), 'BONES');
    for (let c = gri(1, 2); c > 0; c--) wallTorch(m, 'TORCH', 'TWALL');
    for (let c = 1 + (m.k > 4) + (GR() < .5 ? 1 : 0); c > 0; c--) {
      const t = weighted(table(m.k)), [x, y] = roomSpot(m, (tt, x, y) => tt === 'TFLOOR' && !L.spawns.some(s => s[1] === x && s[2] === y));
      L.spawns.push([t, x, y]);
    }
  }
  wallTorch(S, 'TORCH', 'TWALL'); wallTorch(S, 'TORCH', 'TWALL');
  for (let c = 0; c < 4; c++) wallTorch(B, 'TORCH', 'TWALL');
  const free = (x, y) => !L.spawns.some(s => s[1] === x && s[2] === y);
  for (const m of [rooms[2], rooms[6], rooms[9]]) gset(...roomSpot(m, (t, x, y) => t === 'TFLOOR' && free(x, y)), 'CHEST');
  for (const k of [2, 4, 6, 7, 9, 10]) L.items.push({...xy(roomSpot(rooms[k])), kind:k % 2 ? 'mana' : 'potion'});
  for (const k of [1, 3, 5, 8]) L.items.push({...xy(roomSpot(rooms[k])), kind:'gold'});
  // the king's hall: four great pillars
  for (const [x, y] of [[B.x + 5, B.y + 2], [B.x + 5, B.y + B.h - 4], [B.x + B.w - 9, B.y + 2], [B.x + B.w - 9, B.y + B.h - 4], [B.x + 10, B.cy - 1]]) grect(x, y, 2, 2, 'PILLAR');
  // shallow channels along the hall: lightning's friend, if you're not standing in them
  for (let x = B.x + 3; x < B.x + B.w - 3; x++) for (const y of [B.y + 1, B.y + B.h - 2]) if (gget(x, y) === 'TFLOOR') gset(x, y, 'WATER');
  L.spawns.push(['lich', B.x + B.w - 3, B.cy]);
  L.bossRoom = B;
  camp(L, S.x + 1, S.cy, 'TFLOOR');
  shrine(L, 'TFLOOR', 'gloam', 'potion');
}

const ITEMS = {
  potion: {ch:'!', col:[1,.3,.4],    name:'healing potion', pack:1},
  mana:   {ch:'!', col:[.35,.55,1],  name:'mana potion', pack:1},
  scroll: {ch:'?', col:[.95,.92,.75], name:'scroll', burn:1},
  gold:   {ch:'$', col:[1,.85,.2],   name:'gold'},
  specs:  {ch:'∞', col:[.85,.9,1],   name:"Eli's spectacles", key:1},
  lily:   {ch:'*', col:[.9,.92,1],   name:'moonlily', key:1},
  hammer: {ch:'¬', col:[.85,.7,.5],  name:"Eli's hammer", key:1},
  tome:   {ch:'¶', col:[1,.9,.5],    name:'spellbook'},
  stone:  {ch:'◆', col:[1,.95,.8],   name:'the immortality stone'},
};
