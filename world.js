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
};
const TNAME = {WALL:'wall', FLOOR:'floor', ASH:'ash', WATER:'shallow water', DEEP:'deep water', ICE:'ice',
  ICEWALL:'frozen wall', GRASS:'grass', BUSH:'bush', DOOR:'door', OPEN:'open door', CRATE:'wooden crate',
  CHEST:'chest', CHESTOPEN:'empty chest', TORCH:'torch', TORCHOUT:'frozen torch', STAIRS:'the way down',
  MEADOW:'short grass', FLOWER:'wildflowers', TREE:'tree', DIRT:'dirt path', STONE:'stone wall', WINDOW:'window',
  PLANK:'wooden floor', RUG:'woven rug', HEARTH:'hearth (the kettle is on)', TABLE:'table', CHAIR:'chair', BED:'bed',
  SHELF:'bookshelf', MUD:'mud', BOG:'bog water', REEDS:'reeds', DEADTREE:'dead tree', SNOW:'snow', ROCK:'mountain rock',
  PINE:'pine', BASALT:'basalt', CAVE:'cave floor', LAVA:'lava', OBSIDIAN:'obsidian', VENT:'steam vent',
  SECRET:'odd wall', RUBBLE:'rubble', ALTAR:'forgotten altar', ALTARSPENT:'quiet altar'};

// =====================================================================
//  Zones
// =====================================================================
const Z = {CELLAR:0, MEADOW:1, HOUSE:2, MIRE:3, PASS:4, DEEPS:5};
const ZONES = [
  {name:'The Old Cellars',     outdoor:0, fog:.16, fogCol:[.45,.55,.50], music:4200,
   enter:'Damp stone. Old torches. Somebody lived here, once.'},
  {name:'Hearthfield Meadow',  outdoor:1, fog:.12, fogCol:[.75,.82,.85], music:5400,
   enter:'Open sky! Somewhere ahead, a window glows.'},
  {name:"The Old Man's House", outdoor:0, fog:0,   fogCol:[1,.8,.6],     music:2600, indoor:1,
   enter:'It smells of woodsmoke, books and soup.'},
  {name:'The Whispering Mire', outdoor:1, fog:.58, fogCol:[.50,.68,.50], music:3000,
   enter:'Fog sits on the water like a sleeping animal.'},
  {name:'Greywind Pass',       outdoor:1, fog:.30, fogCol:[.85,.90,1.0], music:4000, cold:1,
   enter:'Thin air, cold teeth. The mountain is listening.'},
  {name:'The Ember Deeps',     outdoor:0, fog:.28, fogCol:[.80,.38,.22], music:2200,
   enter:'The rock breathes heat. Red light pools in the dark.'},
];

