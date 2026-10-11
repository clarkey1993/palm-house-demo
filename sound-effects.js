// Original, quiet Web Audio cues; no downloaded audio or network dependency.
export function createSoundEffects(context) {
  const voices = new Set();
  const last = new Map();
  let enabled = false;
  let quietCashUntil = 0;
  let noise;
  function voice(source, volume, start, duration, filter) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    if (filter) {
      source.connect(filter);
      filter.connect(gain);
    } else source.connect(gain);
    gain.connect(context.destination);
    const entry = { source, gain, filter };
    voices.add(entry);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      filter?.disconnect();
      voices.delete(entry);
    };
    source.start(start);
    source.stop(start + duration + 0.02);
  }
  function tone(hz, volume, delay, duration) {
    const source = context.createOscillator();
    source.type = "sine";
    source.frequency.value = hz;
    voice(source, volume, context.currentTime + delay, duration);
  }
  return {
    setEnabled(value) {
      enabled = value;
      if (!value) {
        for (const { source, gain } of voices) {
          gain.gain.cancelScheduledValues(context.currentTime);
          gain.gain.setValueAtTime(0, context.currentTime);
          source.stop();
        }
      }
    },
    play(kind) {
      if (!enabled || context.state !== "running") return false;
      const cash = ["collect", "runnerCollect", "spend"].includes(kind);
      const key = cash ? "cash" : kind;
      const cooldown = { cash: 0.32, checkin: 0.55, clean: 0.85, build: 0.7 }[
        key
      ];
      if (cooldown === undefined) return false;
      const now = context.currentTime;
      if (cash && now < quietCashUntil) return false;
      if (now - (last.get(key) ?? -Infinity) < cooldown) return false;
      // Limit overlapping tails even in a busy, fully staffed hotel.
      if (voices.size > 12) return false;
      last.set(key, now);
      if (!cash) quietCashUntil = now + 0.45;
      if (kind === "build") {
        [523.25, 659.25, 783.99].forEach((hz, i) =>
          tone(hz, 0.027, i * 0.09, 0.32),
        );
        tone(1046.5, 0.012, 0.27, 0.38);
      } else if (kind === "checkin") {
        tone(659.25, 0.024, 0, 0.25);
        tone(987.77, 0.013, 0.075, 0.24);
      } else if (kind === "clean") {
        if (!noise) {
          noise = context.createBuffer(
            1,
            Math.ceil(context.sampleRate * 0.3),
            context.sampleRate,
          );
          const data = noise.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        const source = context.createBufferSource();
        source.buffer = noise;
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(550, now + 0.25);
        voice(source, 0.045, now, 0.28, filter);
        tone(783.99, 0.014, 0.12, 0.24);
        tone(1046.5, 0.009, 0.21, 0.25);
      } else {
        tone(
          kind === "spend" ? 440 : 1174.66,
          kind === "runnerCollect" ? 0.006 : 0.011,
          0,
          0.09,
        );
      }
      return true;
    },
  };
}
