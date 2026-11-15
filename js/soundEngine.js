/**
 * Web Audio API Sound-Engine für dezente, angenehme Fantasy-Klänge.
 */
window.SoundEngine = (function () {
  'use strict';

  const STORAGE_KEY = 'jorvik_mathe_muted';
  let ctx = null;
  let muted = localStorage.getItem(STORAGE_KEY) === 'true';

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function isMuted() {
    return muted;
  }

  function setMuted(val) {
    muted = Boolean(val);
    localStorage.setItem(STORAGE_KEY, String(muted));
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function playTone(freq, startTime, duration, type = 'sine', peakGain = 0.12) {
    const audio = getContext();
    if (!audio || muted) return;

    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  /**
   * Kristall-Klang bei richtiger Antwort
   */
  function playCrystal() {
    const audio = getContext();
    if (!audio || muted) return;
    const now = audio.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      playTone(f, now + i * 0.06, 0.38, 'sine', 0.1);
      playTone(f * 2, now + i * 0.06, 0.25, 'triangle', 0.03);
    });
  }

  /**
   * Sanftes "Plopp" bei zu schneller Eingabe (< 3,5s)
   */
  function playPlopp() {
    const audio = getContext();
    if (!audio || muted) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Sanfter, nicht-strafender Hinweis-Klang bei falscher Antwort
   */
  function playGentleWrong() {
    const audio = getContext();
    if (!audio || muted) return;
    const now = audio.currentTime;
    playTone(293.66, now, 0.22, 'triangle', 0.08);       // D4
    playTone(246.94, now + 0.12, 0.28, 'triangle', 0.07); // B3
  }

  /**
   * Leichter Zauber-Funken beim Zerspringen einer Kachel
   */
  function playTileShatter() {
    const audio = getContext();
    if (!audio || muted) return;
    const now = audio.currentTime;
    [880, 1174.66, 1318.5].forEach((f, i) => {
      playTone(f, now + i * 0.04, 0.22, 'sine', 0.06);
    });
  }

  /**
   * Feierliche Fanfare bei Abschluss (Puzzle, Klassenarbeit oder 20-Min-Quest)
   */
  function playFanfare() {
    const audio = getContext();
    if (!audio || muted) return;
    const now = audio.currentTime;
    const melody = [
      { f: 523.25, t: 0, d: 0.2 },
      { f: 659.25, t: 0.13, d: 0.2 },
      { f: 783.99, t: 0.26, d: 0.2 },
      { f: 1046.5, t: 0.4, d: 0.65 }
    ];
    melody.forEach(n => {
      playTone(n.f, now + n.t, n.d, 'triangle', 0.12);
      playTone(n.f * 1.5, now + n.t, n.d * 0.8, 'sine', 0.04);
    });
  }

  return {
    isMuted,
    setMuted,
    toggleMute,
    playCrystal,
    playPlopp,
    playGentleWrong,
    playTileShatter,
    playFanfare
  };
})();
