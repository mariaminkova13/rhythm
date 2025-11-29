export { readNotemap };

async function readNotemap(filePath) {
  try {
    const response = await fetch(filePath);
    const text = await response.text();

    // Parse the file
    const headMatch = text.match(/<([\s\S]*?)>/);
    const bodyMatch = text.match(/\[([\s\S]*?)\]/);

    const head = {};
    const body = [];

    // Parse head
    if (headMatch) {
      const headLines = headMatch[1].trim().split("\n");
      headLines.forEach((line) => {
        const [key, value] = line.split(":").map((s) => s.trim());
        if (key && value) {
          // Convert to appropriate types
          if (value == true) head[key] = true;
          else if (value == false) head[key] = false;
          else if (!isNaN(value)) head[key] = Number(value);
          else head[key] = value;
        }
      });
    } else {
      //return error
    }

    // Parse body
    if (bodyMatch) {
      const bodyLines = bodyMatch[1].trim().split("\n");
      bodyLines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) {
          body.push(trimmed);
        }
      });
    } else {
      //return error
    }

    return { head, body };
  } catch (error) {
    console.error("Error reading notemap:", error);
    return null;
  }
}

// const keys = {
//     Cdorian: [C4, D, Eb, F, G, A, Bb, C5], //default
//     Cphrygian: [C4, Db, Eb, F, G, Ab, Bb, C5],
//     Clydian: [C4, D, E, Gb, G, A, B, C5],
// }

// //frequencies in hertz https://muted.io/note-frequencies
// //Technically Lydian has F# and not Gb, but who cares lol I dont wan't to figure out how to define each notes sharp and the next one's flat in the same line. Also javascript doesn't like the sharp symbol
// const frequencies = {
//     C4: 261.63,
//     Db: 277.18,
//     D: 293.66,
//     Eb: 311.13,
//     E: 329.63,
//     F: 349.23,
//     Gb: 369.99,
//     G: 392,
//     Ab: 415.3,
//     A: 440,
//     Bb: 466.16,
//     B: 493.88,
//     C5: 523.25,
// }