// =====================================================================
//  Monsters
//   atk  : attack animation style     move : movement style
//   idle : idle animation style       flags: behaviour
// =====================================================================
const MONS = {
  rat:    {ch:'r', name:'rat',         hp:3,  dmg:1, col:[.85,.70,.50], atk:'bite',   idle:'twitch', flip:1},
  goblin: {ch:'g', name:'goblin',      hp:6,  dmg:2, col:[.45,1.0,.35], atk:'stab',   idle:'bounce'},
  slime:  {ch:'s', name:'slime',       hp:8,  dmg:1, col:[.85,.45,1.0], atk:'engulf', idle:'jiggle', move:'slide', slow:1},
  orc:    {ch:'o', name:'orc',         hp:12, dmg:3, col:[1.0,.45,.30], atk:'cleave', idle:'breathe', move:'heavy'},
  frog:   {ch:'f', name:'bog frog',    hp:5,  dmg:2, col:[.55,.95,.35], atk:'tongue', idle:'throat', move:'leap', leap:1, flip:1},
  leech:  {ch:'l', name:'giant leech', hp:5,  dmg:1, col:[.75,.35,.40], atk:'latch',  idle:'wiggle', move:'slide', drain:1},
  wisp:   {ch:'w', name:"will-o'-wisp",hp:4,  dmg:2, col:[.70,1.0,.80], atk:'swoop',  idle:'float', move:'float', erratic:.45,
           glow:[.5,1,.6], immune:{shock:1}},
  troll:  {ch:'T', name:'bog troll',   hp:18, dmg:4, col:[.50,.70,.40], atk:'slam',   idle:'sway', move:'heavy', regen:1, slow:1},
  wolf:   {ch:'d', name:'grey wolf',   hp:7,  dmg:2, col:[.78,.78,.85], atk:'pounce', idle:'pant', move:'quick', fast:1, flip:1, howl:1},
  yeti:   {ch:'Y', name:'yeti',        hp:16, dmg:4, col:[.92,.96,1.0], atk:'clap',   idle:'breathe', move:'heavy', immune:{frost:1}, puff:1},
  wraith: {ch:'W', name:'ice wraith',  hp:9,  dmg:3, col:[.60,.78,1.0], atk:'swoop',  idle:'float', move:'float', glow:[.4,.6,1],
           immune:{frost:1}, weak:{burn:2}},
  imp:    {ch:'i', name:'fire imp',    hp:5,  dmg:2, col:[1.0,.55,.20], atk:'spear',  idle:'flicker', glow:[1,.5,.2], lavawalk:1,
           immune:{burn:1}, weak:{frost:2}, erratic:.2},
  golem:  {ch:'G', name:'magma golem', hp:22, dmg:5, col:[.95,.38,.16], atk:'punch',  idle:'smolder', move:'heavy', slow:1, glow:[1,.4,.1],
           immune:{burn:1}, weak:{frost:2}},
  bat:    {ch:'v', name:'ember bat',   hp:3,  dmg:1, col:[.85,.50,.40], atk:'dive',   idle:'flap', move:'float', fast:1, erratic:.55},
  salamander:{ch:'S', name:'salamander',hp:10,dmg:3, col:[1.0,.62,.22], atk:'whip',   idle:'slither', lavawalk:1, immune:{burn:1}, flip:1},
};

