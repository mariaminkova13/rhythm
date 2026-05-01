const fs = require("fs");

const notes = fs.readdirSync("./wav").filter(f => f.endsWith(".wav"));

let out = "Soundfont.instrument = {\n";

for (const file of notes) {
     const note = file.replace(".mp3", "");
     const data = fs.readFileSync("./mp3/" + file).toString("base64");
     out += `  "${note}": "data:audio/mp3;base64,${data}",\n`;
}

out += "};\n";

fs.writeFileSync("myInstrument-mp3.js", out);
console.log("Done!");