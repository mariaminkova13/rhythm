import { Soundfont2Sampler } from "../node_modules/smplr/dist/index.mjs"; //TTODO clean
const { SoundFont2 } = require('soundfont2');
var sampler

export async function initVoice() {
     const ctx = new AudioContext();
     sampler = new Soundfont2Sampler(ctx, {
          url: "./soundfonts/miku.sf2",
          createSoundfont: (data) => new SoundFont2(data),
     });
     await sampler.load;
     var instruments = sampler.instrumentNames;
     await sampler.loadInstrument(instruments[0]);
}

export function sing(note, duration) {
     if (note === "0") { return }
     sampler?.start({ note, velocity: 90, duration });
}