// =====================================================================
//  World generation
// =====================================================================
let map, under, zone;
function buildWorld(){
  const R = mulberry32(7);
  const N = MW * MH;
  map = new Array(N).fill('WALL'); under = new Array(N).fill(null); zone = new Uint8Array(N);
  const set = (x, y, t) => { if (inb(x, y)) map[idx(x, y)] = t; };
  const get = (x, y) => inb(x, y) ? map[idx(x, y)] : 'WALL';
  const room = (x, y, w, h, t = 'FLOOR') => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, t); };
  const zrect = (x0, y0, x1, y1, z) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) zone[idx(x, y)] = z; };
  const disk = (cx, cy, r, f) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++)
    if (inb(x, y) && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) f(x, y); };
  const path = (pts, r, f) => { for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
    for (let s = 0; s <= n; s++) { const u = s / n; disk(ax + (bx - ax) * u + (noise2(s * .3, k) - .5) * 1.2, ay + (by - ay) * u, r, f); } } };
  const spawns = [], items = [];
  const scatter = (x0, y0, x1, y1, n, ok, f) => { let tries = 0;
    while (n > 0 && tries++ < 3000) { const x = x0 + Math.floor(R() * (x1 - x0 + 1)), y = y0 + Math.floor(R() * (y1 - y0 + 1));
      if (ok(map[idx(x, y)], x, y)) { f(x, y); n--; } } };
  const walk = t => !TD[t].block;

  zrect(0, 0, 59, 29, Z.CELLAR); zrect(60, 0, 119, 29, Z.MEADOW);
  zrect(0, 30, 59, 59, Z.MIRE); zrect(60, 30, 89, 59, Z.PASS); zrect(90, 30, 119, 59, Z.DEEPS);

  // ---------------- The Old Cellars (the original demo dungeon) ----------------
  room(2, 2, 12, 8); room(18, 2, 16, 9); room(38, 2, 20, 12); room(2, 14, 32, 14); room(38, 17, 20, 11);
  for (let y = 2; y < 14; y++) for (let x = 38; x < 58; x++) { const r = R(); set(x, y, r < .08 ? 'BUSH' : r < .78 ? 'GRASS' : 'FLOOR'); }
  for (let y = 14; y < 28; y++) for (let x = 2; x < 34; x++) {
    const dx = (x - 17) / 9.5, dy = (y - 21) / 4.2, d = dx*dx + dy*dy + (R() - .5) * .3;
    if (d < 1) set(x, y, 'WATER'); else if (d < 1.7 && R() < .55) set(x, y, 'GRASS'); else if (R() < .03) set(x, y, 'BUSH');
  }
  for (let y = 17; y < 28; y++) { set(50, y, 'DEEP'); set(51, y, 'DEEP'); }
  for (let y = 17; y < 28; y++) for (let x = 38; x < 50; x++) if (R() < .12) set(x, y, 'GRASS');
  for (let x = 14; x <= 16; x++) set(x, 5, 'FLOOR'); set(17, 5, 'DOOR');
  for (let x = 34; x <= 36; x++) set(x, 6, 'FLOOR'); set(37, 6, 'DOOR');
  for (let y = 11; y <= 13; y++) set(7, y, 'FLOOR'); set(7, 10, 'DOOR');
  for (let y = 14; y <= 16; y++) set(48, y, 'FLOOR');
  for (let x = 34; x <= 37; x++) set(x, 22, 'FLOOR');
  [[38,6],[39,6],[48,13],[48,12],[7,14],[7,15],[33,22],[38,22],[48,17],[57,10],[56,10],[10,27],[10,26]].forEach(([x,y]) => set(x, y, 'FLOOR'));
  [[20,3],[21,3],[20,4],[30,9],[31,9],[31,8],[23,9],[40,18],[41,18],[40,19]].forEach(([x,y]) => set(x, y, 'CRATE'));
  set(32, 3, 'CHEST'); set(56, 3, 'CHEST'); set(55, 25, 'CHEST');
  [[1,5],[14,7],[25,1],[45,1],[58,8],[1,18],[12,13],[26,28],[34,25],[44,16],[47,28],[58,20]].forEach(([x,y]) => set(x, y, 'TORCH'));
  // exits: east to the meadow, south to the mire
  set(58, 10, 'DOOR'); set(59, 10, 'DIRT');
  set(10, 28, 'DOOR'); set(10, 29, 'FLOOR');
  [['goblin',27,6],['rat',45,7],['rat',50,10],['goblin',53,5],['orc',43,22],['orc',54,21],['goblin',55,19]].forEach(s => spawns.push(s));
  [['slime',15,21],['goblin',18,20],['rat',21,22],['goblin',13,22],['slime',19,23]].forEach(([t,x,y]) => { set(x, y, 'WATER'); spawns.push([t,x,y]); });
  items.push({x:10, y:8, kind:'potion'}, {x:42, y:26, kind:'potion'}, {x:25, y:8, kind:'scroll'}, {x:27, y:3, kind:'scroll'},
             {x:4, y:8, kind:'gold'}, {x:24, y:25, kind:'gold'});

  // ---------------- Hearthfield Meadow ----------------
  for (let y = 0; y <= 29; y++) for (let x = 60; x <= 119; x++) {
    const n = fbm(x * .085, y * .12);
    let t;
    if (border(x, y) || x === 60 || y === 29 || n > .64 || (n > .56 && R() < .4)) t = 'TREE';
    else { const r = R(); t = r < .06 ? 'FLOWER' : r < .55 ? 'GRASS' : 'MEADOW'; }
    set(x, y, t);
  }
  disk(90, 12, 9, (x, y) => { if (get(x, y) === 'TREE' && !border(x, y) && y < 29) set(x, y, R() < .5 ? 'GRASS' : 'MEADOW'); });
  disk(70, 21, 4.5, (x, y) => { const dx = (x - 70) / 5, dy = (y - 21) / 3; if (dx*dx + dy*dy < 1) set(x, y, 'WATER'); });
  const road = (pts) => path(pts, .9, (x, y) => { if (x > 60 && !border(x, y) && !TD[get(x, y)].water) set(x, y, 'DIRT'); });
  road([[59,10],[66,10],[76,14],[86,17],[90,16]]);
  road([[86,17],[81,22],[76,27],[75,29]]);
  path([[59,10],[66,10],[76,14],[86,17]], 2.2, (x, y) => { if (get(x, y) === 'TREE' && x > 60 && y < 29 && !border(x, y)) set(x, y, 'MEADOW'); });
  path([[86,17],[81,22],[76,27]], 2, (x, y) => { if (get(x, y) === 'TREE' && y < 29) set(x, y, 'MEADOW'); });
  set(75, 29, 'DIRT'); set(76, 29, 'DIRT');
  // the house
  room(84, 8, 13, 8, 'STONE'); room(85, 9, 11, 6, 'PLANK'); zrect(84, 8, 96, 15, Z.HOUSE);
  room(88, 10, 5, 2, 'RUG');
  set(90, 8, 'HEARTH'); set(85, 9, 'SHELF'); set(86, 9, 'SHELF'); set(87, 9, 'SHELF');
  set(94, 9, 'BED'); set(95, 9, 'BED'); set(90, 13, 'TABLE'); set(91, 13, 'TABLE'); set(92, 13, 'CHAIR'); set(88, 10, 'CHAIR');
  [[86,8],[94,8],[84,11],[96,12],[87,15],[94,15]].forEach(([x,y]) => set(x, y, 'WINDOW'));
  set(90, 15, 'DOOR'); set(90, 16, 'DIRT'); set(88, 16, 'TORCH');
  items.push({x:93, y:14, kind:'potion'});

  // ---------------- The Whispering Mire ----------------
  for (let y = 30; y <= 59; y++) for (let x = 0; x <= 59; x++) {
    const n = fbm(x * .075 + 50, y * .095 + 20);
    let t;
    if (border(x, y) || y === 30 || x === 59) t = 'DEADTREE';
    else if (n > .56) t = 'BOG';
    else if (n > .5) t = R() < .7 ? 'REEDS' : 'MUD';
    else { const r = R(); t = r < .05 ? 'DEADTREE' : r < .14 ? 'REEDS' : r < .24 ? 'GRASS' : 'MUD'; }
    set(x, y, t);
  }
  disk(10, 31.5, 2.2, (x, y) => { if (y > 30) set(x, y, 'MUD'); }); set(10, 30, 'MUD');
  path([[10,32],[18,38],[28,42],[40,46],[52,45],[59,45]], .8, (x, y) => { if (!border(x, y) && y > 30 && get(x, y) === 'DEADTREE') set(x, y, 'MUD'); });
  set(59, 45, 'MUD'); set(59, 46, 'MUD');
  set(22, 40, 'TORCH'); set(44, 52, 'TORCH'); set(34, 35, 'TORCH');
  const bogOk = t => t === 'BOG', mudOk = t => t === 'MUD' || t === 'GRASS' || t === 'REEDS';
  scatter(3, 33, 57, 57, 5, bogOk, (x, y) => spawns.push(['frog', x, y]));
  scatter(3, 33, 57, 57, 4, bogOk, (x, y) => spawns.push(['leech', x, y]));
  scatter(14, 36, 57, 57, 3, mudOk, (x, y) => spawns.push(['wisp', x, y]));
  scatter(25, 40, 57, 57, 2, mudOk, (x, y) => spawns.push(['troll', x, y]));
  scatter(3, 33, 57, 57, 2, mudOk, (x, y) => items.push({x, y, kind:'potion'}));
  scatter(3, 33, 57, 57, 1, mudOk, (x, y) => items.push({x, y, kind:'scroll'}));
  scatter(3, 33, 57, 57, 3, mudOk, (x, y) => items.push({x, y, kind:'gold'}));

  // ---------------- Greywind Pass ----------------
  for (let y = 30; y <= 59; y++) for (let x = 60; x <= 89; x++) set(x, y, 'ROCK');
  const snow = (x, y) => { if (x >= 60 && x <= 89 && y >= 30 && !border(x, y)) set(x, y, 'SNOW'); };
  path([[75,30],[73,34],[69,38],[74,42],[80,44],[84,49],[89,52]], 1.6, snow);
  path([[59,45],[64,45],[70,43],[74,42]], 1.4, snow);
  disk(69, 38, 3.6, snow); disk(81, 46, 4.2, snow); disk(84, 51, 3, snow); disk(64, 45, 2.5, snow);
  for (let y = 31; y <= 58; y++) for (let x = 61; x <= 88; x++) if (get(x, y) === 'ROCK' && fbm(x * .2, y * .2) < .34) {
    let open = 0; for (const [dx, dy] of DIR8) if (get(x + dx, y + dy) === 'SNOW') open++;
    if (open >= 2) set(x, y, 'SNOW');
  }
  disk(81, 46, 2.3, (x, y) => { set(x, y, 'ICE'); under[idx(x, y)] = 'WATER'; });
  for (let y = 31; y <= 58; y++) for (let x = 61; x <= 88; x++) {
    const d = Math.min(...[[75,32],[69,38],[74,42],[84,49]].map(([px, py]) => Math.abs(px - x) + Math.abs(py - y)));
    if (get(x, y) === 'SNOW' && R() < .09 && d > 1) set(x, y, 'PINE');
  }
  set(59, 45, 'MUD'); set(60, 45, 'SNOW'); set(60, 46, 'SNOW');
  const snowOk = t => t === 'SNOW';
  scatter(62, 34, 88, 58, 4, snowOk, (x, y) => spawns.push(['wolf', x, y]));
  scatter(70, 40, 88, 58, 2, snowOk, (x, y) => spawns.push(['yeti', x, y]));
  scatter(62, 34, 88, 58, 2, snowOk, (x, y) => spawns.push(['wraith', x, y]));
  scatter(62, 32, 88, 58, 2, snowOk, (x, y) => items.push({x, y, kind:'potion'}));
  scatter(62, 32, 88, 58, 2, snowOk, (x, y) => items.push({x, y, kind:'gold'}));

  // ---------------- The Ember Deeps ----------------
  let cave = [];
  for (let y = 30; y <= 59; y++) { cave[y] = []; for (let x = 90; x <= 119; x++) cave[y][x] = !border(x, y) && x > 90 && y > 30 && R() < .55; }
  for (let it = 0; it < 4; it++) {
    const nx = [];
    for (let y = 30; y <= 59; y++) { nx[y] = []; for (let x = 90; x <= 119; x++) {
      let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (cave[y + dy]?.[x + dx]) n++;
      nx[y][x] = !border(x, y) && x > 90 && y > 30 && n >= 5; } }
    cave = nx;
  }
  for (let y = 30; y <= 59; y++) for (let x = 90; x <= 119; x++) set(x, y, cave[y][x] ? 'CAVE' : 'BASALT');
  const cav = (x, y) => { if (x >= 90 && y > 30 && !border(x, y)) set(x, y, 'CAVE'); };
  path([[89,52],[95,50],[100,44],[104,40],[108,46],[112,52],[115,56]], 1.3, cav);
  set(89, 52, 'SNOW'); set(90, 52, 'CAVE');
  for (let y = 31; y <= 58; y++) for (let x = 92; x <= 118; x++)
    if (get(x, y) === 'CAVE' && fbm(x * .16 + 90, y * .16 + 30) > .63) set(x, y, 'LAVA');
  for (let y = 31; y <= 58; y++) for (let x = 103; x <= 104; x++) if (get(x, y) === 'CAVE') set(x, y, 'LAVA');
  disk(115, 56, 1.8, cav); disk(92, 51, 2, cav);
  set(115, 56, 'STAIRS');
  for (let y = 31; y <= 58; y++) for (let x = 91; x <= 118; x++) if (get(x, y) === 'CAVE' && R() < .015) set(x, y, 'VENT');
  const caveOk = t => t === 'CAVE';
  scatter(93, 33, 118, 58, 4, caveOk, (x, y) => spawns.push(['imp', x, y]));
  scatter(105, 33, 118, 58, 2, caveOk, (x, y) => spawns.push(['golem', x, y]));
  scatter(93, 33, 118, 58, 4, caveOk, (x, y) => spawns.push(['bat', x, y]));
  scatter(93, 33, 118, 58, 2, caveOk, (x, y) => spawns.push(['salamander', x, y]));
  scatter(93, 33, 118, 58, 2, caveOk, (x, y) => items.push({x, y, kind:'potion'}));
  scatter(93, 33, 118, 58, 2, caveOk, (x, y) => items.push({x, y, kind:'gold'}));

  // ---------------- secret shrines: a few odd walls, each hiding a forgotten god ----------------
  const SOLID = {WALL:1, ROCK:1, BASALT:1}, altars = [], used = [];
  const shrine = (z, floorT, deity, loot) => {
    // a 3-wide, 2-deep chamber behind one odd stone in an ordinary wall
    const cands = [];
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
      if (zone[idx(x, y)] !== z || !SOLID[get(x, y)] || used.some(([ux, uy]) => Math.abs(ux - x) < 14 && Math.abs(uy - y) < 14)) continue;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const ot = get(x - dx, y - dy);
        if (!inb(x - dx, y - dy) || TD[ot].block || TD[ot].water || zone[idx(x - dx, y - dy)] !== z) continue;
        const px = -dy, py = dx; let ok = true;
        for (let k = 0; k <= 3 && ok; k++) for (let sd = -2; sd <= 2; sd++) {
          const tx = x + dx * k + px * sd, ty = y + dy * k + py * sd;
          if (!inb(tx, ty) || border(tx, ty) || !SOLID[get(tx, ty)] || zone[idx(tx, ty)] !== z) { ok = false; break; }
        }
        if (ok) cands.push([x, y, dx, dy]);
      }
    }
    if (!cands.length) return false;
    const [x, y, dx, dy] = cands[Math.floor(R() * cands.length)], px = -dy, py = dx;
    const at = (k, sd) => [x + dx * k + px * sd, y + dy * k + py * sd];
    for (let k = 1; k <= 2; k++) for (let sd = -1; sd <= 1; sd++) set(...at(k, sd), floorT);
    set(x, y, 'SECRET');
    const [ax, ay] = at(2, 0); set(ax, ay, 'ALTAR'); altars.push({x:ax, y:ay, deity});
    set(...at(2, 1), 'CHEST');
    { const [gx, gy] = at(2, -1); items.push({x:gx, y:gy, kind:'gold'}); }
    { const [lx, ly] = at(1, 1); items.push({x:lx, y:ly, kind:loot}); }
    used.push([x, y]);
    return true;
  };
  shrine(Z.CELLAR, 'FLOOR', 'vessa', 'scroll');
  if (!shrine(Z.MIRE, 'MUD', 'gloam', 'potion')) shrine(Z.CELLAR, 'FLOOR', 'gloam', 'potion');
  shrine(Z.PASS, 'FLOOR', 'quillow', 'potion');
  shrine(Z.DEEPS, 'CAVE', 'hrask', 'scroll');

  return {spawns, items, altars, npc:[89, 11], start:[5, 5]};
}

const ITEMS = {
  potion: {ch:'!', col:[1,.3,.4], name:'healing potion'},
  scroll: {ch:'?', col:[.95,.92,.75], name:'scroll', burn:1},
  gold:   {ch:'$', col:[1,.85,.2], name:'gold'},
};
