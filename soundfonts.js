// import Soundfont2Sampler from 'smplr';
const { Soundfont2Sampler } = require('smplr');
const { SoundFont2 } = require('soundfont2');
var sampler

export async function initVoice() {
     const ctx = new AudioContext();
     sampler = new Soundfont2Sampler(ctx, {
          url: "./assets/soundfonts/miku.sf2",
          createSoundfont: (data) => new SoundFont2(data),
     });
     await sampler.load;
     var instruments = sampler.instrumentNames;
     await sampler.loadInstrument(instruments[0]);

     const gainNode = ctx.createGain();
     gainNode.gain.value = 8;
     sampler.output.addEffect("volume", gainNode, 1);
     gainNode.connect(ctx.destination);
}

export function sing(note, duration) {
     if (note === "X") { return }
     sampler?.start({ note, velocity: 80, duration });
}
