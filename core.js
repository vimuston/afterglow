'use strict';
// =====================================================================
//  Layout: a 60x30 view onto a 120x60 world, plus a 5-row HUD
// =====================================================================
const VW = 60, VH = 30, HUDROWS = 5;
const MW = 120, MH = 60;
const TW = 16, TH = 24;
const SW = VW * TW, SH = (VH + HUDROWS) * TH;
const FONT  = 'bold 21px "DejaVu Sans Mono", Menlo, Consolas, monospace';
const PFONT = 'bold 13px "DejaVu Sans Mono", Menlo, Consolas, monospace';

const scene = document.createElement('canvas'); scene.width = SW; scene.height = SH;
const ctx = scene.getContext('2d');
const BW = SW / 4, BH = SH / 4;
const bloomC = document.createElement('canvas'); bloomC.width = BW; bloomC.height = BH;
const bctx = bloomC.getContext('2d');
const out = document.getElementById('screen');

// =====================================================================
//  Utils
// =====================================================================
const rnd = Math.random;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = a => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const idx = (x, y) => y * MW + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const border = (x, y) => x === 0 || y === 0 || x === MW - 1 || y === MH - 1;
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const now = () => performance.now();
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(i){ const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function hash2(x, y){ const v = Math.sin(x * 127.1 + y * 311.7 + 74.7) * 43758.5453; return v - Math.floor(v); }
function noise2(x, y){ // smooth value noise, 0..1
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => noise2(x, y) * .6 + noise2(x * 2.1 + 13, y * 2.1 + 7) * .3 + noise2(x * 4.3 + 3, y * 4.3 + 19) * .1;
function flick(t, s){ return 0.5 + 0.22*Math.sin(t*13.1 + s) + 0.18*Math.sin(t*7.3 + s*1.7) + 0.1*Math.sin(t*23.7 + s*3.1); }
const DIR8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function wrap(text, w){
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (!line) line = word;
      else if ((line + ' ' + word).length <= w) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}

// camera (in tiles, float) — set by the game every frame
let CX = 0, CY = 0;

// world zoom: the map is drawn ZOOM× larger, so fewer tiles fit the view (HUD/dialogue unaffected)
const ZOOM = 1.25, WVW = VW / ZOOM, WVH = VH / ZOOM;
