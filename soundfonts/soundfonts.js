export async function voice() {
     const audioContext = new window.AudioContext()
     let voice;

     console.log('voice')

     Soundfont.instrument(audioContext, 'lala', { soundfont: './tankman soundfont sfz/samples/TANKMAN - 20.wav' })
          .then(function (instrument) {
               voice = instrument;
               console.log("SoundFont loaded!");
          })
          .catch(function (err) {
               console.error("Error loading SoundFont:", err);
          });

     if (voice) {
          voice.play('C4', audioContext.currentTime, { duration: 2 });
     } else {
          console.log("SoundFont not loaded yet.");
     }
}