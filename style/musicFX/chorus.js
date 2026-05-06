export function chorusEffect(src) {
     const ctx = new AudioContext();
     const audio = new Audio('../../assets/songAudio/amogus.mp3') //TODO
     // console.log(src)
     //TODO pause pauses alll sound or maybe .connect this to the audio with audioworklet
     // const ctxSource = ctx.createMediaElementSource(audio);
     // detune(500, ctx)
     setTimeout(() => {
          audio.play()
     }, 1000);
}

function detune(cents, ctx) {
     const channelCount = 2;
     const frameCount = ctx.sampleRate * 2.0; // 2 seconds

     const myArrayBuffer = ctx.createBuffer(
          channelCount,
          frameCount,
          ctx.sampleRate,
     );

     for (let channel = 0; channel < channelCount; channel++) {
          const nowBuffering = myArrayBuffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
               nowBuffering[i] = Math.random() * 2 - 1;
          }
     }

     const bufferSource = ctx.createBufferSource();
     bufferSource.buffer = myArrayBuffer;
     bufferSource.connect(ctx.destination);
     bufferSource.detune.value = cents; // value in cents
     bufferSource.start();
}
//TODO make this an audioworklet node?????