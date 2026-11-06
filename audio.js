'use strict';
// =====================================================================
//  Audio: SID-flavoured synth + lofi music (all generated, no samples)
// =====================================================================
const Snd = (() => {
  let ac = null, out, music, musicIn, echoIn, revIn, sfx, noiseB, mode = 0, nextT = 0, step = 0, loop = 0;
  let musicLP, amb = null, ambState = {rain:0, wind:0, lava:0, swamp:0, indoor:0, gust:0}, musicTone = {f:4800, duck:1};
  const last = {};
  const BPM = 76, STEP = 60 / BPM / 4;
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  const can = (k, ms) => { const t = performance.now(); if (last[k] && t - last[k] < ms) return false; last[k] = t; return true; };
  const on = () => ac && mode < 2;

  function buf(sec, fill, ch = 1){
    const b = ac.createBuffer(ch, Math.floor(ac.sampleRate * sec), ac.sampleRate);
    for (let c = 0; c < ch; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = fill(i, d.length); }
    return b;
  }

  function start(ctx){
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC && !ctx) return;
    ac = ctx || new AC();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ac.destination);
    out = ac.createGain(); out.gain.value = .9; out.connect(comp);
    noiseB = buf(2, () => Math.random() * 2 - 1);

    // reverb
    const rev = ac.createConvolver(); rev.buffer = buf(2.6, (i, n) => (Math.random()*2-1) * Math.pow(1 - i/n, 2.4), 2);
    revIn = ac.createGain(); revIn.gain.value = .3; revIn.connect(rev); rev.connect(out);

    // music bus: parts -> musicIn -> tape wobble -> warm lowpass -> music (volume) -> out
    musicIn = ac.createGain();
    const wob = ac.createDelay(.05); wob.delayTime.value = .015;
    const lfo = ac.createOscillator(); lfo.frequency.value = .37;
    const lfoG = ac.createGain(); lfoG.gain.value = .0016; lfo.connect(lfoG); lfoG.connect(wob.delayTime); lfo.start();
    const flut = ac.createOscillator(); flut.frequency.value = 5.3;
    const flutG = ac.createGain(); flutG.gain.value = .00012; flut.connect(flutG); flutG.connect(wob.delayTime); flut.start();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4800; lp.Q.value = .4; musicLP = lp;
    const hs = ac.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 6000; hs.gain.value = -5;
    music = ac.createGain(); music.gain.value = 0;
    musicIn.connect(wob); wob.connect(lp); lp.connect(hs); hs.connect(music); music.connect(out);
    const mrev = ac.createGain(); mrev.gain.value = .55; music.connect(mrev); mrev.connect(revIn);
    // dotted-8th echo
    echoIn = ac.createGain();
    const echo = ac.createDelay(2); echo.delayTime.value = STEP * 3;
    const ef = ac.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 1700;
    const fb = ac.createGain(); fb.gain.value = .38;
    echoIn.connect(echo); echo.connect(ef); ef.connect(fb); fb.connect(echo); ef.connect(musicIn);
    // vinyl crackle + hiss
    const vin = ac.createBufferSource();
    vin.buffer = buf(5, () => (Math.random() < .00035 ? (Math.random()*2-1) * .8 : 0) + (Math.random()*2-1) * .006);
    vin.loop = true;
    const vhp = ac.createBiquadFilter(); vhp.type = 'highpass'; vhp.frequency.value = 900;
    const vg = ac.createGain(); vg.gain.value = .35;
    vin.connect(vhp); vhp.connect(vg); vg.connect(music); vin.start();

    sfx = ac.createGain(); sfx.gain.value = .6; sfx.connect(out);
    const srev = ac.createGain(); srev.gain.value = .35; sfx.connect(srev); srev.connect(revIn);

    // ---- weather / place ambience (continuous loops, gains driven by the game)
    const loopNoise = () => { const n = ac.createBufferSource(); n.buffer = noiseB; n.loop = true; n.start(0, Math.random()*1.5); return n; };
    const ambOut = ac.createGain(); ambOut.gain.value = 1;
    const ambLP = ac.createBiquadFilter(); ambLP.type = 'lowpass'; ambLP.frequency.value = 9000;
    ambOut.connect(ambLP); ambLP.connect(sfx);
    const rainG = ac.createGain(); rainG.gain.value = 0;
    { const n = loopNoise(), bp = ac.createBiquadFilter(), hp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = .4; hp.type = 'highpass'; hp.frequency.value = 500;
      n.connect(bp); bp.connect(hp); hp.connect(rainG); rainG.connect(ambOut); }
    const windG = ac.createGain(); windG.gain.value = 0;
    const windF = ac.createBiquadFilter(); windF.type = 'bandpass'; windF.frequency.value = 400; windF.Q.value = 3;
    { const n = loopNoise(); n.playbackRate.value = .5; n.connect(windF); windF.connect(windG); windG.connect(ambOut); }
    const lavaG = ac.createGain(); lavaG.gain.value = 0;
    { const n = loopNoise(), lp2 = ac.createBiquadFilter(); n.playbackRate.value = .3; lp2.type = 'lowpass'; lp2.frequency.value = 110; lp2.Q.value = 2;
      n.connect(lp2); lp2.connect(lavaG); lavaG.connect(ambOut); }
    amb = {rainG, windG, windF, lavaG, ambLP};

    applyMode();
    nextT = ac.currentTime + .1;
    if (!ctx) setInterval(tick, 25);
  }
  // test hook: render N seconds of music offline, return the buffer
  function _offline(sec){
    const oc = new OfflineAudioContext(2, 44100 * sec, 44100);
    start(oc); loop = 1;
    while (nextT < sec) { playStep(step, nextT); nextT += STEP; step++; }
    return oc.startRendering();
  }

  function applyMode(){
    if (!ac) return;
    const t = ac.currentTime;
    music.gain.cancelScheduledValues(t); music.gain.setValueAtTime(music.gain.value, t);
    music.gain.linearRampToValueAtTime(mode === 0 ? .95 * musicTone.duck : 0, t + (mode === 0 ? 3 : .3));
    sfx.gain.setTargetAtTime(mode < 2 ? .6 : 0, t, .05);
  }
  function cycle(){ start(); mode = (mode + 1) % 3; applyMode(); }
  // called every frame by the game with smoothed 0..1 values
  function ambient(o){
    ambState = o;
    if (!amb) return;
    const t = ac.currentTime, k = .25;
    amb.rainG.gain.setTargetAtTime(o.rain * .22, t, k);
    amb.windG.gain.setTargetAtTime(o.wind * (.16 + .2 * o.gust), t, k);
    amb.windF.frequency.setTargetAtTime(260 + 900 * o.gust * o.wind, t, .4);
    amb.lavaG.gain.setTargetAtTime(o.lava * .5, t, .6);
    amb.ambLP.frequency.setTargetAtTime(o.indoor ? 700 : 9000, t, .3);
  }
  // music colour per place + ducking while someone is talking
  function tone2(f, duck){
    if (!ac || (musicTone.f === f && musicTone.duck === duck)) return;
    musicTone = {f, duck};
    musicLP.frequency.setTargetAtTime(f, ac.currentTime, .8);
    if (mode === 0) music.gain.setTargetAtTime(.95 * duck, ac.currentTime, .5);
  }
  const label = () => ['♪ ON', '♪ FX', '♪ OFF'][mode];

  // ---- one voice: osc/pulse/noise -> optional filter -> ADSR gain -> bus (+echo, +reverb)
  function tone(o){
    const t = o.t ?? ac.currentTime, a = o.a ?? .004, d = o.d ?? .08, s = o.s ?? 0, r = o.r ?? .08;
    const dur = o.dur ?? (a + d), vol = o.vol ?? .2, f = o.f ?? 440;
    const end = t + Math.max(dur, a) + r * 5 + .05;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setTargetAtTime(vol * s, t + a, Math.max(.001, d / 3));
    g.gain.setTargetAtTime(0, t + Math.max(dur, a + .001), Math.max(.001, r / 3));
    let head;
    const setF = p => { p.setValueAtTime(f, t); if (o.f2) p.exponentialRampToValueAtTime(o.f2, t + (o.slide ?? dur)); };
    const vib = p => { if (!o.vib) return; const l = ac.createOscillator(); l.frequency.value = 5.2;
      const lg = ac.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * o.vib, t + .25);
      l.connect(lg); lg.connect(p); l.start(t); l.stop(end); };
    if (o.type === 'noise') {
      const src = ac.createBufferSource(); src.buffer = noiseB; src.loop = true;
      src.playbackRate.setValueAtTime(o.rate ?? 1, t);
      if (o.rate2) src.playbackRate.exponentialRampToValueAtTime(o.rate2, t + dur);
      src.start(t, Math.random() * 1.5); src.stop(end); head = src;
    } else if (o.type === 'pulse') {
      // SID-style pulse: saw minus delayed saw; delay = duty * period (PWM via LFO on delay)
      const osc = ac.createOscillator(); osc.type = 'sawtooth'; setF(osc.frequency); vib(osc.frequency);
      const duty = o.duty ?? .25, dl = ac.createDelay(.1); dl.delayTime.value = duty / f;
      const inv = ac.createGain(); inv.gain.value = -1;
      const sum = ac.createGain(); sum.gain.value = .5;
      osc.connect(sum); osc.connect(dl); dl.connect(inv); inv.connect(sum);
      if (o.pwm) { const l = ac.createOscillator(); l.frequency.value = o.pwm; const lg = ac.createGain();
        lg.gain.value = duty * .7 / f; l.connect(lg); lg.connect(dl.delayTime); l.start(t); l.stop(end); }
      osc.start(t); osc.stop(end); head = sum;
    } else {
      const osc = ac.createOscillator(); osc.type = o.type || 'triangle'; setF(osc.frequency); vib(osc.frequency);
      if (o.detune) osc.detune.value = o.detune;
      osc.start(t); osc.stop(end); head = osc;
    }
    if (o.filt) {
      const fl = ac.createBiquadFilter(); fl.type = o.filt; fl.Q.value = o.q ?? .7;
      fl.frequency.setValueAtTime(o.f0 ?? 1000, t);
      if (o.f1) fl.frequency.exponentialRampToValueAtTime(o.f1, t + (o.fdur ?? dur));
      head.connect(fl); head = fl;
    }
    head.connect(g);
    g.connect(o.bus || sfx);
    if (o.echo) { const e = ac.createGain(); e.gain.value = o.echo; g.connect(e); e.connect(echoIn); }
    if (o.rev) { const e = ac.createGain(); e.gain.value = o.rev; g.connect(e); e.connect(revIn); }
  }
  const arp = (notes, gap, base) => notes.forEach((n, i) => tone({...base, f: n, t: ac.currentTime + i * gap}));

  // ---- music ----
  // 8-bar loop: Dm9  G13  Cmaj9  Am9 | Fmaj9  Em7  Dm9  E7(b9)
  const CH = [
    {b:38, n:[53,57,60,64]}, {b:43, n:[53,59,64,69]}, {b:36, n:[52,55,59,62]}, {b:45, n:[55,60,64,71]},
    {b:41, n:[57,60,64,67]}, {b:40, n:[55,59,62,67]}, {b:38, n:[53,57,60,64]}, {b:40, n:[56,59,62,65]},
  ];
  // a fixed, hand-shaped melody (bar, step, midi, length-in-steps)
  const MEL = [
    [0,0,76,3],[0,3,74,2],[0,6,72,2],[0,10,69,4],
    [1,2,71,2],[1,4,74,3],[1,8,76,6],
    [2,0,79,2],[2,3,76,3],[2,7,74,2],[2,10,71,5],
    [3,4,72,2],[3,6,71,2],[3,8,69,7],
    [4,0,72,3],[4,3,76,2],[4,6,79,3],[4,10,81,4],
    [5,2,79,2],[5,4,76,3],[5,8,74,5],
    [6,0,72,2],[6,2,74,2],[6,4,76,4],[6,10,77,4],
    [7,0,76,3],[7,4,74,3],[7,8,71,7],
  ];
  const melAt = {}; MEL.forEach(([b, s, n, l]) => melAt[b*16 + s] = [n, l]);

  function playStep(st, t){
    const bar = (st >> 4) % 8, s = st % 16, ch = CH[bar];
    const sw = (s % 2) ? STEP * .3 : 0;
    const T = t + sw + (Math.random() - .5) * .006;
    const M = musicIn;
    if (s === 0 && bar === 0 && st > 0) loop++;

    // pad: soft detuned PWM pulses
    if (s === 0) ch.n.forEach((n, i) => {
      tone({bus:M, type:'pulse', f:mtof(n), duty:.3, pwm:.21 + i*.07, t:T + i*.012, a:.5, d:1, s:.8, dur:STEP*15, r:.9,
            vol:.05, filt:'lowpass', f0:900, f1:1800, fdur:STEP*8, q:.5});
    });
    // SID-ish arpeggio sparkle (from 2nd loop)
    if (loop >= 1 && s % 2 === 0) {
      const seq = [0,1,2,3,2,1,0,2];
      tone({bus:M, type:'triangle', f:mtof(ch.n[seq[(s/2) % 8]] + 12), t:T, a:.003, d:.12, dur:.05, r:.12, vol:.055, echo:.6});
    }
    // bass
    const BASS = {0:[0,1], 3:[0,.45], 7:[7,.7], 10:[0,.9], 14:[12,.6]};
    if (BASS[s]) { const [iv, v] = BASS[s];
      tone({bus:M, type:'pulse', f:mtof(ch.b + iv), duty:.4, t:T, a:.006, d:.25, s:.35, dur:STEP*2.2, r:.12, vol:.11*v,
            filt:'lowpass', f0:900, f1:260, fdur:.25, q:2}); }
    // drums (boom-bap, soft)
    if (s === 0 || s === 7 || s === 10) {
      tone({bus:M, type:'sine', f:115, f2:42, slide:.12, t:T, a:.002, d:.28, dur:.05, r:.1, vol:s ? .2 : .27});
      tone({bus:M, type:'noise', rate:.5, filt:'lowpass', f0:900, t:T, a:.001, d:.02, vol:.06});
    }
    if (s === 4 || s === 12) {
      tone({bus:M, type:'noise', rate:.8, filt:'bandpass', f0:1900, q:.8, t:T + .008, a:.002, d:.16, vol:.2, rev:.4});
      tone({bus:M, type:'triangle', f:190, f2:150, slide:.08, t:T + .008, a:.002, d:.08, vol:.1});
    }
    if (s % 2 === 0 || Math.random() < .2) {
      const open = s === 14 && bar % 2 === 1;
      tone({bus:M, type:'noise', rate:1.3, filt:'highpass', f0:7500, t:T, a:.001, d:open ? .22 : .035,
            vol:(s % 4 === 2 ? .09 : .055) * (.75 + Math.random()*.4)});
    }
    // lead melody: plays on loops 1,2 then rests a loop, repeat
    if (loop % 3 !== 0 && melAt[bar*16 + s]) {
      const [n, l] = melAt[bar*16 + s];
      tone({bus:M, type:'pulse', f:mtof(n), duty:.125, pwm:.8, t:T, a:.02, d:.3, s:.6, dur:STEP*l*.9, r:.25, vol:.11,
            vib:.007, filt:'lowpass', f0:2600, q:.7, echo:.5});
    }
    // little fill at the end of every 8 bars
    if (bar === 7 && s === 15)
      tone({bus:M, type:'noise', rate:.7, filt:'bandpass', f0:1200, f1:3000, q:1.2, t:T, a:.04, d:.1, dur:STEP, vol:.06});
  }
  function ambientStep(t){
    const A = ambState;
    if (A.swamp > .2) {
      if (Math.random() < .05 * A.swamp) for (let k = 0; k < 3; k++)
        tone({type:'triangle', f:4100 + Math.random()*300, t:t + k*.05, a:.002, d:.03, vol:.018 * A.swamp});
      if (Math.random() < .012 * A.swamp) croakAt(t, .7);
    }
    if (A.rain > .3 && !A.indoor && Math.random() < .25 * A.rain)
      tone({type:'sine', f:1800 + Math.random()*2200, f2:900, slide:.03, t:t + Math.random()*STEP, a:.001, d:.025, vol:.02 * A.rain});
    if (A.lava > .2 && Math.random() < .06 * A.lava)
      tone({type:'sine', f:120 + Math.random()*80, f2:420, slide:.06, t, a:.004, d:.09, vol:.07 * A.lava});
  }
  function croakAt(t, v = 1){
    for (let k = 0; k < 2; k++) tone({type:'pulse', duty:.2, pwm:30, f:95 + Math.random()*20, t:t + k*.13, a:.01, d:.09, s:.5, dur:.08, r:.05,
      vol:.06 * v, filt:'lowpass', f0:900, f1:300, q:5});
  }
  function tick(){
    if (!ac) return;
    if (nextT < ac.currentTime - .5) nextT = ac.currentTime + .05; // tab was asleep
    while (nextT < ac.currentTime + .2) {
      if (mode === 0) playStep(step, nextT);
      if (mode < 2) ambientStep(nextT);
      nextT += STEP; step++;
    }
  }

  // ---- sound effects ----
  const R = (a, b) => a + Math.random() * (b - a);
  const fx = {
    step(key){ if (!on() || !can('step', 40)) return;
      if (key === 'WATER') tone({type:'noise', rate:.45, filt:'bandpass', f0:R(800,1100), f1:350, q:1.4, a:.01, d:.18, vol:.12});
      else if (key === 'GRASS') tone({type:'noise', rate:1, filt:'highpass', f0:R(2500,3500), a:.01, d:.07, vol:.05});
      else if (key === 'ICE') { tone({type:'triangle', f:R(1700,2100), d:.05, vol:.03}); tone({type:'noise', filt:'highpass', f0:5000, d:.03, vol:.04}); }
      else tone({type:'noise', rate:.55, filt:'lowpass', f0:R(900,1400), a:.002, d:.035, vol:.07}); },
    swing(){ if (on() && can('swing', 40)) tone({type:'noise', rate:1.2, filt:'bandpass', f0:900, f1:3200, q:1.5, a:.02, d:.06, dur:.07, vol:.08}); },
    hit(pl){ if (!on() || !can('hit' + pl, 30)) return;
      if (pl) { tone({type:'pulse', duty:.5, f:120, f2:50, slide:.15, d:.18, vol:.22}); tone({type:'noise', rate:.4, filt:'lowpass', f0:1200, d:.1, vol:.15}); }
      else { tone({type:'square', f:R(300,360), f2:110, slide:.08, d:.09, vol:.08}); tone({type:'noise', rate:.9, d:.04, vol:.1}); } },
    death(){ if (on() && can('death', 50)) { arp([523,392,262,131].map(f => f * R(.97,1.03)), .04, {type:'pulse', duty:.125, d:.07, vol:.08});
      tone({type:'noise', rate:.6, filt:'lowpass', f0:2000, f1:200, d:.3, vol:.1}); } },
    door(){ if (on() && can('door', 80)) tone({type:'sawtooth', f:85, f2:135, slide:.25, a:.03, d:.3, dur:.3, vol:.07, filt:'lowpass', f0:700, q:4}); },
    coin(){ if (on() && can('coin', 60)) { tone({type:'pulse', duty:.25, f:988, d:.06, dur:.06, vol:.08});
      tone({type:'pulse', duty:.25, f:1319, t:ac.currentTime + .07, a:.002, d:.35, vol:.08, echo:.4}); } },
    potion(){ if (on()) arp([523,659,784,1047,1319], .05, {type:'triangle', d:.14, vol:.08, echo:.3}); },
    scroll(){ if (on()) arp([784,988,1175,1568,1976], .06, {type:'pulse', duty:.2, pwm:3, d:.25, vol:.05, echo:.5, rev:.5}); },
    select(k){ if (!on()) return; const f = {1:1568, 2:880, 3:1319}[k] || 1000;
      tone({type:'pulse', duty:.25, f, d:.04, vol:.06}); tone({type:'pulse', duty:.25, f:f*1.5, t:ac.currentTime + .045, d:.06, vol:.05}); },
    blip(){ if (on()) tone({type:'triangle', f:1046, d:.04, vol:.05}); },
    cancel(){ if (on()) tone({type:'triangle', f:660, f2:330, slide:.08, d:.09, vol:.06}); },
    error(){ if (on()) { tone({type:'pulse', duty:.5, f:196, d:.05, dur:.05, vol:.08}); tone({type:'pulse', duty:.5, f:185, t:ac.currentTime + .09, d:.07, vol:.08}); } },
    bump(){ if (on() && can('bump', 90)) tone({type:'sine', f:110, f2:60, slide:.06, d:.07, vol:.14}); },
    zap(){ if (!on()) return; const t = ac.currentTime;
      tone({type:'noise', rate:1, filt:'highpass', f0:1200, a:.002, d:.35, vol:.32, rev:.4});
      tone({type:'sawtooth', f:2200, f2:70, slide:.35, a:.002, d:.35, vol:.1});
      tone({type:'pulse', duty:.1, f:55, a:.002, d:.3, vol:.14});
      for (let k = 0; k < 7; k++) tone({type:'noise', rate:1.5, filt:'highpass', f0:3000, t:t + R(.02, .4), a:.001, d:.015, vol:R(.1,.25)}); },
    electrify(){ if (!on()) return; const t = ac.currentTime;
      tone({type:'pulse', duty:.3, pwm:23, f:58, a:.01, d:.5, s:.4, dur:.55, r:.2, vol:.13, filt:'lowpass', f0:2500, f1:400});
      for (let k = 0; k < 12; k++) tone({type:'noise', rate:1.3, filt:'bandpass', f0:R(2000,5000), q:2, t:t + R(0,.7), a:.001, d:.02, vol:R(.06,.16)}); },
    whoosh(){ if (on()) tone({type:'noise', rate:.7, filt:'bandpass', f0:350, f1:2600, q:1.6, a:.08, d:.2, dur:.3, vol:.22}); },
    boom(){ if (!on()) return;
      tone({type:'noise', rate:.35, filt:'lowpass', f0:1400, f1:120, a:.003, d:.7, vol:.45, rev:.5});
      tone({type:'sine', f:90, f2:32, slide:.4, a:.003, d:.45, vol:.45}); },
    frost(){ if (!on()) return; arp([2093,1760,1568,1319,1175,1047], .028, {type:'triangle', d:.18, vol:.05, echo:.5});
      tone({type:'noise', rate:1.4, filt:'highpass', f0:8000, f1:3000, a:.05, d:.3, dur:.3, vol:.08}); },
    freeze(){ if (!on()) return; tone({type:'noise', rate:1.5, filt:'highpass', f0:4500, a:.005, d:.45, vol:.12, rev:.6});
      tone({type:'triangle', f:2637, d:.5, vol:.04, echo:.6}); tone({type:'triangle', f:3136, t:ac.currentTime + .06, d:.5, vol:.03, echo:.6}); },
    shatter(){ if (!on()) return; const t = ac.currentTime;
      for (let k = 0; k < 8; k++) tone({type:'triangle', f:R(2000,4200), t:t + R(0,.2), a:.001, d:.06, vol:.04});
      tone({type:'noise', rate:1.5, filt:'highpass', f0:3500, a:.001, d:.25, vol:.18}); },
    sizzle(){ if (on() && can('sizzle', 160)) tone({type:'noise', rate:1.3, filt:'highpass', f0:3200, a:.03, d:.3, dur:.35, r:.25, s:.4, vol:.07}); },
    alert(){ if (on() && can('alert', 400)) { tone({type:'pulse', duty:.25, f:659, d:.07, dur:.07, vol:.06});
      tone({type:'pulse', duty:.25, f:988, t:ac.currentTime + .08, d:.12, vol:.06}); } },
    crackle(n){ if (!on() || !n) return; const t = ac.currentTime;
      for (let k = 0; k < Math.min(6, 1 + n / 6); k++) tone({type:'noise', rate:1.2, filt:'highpass', f0:R(1500,4000), t:t + R(0,.5), a:.001, d:R(.008,.03), vol:R(.04,.12)}); },
    talk(c, kind){ if (!on()) return;
      if (kind === 'gonzo') { tone({type:'noise', rate:1.6, filt:'highpass', f0:2600 + (c % 5) * 300, a:.001, d:.018, vol:.09}); tone({type:'square', f:110 + (c % 3) * 9, a:.001, d:.02, vol:.02}); return; }
      if (kind === 'echo') tone({type:'triangle', f:330 + (c % 9) * 22, a:.004, d:.05, dur:.04, vol:.03, rev:.8, echo:.0});
      else tone({type:'pulse', duty:.32, f:150 + (c % 7) * 13, a:.004, d:.05, s:.3, dur:.045, r:.03, vol:.07, filt:'lowpass', f0:1300, q:1}); },
    thunder(){ if (!on()) return; const t = ac.currentTime;
      tone({type:'noise', rate:1.2, filt:'highpass', f0:1500, t, a:.002, d:.15, vol:.25});
      tone({type:'noise', rate:.18, filt:'lowpass', f0:500, f1:70, fdur:2.2, t:t + .05, a:.05, d:2.4, vol:.75, rev:.6});
      tone({type:'sine', f:55, f2:30, slide:1.5, t:t + .05, a:.05, d:1.8, vol:.3}); },
    croak(){ if (on() && can('croak', 300)) croakAt(ac.currentTime, 1.4); },
    howl(){ if (on() && can('howl', 1500)) tone({type:'sawtooth', f:330, f2:520, slide:.5, a:.25, d:1.2, s:.6, dur:1, r:.5, vol:.06, vib:.02, filt:'lowpass', f0:1400, q:2, rev:.8}); },
    blup(){ if (on() && can('blup', 180)) tone({type:'sine', f:180 + Math.random()*120, f2:700, slide:.06, a:.004, d:.08, vol:.05}); },
    whip(){ if (!on() || !can('whip', 40)) return;
      tone({type:'noise', rate:1.4, filt:'bandpass', f0:600, f1:5000, fdur:.12, q:2, a:.03, d:.06, dur:.12, vol:.13});
      tone({type:'square', f:900, f2:2400, slide:.1, t:ac.currentTime + .1, a:.002, d:.05, vol:.04}); },
    slam(){ if (on() && can('slam', 60)) { tone({type:'sine', f:80, f2:35, slide:.2, a:.002, d:.3, vol:.4}); tone({type:'noise', rate:.4, filt:'lowpass', f0:800, d:.2, vol:.2}); } },
    tongue(){ if (on() && can('tongue', 60)) tone({type:'triangle', f:260, f2:1100, slide:.12, a:.005, d:.14, vol:.08}); },
    zone(){ if (on()) arp([392, 523, 659], .12, {type:'triangle', d:.6, vol:.035, echo:.6, rev:.6}); },
    page(){ if (on()) tone({type:'triangle', f:784, d:.05, vol:.035}); },
    win(){ if (!on()) return; arp([523,659,784,1047,1319,1568], .09, {type:'pulse', duty:.25, pwm:2, d:.35, vol:.08, echo:.5}); },
    gameover(){ if (!on()) return; arp([392,330,262,196,131], .22, {type:'pulse', duty:.4, a:.01, d:.4, vol:.1, filt:'lowpass', f0:1500, f1:300, echo:.4}); },
  };
  return {start, cycle, label, ambient, tone2, _offline, ...fx};
})();

