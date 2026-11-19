// audio.js — all sound is generated in code with WebAudio: no audio files.
// One job: beeps, crashes, a siren and an engine hum, started on first user gesture.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let sirenTimer = 0;
  let sirenHigh = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineGain = ctx.createGain();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 50;
      engineGain.gain.value = 0;
      engineOsc.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
    } catch { ctx = null; }
    return ctx;
  }

  function beep(freq, dur, type, vol) {
    if (muted || !ensure()) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch { /* sound is best-effort */ }
  }

  function noise(dur, vol) {
    if (muted || !ensure()) return;
    try {
      const len = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buffer;
      gain.gain.value = vol || 0.15;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch { /* sound is best-effort */ }
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    toggleMute() { muted = !muted; if (engineGain) engineGain.gain.value = 0; return muted; },
    pickup() { beep(880, 0.12, 'sine', 0.1); setTimeout(() => beep(1320, 0.15, 'sine', 0.1), 90); },
    crash() { noise(0.25, 0.2); beep(90, 0.2, 'sawtooth', 0.12); },
    punch() { noise(0.08, 0.12); },
    mission() { beep(523, 0.15, 'sine', 0.1); setTimeout(() => beep(659, 0.15, 'sine', 0.1), 140); setTimeout(() => beep(784, 0.3, 'sine', 0.1), 280); },
    busted() { beep(220, 0.5, 'sawtooth', 0.12); },
    engine(speed, maxSpeed, driving) {
      if (!engineGain || muted) return;
      const target = driving ? 0.02 + 0.05 * (speed / Math.max(1, maxSpeed)) : 0;
      engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
      engineOsc.frequency.setTargetAtTime(45 + 140 * (speed / Math.max(1, maxSpeed)), ctx.currentTime, 0.1);
    },
    siren(dt, wanted) {
      if (!ensure() || muted || wanted < 1) return;
      sirenTimer -= dt;
      if (sirenTimer <= 0) {
        sirenTimer = 0.45;
        sirenHigh = !sirenHigh;
        beep(sirenHigh ? 700 : 950, 0.4, 'sine', 0.03);
      }
    },
  };
}
