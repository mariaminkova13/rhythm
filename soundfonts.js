const { Soundfont2Sampler } = require('smplr');
const { SoundFont2 } = require('soundfont2');
import { voicePath } from './MenuFX.js';
export { initVoice, sing }
var sampler

async function initVoice() {
     const ctx = new AudioContext();
     sampler = new Soundfont2Sampler(ctx, {
          url: voicePath,
          createSoundfont: (data) => new SoundFont2(data),
     });
     await sampler.load;
     var instruments = sampler.instrumentNames;
     await sampler.loadInstrument(instruments[0]);

     const gainNode = ctx.createGain();
     gainNode.gain.value = 1.2;
     sampler.output.addEffect("volume", gainNode, 1);
     gainNode.connect(ctx.destination);
}

function sing(note, duration) {
     if (note === "X") { return }
     sampler?.start({ note, velocity: 80, duration });
}