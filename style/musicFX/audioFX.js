export { muffleAudio, visualizeAudio }
import { chorusEffect } from './chorus.js'
import { addReverb } from './reverb.js';

async function muffleAudio(audio) {
     const ctx = new AudioContext();
     const src = ctx.createMediaElementSource(audio);

     const lowpass = ctx.createBiquadFilter();
     lowpass.type = "highshelf";
     lowpass.frequency.value = 500;
     lowpass.gain.value = -20;

     // await ctx.audioWorklet.addModule("style/musicFX/bitcrusher.js");
     // const crusher = new AudioWorkletNode(ctx, "bitcrusher-processor", {});

     const reverb = addReverb(ctx)

     // src.connect(bassBoost).connect(lowpass).connect(quiet).connect(crusher).connect(ctx.destination);
     src.connect(lowpass).connect(reverb.input).connect(ctx.destination);
}

// async function bassBoost(audio){
//      const ctx = new AudioContext();
//      const src = ctx.createMediaElementSource(audio);
//      const bassBoost = ctx.createBiquadFilter();
//      bassBoost.type = "lowshelf";
//      bassBoost.frequency.value = 175;
//      bassBoost.gain.value = 25;
//      src.connect(bassBoost).connect(ctx.destination)
// }

async function visualizeAudio(audio) {
     const ctx = new AudioContext();
     const src = ctx.createMediaElementSource(audio);

     const bassBoost = ctx.createBiquadFilter();
     bassBoost.type = "lowshelf";
     bassBoost.frequency.value = 175;
     bassBoost.gain.value = 25;
     src.connect(bassBoost).connect(ctx.destination)

     // await ctx.audioWorklet.addModule('style/musicFX/chorus.js');
     // const chorus = new AudioWorkletNode(ctx, "chorus-processor")
     const compressor = ctx.createDynamicsCompressor();
     src.connect(compressor).connect(ctx.destination)
     // chorusEffect(audio.src)

     const analyser = ctx.createAnalyser();
     src.connect(analyser).connect(ctx.destination);

     const bufferLength = analyser.frequencyBinCount;
     const dataArray = new Uint8Array(bufferLength);
     analyser.getByteTimeDomainData(dataArray);

     const canvas = document.getElementById('wave-canvas')
     const canvasCtx = canvas.getContext('2d')

     canvasCtx.lineWidth = 1;
     canvasCtx.strokeStyle = "rgb(0 0 0)";

     function draw() {
          requestAnimationFrame(() => { setTimeout(draw, 5); });
          analyser.getByteTimeDomainData(dataArray);

          // Begin the path
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCtx.beginPath();
          // Draw each point in the waveform
          const sliceWidth = canvas.width / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
               const v = dataArray[i] / 128.0;
               const y = v * (canvas.height / 2);

               if (i === 0) {
                    canvasCtx.moveTo(x, y);
               } else {
                    canvasCtx.lineTo(x, y);
               }

               x += sliceWidth;
          }

          // Finish the line
          canvasCtx.lineTo(canvas.width, canvas.height / 2);
          canvasCtx.stroke();
     }

     draw();
}