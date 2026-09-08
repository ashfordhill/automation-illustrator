import { afterEach, expect, test, vi } from "vitest";
import { playCue, playCueWhen, resetAudioForTests, type CueKind } from "./cues";

afterEach(() => {
  resetAudioForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubAudio() {
  const oscillators: Array<{
    type: string;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    frequency: { exponentialRampToValueAtTime: ReturnType<typeof vi.fn> };
  }> = [];
  const buffers: unknown[] = [];
  const filters: Array<{ frequency: { exponentialRampToValueAtTime: ReturnType<typeof vi.fn> } }> =
    [];
  class FakeAudioContext {
    currentTime = 0;
    state = "running";
    sampleRate = 44100;
    destination = {};
    resume = vi.fn(async () => {
      this.state = "running";
    });
    createOscillator() {
      const osc = {
        type: "sine",
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      oscillators.push(osc);
      return osc;
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    createBuffer(channels: number, length: number, sampleRate: number) {
      const buf = {
        numberOfChannels: channels,
        length,
        sampleRate,
        getChannelData: () => new Float32Array(length),
      };
      buffers.push(buf);
      return buf;
    }
    createBufferSource() {
      return {
        buffer: null as unknown,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
    }
    createBiquadFilter() {
      const filter = {
        type: "lowpass",
        Q: { value: 1 },
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      filters.push(filter);
      return filter;
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return { oscillators, buffers, filters, FakeAudioContext };
}

test("playCue is a no-op without Web Audio", () => {
  resetAudioForTests();
  expect(() => playCue("blip")).not.toThrow();
});

test("playCueWhen stays silent when sound is off", () => {
  const { oscillators } = stubAudio();
  playCueWhen(false, "blip");
  expect(oscillators).toHaveLength(0);
});

test("SH-04 cues each start an oscillator at low volume", () => {
  const kinds: CueKind[] = ["tick", "blip", "zip", "pop", "buzz", "twoNote"];
  for (const kind of kinds) {
    resetAudioForTests();
    const { oscillators } = stubAudio();
    playCue(kind);
    expect(oscillators.length).toBeGreaterThanOrEqual(1);
    expect(oscillators[0]?.start).toHaveBeenCalled();
  }
});

test("zip is a rising noise sweep, not the Tile sine blip", () => {
  const zipStub = stubAudio();
  playCue("zip");
  expect(zipStub.buffers).toHaveLength(1);
  expect(zipStub.filters).toHaveLength(1);
  const filterEnd = zipStub.filters[0]?.frequency.exponentialRampToValueAtTime.mock.calls[0]?.[0];
  expect(filterEnd).toBeGreaterThan(1500);
  expect(zipStub.oscillators[0]?.type).toBe("triangle");
  const zipToneEnd =
    zipStub.oscillators[0]?.frequency.exponentialRampToValueAtTime.mock.calls[0]?.[0];
  expect(zipToneEnd).toBeGreaterThan(1000);

  resetAudioForTests();
  const blipStub = stubAudio();
  playCue("blip");
  expect(blipStub.buffers).toHaveLength(0);
  expect(blipStub.oscillators[0]?.type).toBe("sine");
  const blipEnd = blipStub.oscillators[0]?.frequency.exponentialRampToValueAtTime.mock.calls[0]?.[0];
  expect(blipEnd).toBe(720);
  expect(zipToneEnd).toBeGreaterThan(blipEnd as number);
});
