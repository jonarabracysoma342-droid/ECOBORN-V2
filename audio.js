// Web Audio API Soundscape: Upbeat 125 BPM Chiptune/Indie-Game BGM, Dynamic Nature Ambience, & Creature SFX
(function (global) {
  let ctx = null;
  let enabled = true;
  let started = false;

  let masterBus = null;
  let musicBus = null;
  let ambienceBus = null;
  let sfxBus = null;
  let rainGain = null;
  let noiseBuf = null;
  let isRaining = false;

  function ensureCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();

      masterBus = ctx.createGain();
      musicBus = ctx.createGain();
      ambienceBus = ctx.createGain();
      sfxBus = ctx.createGain();

      masterBus.gain.value = enabled ? 0.92 : 0;
      musicBus.gain.value = 0.62;     // Clear, audible BGM
      ambienceBus.gain.value = 0.45;
      sfxBus.gain.value = 0.85;

      musicBus.connect(masterBus);
      ambienceBus.connect(masterBus);
      sfxBus.connect(masterBus);
      masterBus.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (!started && ctx.state === 'running') {
          started = true;
          startAmbienceAndMusic();
        }
      }).catch(() => {});
    } else if (!started && ctx.state === 'running') {
      started = true;
      startAmbienceAndMusic();
    }
    return ctx;
  }

  function randPitch(base, pct = 0.06) {
    return base * (1 + (Math.random() * 2 - 1) * pct);
  }

  function tone(freq, duration, type = 'triangle', gainVal = 0.14, delay = 0, bus = null) {
    const audio = ensureCtx();
    if (!audio || !enabled || !freq) return;
    const targetBus = bus || sfxBus;
    const now = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(targetBus);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Punchy synth kick & crisp hi-hat for upbeat groove
  function playKick(delay = 0) {
    if (!ctx || !enabled) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(g);
    g.connect(musicBus);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  function playHat(accent = false) {
    if (!ctx || !enabled || !noiseBuf) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5500;
    const g = ctx.createGain();
    const dur = accent ? 0.065 : 0.035;
    g.gain.setValueAtTime(accent ? 0.09 : 0.045, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(hp);
    hp.connect(g);
    g.connect(musicBus);
    src.start(now, Math.random() * 1.5, dur);
  }

  function startAmbienceAndMusic() {
    if (!ctx) return;

    // 1. Noise Buffer for Ambience & Percussion
    const bufSize = ctx.sampleRate * 3;
    noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const out = noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.04;
      b1 = 0.96 * b1 + white * 0.06;
      b2 = 0.85 * b2 + white * 0.10;
      out[i] = (b0 + b1 + b2 + white * 0.18) * 0.35;
    }

    // Rain Shower Layer (fades in when Awan Hujan is active)
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = noiseBuf;
    rainSrc.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1350;
    rainFilter.Q.value = 0.7;
    rainGain = ctx.createGain();
    rainGain.gain.value = isRaining ? 0.28 : 0.0001;
    rainSrc.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(ambienceBus);
    rainSrc.start();

    // 2. Load & loop studio-synthesized stereo acoustic WAV soundtrack (assets/audio/meadow_bgm.wav)
    fetch('assets/audio/meadow_bgm.wav?v=1')
      .then((res) => res.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((audioBuffer) => {
        const bgmSrc = ctx.createBufferSource();
        bgmSrc.buffer = audioBuffer;
        bgmSrc.loop = true;
        bgmSrc.connect(musicBus);
        bgmSrc.start(0);
      })
      .catch(() => {});

    // Occasional cheerful meadow bird chirp in ambience bus
    setInterval(() => {
      if (!ctx || !enabled || ctx.state !== 'running') return;
      if (Math.random() < 0.65) playBirdChirp();
    }, 3400);
  }

  function playBirdChirp() {
    const audio = ensureCtx();
    if (!audio || !enabled) return;
    const now = audio.currentTime;
    const base = randPitch(2100, 0.1);
    [0, 0.1].forEach((offset, i) => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * (i === 0 ? 1 : 1.2), now + offset);
      osc.frequency.exponentialRampToValueAtTime(base * 1.38, now + offset + 0.07);
      g.gain.setValueAtTime(0.001, now + offset);
      g.gain.linearRampToValueAtTime(0.055, now + offset + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.085);
      osc.connect(g);
      g.connect(ambienceBus);
      osc.start(now + offset);
      osc.stop(now + offset + 0.095);
    });
  }

  global.EcoAudio = {
    unlock() {
      ensureCtx();
    },
    setEnabled(val) {
      enabled = Boolean(val);
      ensureCtx();
      if (masterBus && ctx) {
        masterBus.gain.setTargetAtTime(enabled ? 0.92 : 0, ctx.currentTime, 0.05);
      }
    },
    isEnabled() {
      return enabled;
    },
    setRaining(active) {
      if (isRaining === active) return;
      isRaining = active;
      if (rainGain && ctx) {
        rainGain.gain.setTargetAtTime(active ? 0.28 : 0.0001, ctx.currentTime, 0.3);
      }
    },
    playDrop() {
      tone(randPitch(380), 0.08, 'triangle', 0.14, 0);
      tone(randPitch(570), 0.11, 'sine', 0.12, 0.04);
    },
    playPickup() {
      tone(randPitch(480, 0.08), 0.06, 'sine', 0.12, 0);
      tone(randPitch(680, 0.08), 0.08, 'triangle', 0.12, 0.04);
    },
    playMerge() {
      tone(115, 0.32, 'sawtooth', 0.08, 0);
      tone(320, 0.12, 'sine', 0.13, 0.02);
      tone(480, 0.14, 'triangle', 0.13, 0.08);
      tone(720, 0.18, 'sine', 0.12, 0.14);
    },
    playEat(type) {
      if (type === 'hopper') {
        tone(randPitch(740, 0.1), 0.05, 'triangle', 0.11, 0);
        tone(randPitch(880, 0.1), 0.05, 'triangle', 0.11, 0.06);
      } else if (type === 'frog') {
        tone(randPitch(250, 0.08), 0.08, 'sawtooth', 0.09, 0);
        tone(randPitch(390, 0.08), 0.1, 'triangle', 0.11, 0.05);
      } else if (type === 'snake') {
        tone(randPitch(330, 0.08), 0.07, 'sawtooth', 0.10, 0);
        tone(randPitch(230, 0.08), 0.1, 'sine', 0.10, 0.04);
      } else if (type === 'eagle') {
        tone(randPitch(1400, 0.06), 0.12, 'triangle', 0.11, 0);
        tone(randPitch(1120, 0.06), 0.16, 'sine', 0.10, 0.07);
      }
    },
    playCoin() {
      tone(randPitch(880, 0.03), 0.08, 'sine', 0.12, 0);
      tone(randPitch(1175, 0.03), 0.14, 'sine', 0.13, 0.06);
    },
    playUnlock() {
      tone(523.25, 0.1, 'triangle', 0.14, 0);
      tone(659.25, 0.1, 'triangle', 0.14, 0.08);
      tone(783.99, 0.2, 'triangle', 0.15, 0.16);
    },
    playError() {
      tone(190, 0.12, 'sawtooth', 0.09, 0);
      tone(150, 0.15, 'sawtooth', 0.09, 0.08);
    },
    pauseAll() {
      if (ctx && ctx.state === 'running') {
        ctx.suspend().catch(() => {});
      }
    },
    resumeAll() {
      if (enabled && ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    }
  };

  ['pointerdown', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, () => ensureCtx(), { passive: true });
  });
})(window);
