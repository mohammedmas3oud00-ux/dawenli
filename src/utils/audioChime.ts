/**
 * Clean Web Audio API Chime Synthesizer
 * Produces soothing acoustic sounds (Zen Bell / Tibetan singing bowl / Adhan alert)
 */
let activeAdhanAudio: HTMLAudioElement | null = null;

export function stopAdhanSound() {
  if (activeAdhanAudio) {
    try {
      activeAdhanAudio.pause();
      activeAdhanAudio.currentTime = 0;
    } catch {}
    activeAdhanAudio = null;
  }
}

export function playFocusSound(type: 'complete' | 'break' | 'start' | 'adhan' = 'complete') {
  if (type === 'adhan') {
    // Attempt playing authentic full audible Adhan Takbeer audio file
    try {
      stopAdhanSound();
      const audio = new Audio('/audio/adhan.mp3');
      audio.volume = 0.85;
      activeAdhanAudio = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.debug('HTML5 audio play blocked, falling back to WebAudio synth', err);
          synthesizeSound('adhan');
        });
      }
      return;
    } catch (e) {
      console.debug('Audio file play error, using WebAudio synth fallback', e);
    }
  }

  synthesizeSound(type);
}

function synthesizeSound(type: 'complete' | 'break' | 'start' | 'adhan') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'start') {
      // Soft uplifting double chime
      playTone(ctx, 528, now, 0.4, 0.12); // Solfeggio 528Hz
      playTone(ctx, 792, now + 0.15, 0.6, 0.1);
    } else if (type === 'complete') {
      // Warm gong/bowl chime (Harmonics of 432Hz)
      playTone(ctx, 432, now, 1.8, 0.2);
      playTone(ctx, 864, now + 0.05, 1.4, 0.12);
      playTone(ctx, 1296, now + 0.1, 1.0, 0.08);
    } else if (type === 'adhan') {
      // Melodious Adhan reminder chord sequence (Bayati-inspired peaceful cadence)
      playTone(ctx, 330, now, 1.5, 0.15); // E4
      playTone(ctx, 392, now + 0.3, 1.5, 0.15); // G4
      playTone(ctx, 440, now + 0.6, 1.8, 0.18); // A4
      playTone(ctx, 523.25, now + 1.0, 2.2, 0.15); // C5
      playTone(ctx, 440, now + 1.4, 2.5, 0.2); // A4
    } else {
      // Break reminder: soothing gentle pulse
      playTone(ctx, 659.25, now, 0.8, 0.15); // E5
      playTone(ctx, 523.25, now + 0.2, 1.2, 0.12); // C5
    }
  } catch (err) {
    console.debug('Audio chime skipped', err);
  }
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, maxVolume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(maxVolume, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}
