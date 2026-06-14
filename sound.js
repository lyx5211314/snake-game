// Bulletproof Web Audio API sound engine
// AudioContext created on first user gesture only
'use strict';
let audioCtx = null;
let _on = true;

function initCtx() {
  if (!audioCtx) {
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function beep(freq, dur, type, vol, slide, slideDir) {
  if (!_on || !audioCtx || audioCtx.state !== 'running') return;
  type = type || 'square';
  vol = (vol || 0.15);
  slide = slide || 0;
  slideDir = slideDir || 1;
  var t = audioCtx.currentTime;
  var o = audioCtx.createOscillator();
  var g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide * slideDir, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur);
}

var Sfx = {
  init: initCtx,
  eat: function() {
    beep(700, 0.05, 'square', 0.12);
    setTimeout(function(){ beep(1000, 0.06, 'square', 0.1); }, 30);
  },
  death: function() {
    beep(300, 0.15, 'sawtooth', 0.15, -250, -1);
    setTimeout(function(){ beep(150, 0.25, 'sawtooth', 0.12, -120, -1); }, 120);
    setTimeout(function(){ beep(80, 0.35, 'sawtooth', 0.1, -60, -1); }, 280);
  },
  record: function() {
    beep(523, 0.07, 'square', 0.12);
    setTimeout(function(){ beep(659, 0.07, 'square', 0.11); }, 70);
    setTimeout(function(){ beep(784, 0.08, 'square', 0.1); }, 140);
    setTimeout(function(){ beep(1047, 0.1, 'square', 0.09); }, 210);
  },
  start: function() {
    beep(440, 0.06, 'sine', 0.1);
    setTimeout(function(){ beep(660, 0.08, 'sine', 0.08); }, 50);
  },
  pause: function() { beep(200, 0.12, 'triangle', 0.08); },
  resume: function() { beep(300, 0.1, 'triangle', 0.08); }
};

window.Sfx = Sfx;
window.toggleSound = function() { _on = !_on; return _on; };
window.isSoundOn = function() { return _on; };
