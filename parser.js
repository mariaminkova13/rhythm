export { parseNotemap, parseSplashTexts, readNotemap }
import { handleBeat, noteStartingPosition, handleNote } from "./song.js";

async function parseNotemap(filePath) {
     try {
          const response = await fetch(filePath);
          const text = await response.text();

          // split on 3+ dashes
          const parts = text.split(/^-{3,}$/m);
          const headMatch = parts[0] ? parts[0].trim() : null;
          const bodyMatch = parts[1] ? parts[1].trim() : null;

          const head = {},
               body = [];

          // Parse head
          if (headMatch) {
               const headLines = headMatch.split("\n");
               headLines.forEach((line) => {
                    const [key, value] = line.split(":").map((s) => s.trim());
                    if (key && value) {
                         // Convert to appropriate types
                         if (value == true || value === "true") head[key] = true;
                         else if (value == false || value === "false") head[key] = false;
                         else if (!isNaN(value)) head[key] = Number(value);
                         else head[key] = value;
                    }
               });
          } else {
               throw new Error("header not found, check syntax");
          }

          // Parse body
          if (bodyMatch) {
               const bodyLines = bodyMatch.split("\n");
               bodyLines.forEach((line) => {
                    const trimmed = line.trim();
                    if (trimmed) {
                         body.push(trimmed);
                    }
               });
          } else {
               throw new Error("body not found, check syntax");
          }

          return { head, body };
     } catch (error) {
          console.error("Error reading notemap:", error);
          return null;
     }
}

async function readNotemap(data, linesCounter, laneList) {
     var chart = []
     for (const line of data.body) {
          chart.push(line.split(" "))
     }
     //console.log(chart)
     for (let j = 0; j < chart.length; j++) {
          const newBeat = document.createElement("beat");
          handleBeat(newBeat, linesCounter, document.querySelector('hitline').getBoundingClientRect().bottom);

          const lineParsed = chart[j]

          for (let i = 0; i < Math.min(lineParsed.length, laneList.length); i++) {
               if (lineParsed[i] != ".") {
                    const newNote = document.createElement("note");
                    newNote.style.top = noteStartingPosition + "px";
                    if (lineParsed[i].includes("H")) {
                         if (lineParsed[i].includes("(") && lineParsed[i].includes(")")) {
                              if (chart[j + 1][i].includes("H" == false)) { console.warn('syntax error'); return }
                              newNote.setAttribute('pitch', lineParsed[i].replace("H", "").replace("(", "").replace(")", ""))
                              newNote.style.background = "red"
                              console.log('first')
                         }
                         // if (j != 0 && chart[j - 1][i].includes("H")) { console.log('YESS') }
                         else if (j == chart.length - 1 || chart[j + 1][i].includes("H") == false) {
                              if (chart[j - 1][i].includes("H") == false) { console.warn('hold note starts should contain parentheses'); return }
                              console.log('last')
                              newNote.style.background = "green"
                         }
                         else {
                              if (chart[j + 1][i].includes("H") == false || chart[j - 1][i].includes("H") == false) { console.warn('error'); return }
                              console.log('middle')
                              newNote.style.background = "blue"
                         }
                    }
                    else {
                         newNote.setAttribute('pitch', lineParsed[i])
                    }
                    laneList[i].appendChild(newNote);
                    handleNote(newNote);
               }
          }

          // Wait for the first note in this line to complete its delay before creating the next line
          await new Promise(resolve => {
               newBeat.addEventListener('noteDelayDone', resolve, { once: true });
          });

          linesCounter++;
     }
}

async function parseSplashTexts() {
     const response = await (await fetch('markup/splashes.txt')).text();
     return response.split("\n")
}