// Original synthesised surf: one filtered noise loop, gently rising and falling.
// No recordings, downloads or extra per-frame audio nodes.
export function createSeaAmbience(context) {
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 4,
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 650;
  const swell = context.createGain();
  swell.gain.value = 0.035;
  const tide = context.createOscillator();
  tide.frequency.value = 0.12;
  const depth = context.createGain();
  depth.gain.value = 0.02;
  const output = context.createGain();
  output.gain.value = 0;
  source.connect(filter);
  filter.connect(swell);
  swell.connect(output);
  tide.connect(depth);
  depth.connect(swell.gain);
  output.connect(context.destination);
  source.start();
  tide.start();
  let enabled = false;
  return {
    setEnabled(value) {
      if (value === enabled) return;
      enabled = value;
      output.gain.setTargetAtTime(value ? 1 : 0, context.currentTime, 0.2);
    },
    dispose() {
      source.stop();
      tide.stop();
      for (const node of [source, filter, swell, tide, depth, output])
        node.disconnect();
    },
  };
}
