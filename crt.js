'use strict';
// =====================================================================
//  CRT (WebGL)
// =====================================================================
const VS = `attribute vec2 p; varying vec2 v; void main(){ v = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;
const FS_PERSIST = `precision mediump float; varying vec2 v;
uniform sampler2D uScene, uPrev; uniform float uDecay;
void main(){ vec3 s = texture2D(uScene, v).rgb; vec3 p = texture2D(uPrev, v).rgb * uDecay - 2.0/255.0;
  gl_FragColor = vec4(max(s, p), 1.); }`;
const FS_CRT = `precision mediump float; varying vec2 v;
uniform sampler2D uImg, uBloom; uniform vec2 uSrc, uBl, uShake; uniform float uTime, uMono; uniform vec3 uTint;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
vec2 curve(vec2 uv){ uv = uv*2.-1.; vec2 o = abs(uv.yx) / vec2(5.5, 4.5); uv += uv*o*o; return uv*.5+.5; }
vec3 bl(vec2 uv, float r){ vec2 d = r/uBl; vec3 s = vec3(0.);
  s += texture2D(uBloom, uv + vec2( d.x, 0.)).rgb; s += texture2D(uBloom, uv + vec2(-d.x, 0.)).rgb;
  s += texture2D(uBloom, uv + vec2(0.,  d.y)).rgb; s += texture2D(uBloom, uv + vec2(0., -d.y)).rgb;
  s += texture2D(uBloom, uv + d*.7).rgb; s += texture2D(uBloom, uv - d*.7).rgb;
  s += texture2D(uBloom, uv + vec2(d.x,-d.y)*.7).rgb; s += texture2D(uBloom, uv + vec2(-d.x,d.y)*.7).rgb;
  return s / 8.; }
void main(){
  vec2 uv = curve(v);
  vec2 q = uv; uv += uShake;
  if (q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }
  float ca = 1.1 / uSrc.x;
  vec3 c = vec3(texture2D(uImg, uv + vec2(ca, 0.)).r, texture2D(uImg, uv).g, texture2D(uImg, uv - vec2(ca, 0.)).b);
  vec3 b = texture2D(uBloom, uv).rgb * .35 + bl(uv, 1.5) * .45 + bl(uv, 4.) * .45;
  c += b * 1.25;
  float l = dot(c, vec3(.299, .587, .114));
  c = mix(c, uTint * l * 1.3, uMono);
  float sl = .5 + .5*cos(uv.y * uSrc.y * 3.14159265);
  c *= .7 + .3*sl;
  float m = mod(gl_FragCoord.x, 3.);
  c *= m < 1. ? vec3(1., .88, .88) : m < 2. ? vec3(.88, 1., .88) : vec3(.88, .88, 1.);
  float roll = exp(-pow((fract(uTime*.06) - (1.-uv.y)) * 9., 2.));
  c += roll * .035 * mix(vec3(.7,1.,.8), uTint, uMono);
  c += (hash(uv*uSrc + fract(uTime)*91.7) - .5) * .045;
  c *= .975 + .025*sin(uTime*110.);
  c += mix(vec3(.018,.026,.02), uTint*.025, uMono);
  vec2 w = q*(1.-q.yx); float vig = pow(clamp(w.x*w.y*18., 0., 1.), .28);
  gl_FragColor = vec4(c * vig, 1.);
}`;

let gl = null, G = {};
function initGL(){
  const g = out.getContext('webgl', {antialias:false, alpha:false});
  if (!g) return null;
  const sh = (t, s) => { const o = g.createShader(t); g.shaderSource(o, s); g.compileShader(o);
    if (!g.getShaderParameter(o, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(o)); return o; };
  const prog = fs => { const p = g.createProgram(); g.attachShader(p, sh(g.VERTEX_SHADER, VS)); g.attachShader(p, sh(g.FRAGMENT_SHADER, fs));
    g.bindAttribLocation(p, 0, 'p'); g.linkProgram(p); if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p)); return p; };
  const tex = (w, h) => { const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    [g.TEXTURE_MIN_FILTER, g.TEXTURE_MAG_FILTER].forEach(k => g.texParameteri(g.TEXTURE_2D, k, g.LINEAR));
    [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach(k => g.texParameteri(g.TEXTURE_2D, k, g.CLAMP_TO_EDGE));
    if (w) g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null); return t; };
  G.pP = prog(FS_PERSIST); G.pC = prog(FS_CRT);
  G.tScene = tex(); G.tBloom = tex();
  G.tP = [tex(SW, SH), tex(SW, SH)];
  G.fb = G.tP.map(t => { const f = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, f);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0); return f; });
  g.bindFramebuffer(g.FRAMEBUFFER, null);
  const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), g.STATIC_DRAW);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
  G.u = p => n => g.getUniformLocation(p, n);
  G.cur = 0;
  return g;
}
try { gl = initGL(); } catch (err) { console.error(err); gl = null; }
const octx = gl ? null : out.getContext('2d');
const hasFilter = 'filter' in bctx;

function present(t, dt){
  bctx.globalCompositeOperation = 'copy';
  if (hasFilter) bctx.filter = 'blur(2px)';
  bctx.drawImage(scene, 0, 0, BW, BH);
  if (hasFilter) bctx.filter = 'none';
  if (!gl) { octx.drawImage(scene, 0, 0, out.width, out.height); octx.globalCompositeOperation = 'lighter'; octx.globalAlpha = .6;
             octx.drawImage(bloomC, 0, 0, out.width, out.height); octx.globalAlpha = 1; octx.globalCompositeOperation = 'source-over'; return; }
  const g = gl;
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, G.tScene);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, scene);
  g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, G.tBloom);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, bloomC);

  // phosphor persistence
  const w = G.cur, r = 1 - G.cur;
  g.bindFramebuffer(g.FRAMEBUFFER, G.fb[w]); g.viewport(0, 0, SW, SH);
  g.useProgram(G.pP); let U = G.u(G.pP);
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, G.tScene);
  g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, G.tP[r]);
  g.uniform1i(U('uScene'), 0); g.uniform1i(U('uPrev'), 1);
  g.uniform1f(U('uDecay'), Math.min(.8, Math.pow(.5, dt / .05)));
  g.drawArrays(g.TRIANGLES, 0, 3);

  // CRT
  g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, out.width, out.height);
  g.useProgram(G.pC); U = G.u(G.pC);
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, G.tP[w]);
  g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, G.tBloom);
  g.uniform1i(U('uImg'), 0); g.uniform1i(U('uBloom'), 1);
  g.uniform2f(U('uSrc'), SW, SH); g.uniform2f(U('uBl'), BW, BH);
  g.uniform2f(U('uShake'), (rnd()-.5) * shakeAmp / SW, (rnd()-.5) * shakeAmp / SH);
  g.uniform1f(U('uTime'), t);
  const ph = PHOS[phosphor];
  g.uniform1f(U('uMono'), ph.mono); g.uniform3f(U('uTint'), ...ph.tint);
  g.drawArrays(g.TRIANGLES, 0, 3);
  G.cur = r;
}

function resize(){
  const aspect = SW / SH;
  let w = innerWidth * .92, h = w / aspect;
  if (h > innerHeight * .9) { h = innerHeight * .9; w = h * aspect; }
  const dpr = Math.min(devicePixelRatio || 1, 2);
  out.style.width = w + 'px'; out.style.height = h + 'px';
  out.width = Math.round(w * dpr); out.height = Math.round(h * dpr);
}
addEventListener('resize', resize);

