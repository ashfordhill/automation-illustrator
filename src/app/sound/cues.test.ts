import { afterEach, expect, test, vi } from "vitest";
import { playCue, playCueWhen, resetAudioForTests, type CueKind } from "./cues";

afterEach(() => {
  resetAudioForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubAudio() {
  const oscillators: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }> = [];
  class FakeAudioContext {
    currentTime = 0;
    state = "running";
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
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return { oscillators, FakeAudioContext };
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
  const kinds: CueKind[] = ["tick", "blip", "pop", "buzz", "twoNote"];
  for (const kind of kinds) {
    resetAudioForTests();
    const { oscillators } = stubAudio();
    playCue(kind);
    expect(oscillators.length).toBeGreaterThanOrEqual(1);
    expect(oscillators[0]?.start).toHaveBeenCalled();
  }
});
