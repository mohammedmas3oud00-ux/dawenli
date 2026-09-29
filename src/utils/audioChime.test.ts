import { afterEach, describe, expect, it, vi } from 'vitest';
import { playFocusSound, stopAdhanSound } from './audioChime';

function makeAudioContextSpy() {
  interface OscSpy {
    type: string;
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }
  const nodes: OscSpy[] = [];
  const ctx = {
    currentTime: 100,
    destination: {},
    createOscillator: () => {
      const osc: OscSpy = {
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      const gain = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      nodes.push(osc);
      return { ...osc, connect: vi.fn(() => gain) };
    },
    createGain: () => {
      const gain = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      return gain;
    },
  };
  function AudioContextClass() {
    return ctx;
  }
  return { AudioContextClass, nodes };
}

function AudioClass(audio: Record<string, unknown>) {
  return audio;
}

describe('audio chime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    stopAdhanSound();
  });

  it('synthesizes chimes through the web audio graph', () => {
    const { AudioContextClass, nodes } = makeAudioContextSpy();
    vi.stubGlobal('AudioContext', AudioContextClass);
    playFocusSound('complete');
    expect(nodes).toHaveLength(3);
    expect(nodes[0].frequency.setValueAtTime).toHaveBeenCalledWith(432, 100);
  });

  it('plays distinct tones for start and break cues', () => {
    const { AudioContextClass, nodes } = makeAudioContextSpy();
    vi.stubGlobal('AudioContext', AudioContextClass);
    playFocusSound('start');
    expect(nodes.map((node) => node.frequency.setValueAtTime.mock.calls[0][0])).toEqual([528, 792]);
    nodes.length = 0;
    playFocusSound('break');
    expect(nodes.map((node) => node.frequency.setValueAtTime.mock.calls[0][0])).toEqual([659.25, 523.25]);
  });

  it('plays the adhan audio file and falls back when blocked', async () => {
    const audio = { play: vi.fn().mockRejectedValue(new Error('blocked')), pause: vi.fn(), currentTime: 0 };
    vi.stubGlobal('Audio', AudioClass.bind(null, audio));
    const { AudioContextClass, nodes } = makeAudioContextSpy();
    vi.stubGlobal('AudioContext', AudioContextClass);
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

    playFocusSound('adhan');
    expect(audio.play).toHaveBeenCalledOnce();
    await Promise.resolve();
    await Promise.resolve();
    expect(nodes.some((node) => node.frequency.setValueAtTime.mock.calls[0][0] === 330)).toBe(true);
    expect(debug).toHaveBeenCalled();

    stopAdhanSound();
    expect(audio.pause).toHaveBeenCalledOnce();
  });

  it('skips silently when no audio context exists', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playFocusSound('complete')).not.toThrow();
  });
});
