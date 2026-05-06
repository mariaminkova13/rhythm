export { muffleAudio, visualizeAudio }
import { chorusEffect } from './chorus.js'

async function muffleAudio(audio) {
     const ctx = new AudioContext();
     const src = ctx.createMediaElementSource(audio);

     const lowpass = ctx.createBiquadFilter();
     lowpass.type = "highshelf";
     lowpass.frequency.value = 1200;
     lowpass.gain.value = 0.2;

     const bassBoost = ctx.createBiquadFilter();
     bassBoost.type = "lowshelf";
     bassBoost.frequency.value = 165;
     bassBoost.gain.value = 2;

     const quiet = ctx.createGain();
     quiet.gain.value = 0.7;

     await ctx.audioWorklet.addModule("style/musicFX/bitcrusher.js");
     const crusher = new AudioWorkletNode(ctx, "bitcrusher-processor", {});

     src.connect(bassBoost).connect(lowpass).connect(quiet).connect(crusher).connect(ctx.destination);
}

async function visualizeAudio(audio) {
     const ctx = new AudioContext();
     const src = ctx.createMediaElementSource(audio);

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