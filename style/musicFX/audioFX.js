export async function audioFX(audio) {
     const ctx = new AudioContext();
     const src = ctx.createMediaElementSource(audio);

     const canvas = document.getElementById('wave-canvas')
     const canvasCtx = canvas.getContext('2d')

     await audioFilter(ctx, src);
     visualizeAudio(ctx, src, canvasCtx, canvas);
}

async function audioFilter(ctx, src) {
     // Low-pass filter
     const lowpass = ctx.createBiquadFilter();
     lowpass.type = "lowpass";
     lowpass.frequency.value = 1500;

     const lowshelf = ctx.createBiquadFilter();
     lowshelf.type = "lowshelf";
     lowshelf.frequency.value = 165;

     // Bitcrusher node
     await ctx.audioWorklet.addModule("style/musicFX/bitcrusher.js");
     const crusher = new AudioWorkletNode(ctx, "bitcrusher-processor", {});
     src.connect(lowpass).connect(crusher).connect(lowshelf).connect(ctx.destination);
}

function visualizeAudio(ctx, src, canvasCtx, canvas) {
     const analyser = ctx.createAnalyser();
     src.connect(analyser).connect(ctx.destination);

     const bufferLength = analyser.frequencyBinCount;
     const dataArray = new Uint8Array(bufferLength);
     analyser.getByteTimeDomainData(dataArray);

     function draw() {
          requestAnimationFrame(() => draw());
          analyser.getByteTimeDomainData(dataArray);

          // Begin the path
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCtx.lineWidth = 1;
          canvasCtx.strokeStyle = "rgb(0 0 0)";
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
} //TODO fade out visualizer wave when music quiet