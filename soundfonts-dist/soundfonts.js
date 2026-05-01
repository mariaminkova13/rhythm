import { Sampler } from "../node_modules/smplr/dist/index.mjs";

export async function voice() {
     const ac = new window.AudioContext();
     await ac.resume();

     const voice = new Sampler(ac, {
          baseUrl: "./tankman/",
          instrument: "000_TANKMAN.sfz"
     });
     await voice.load;

     voice.start("A4");
}
