export { songSetup, handleNote, note };
import { unpause, pause, countdown, paused, showDeathMsg } from "./modals.js";

const avg = data => {
  if (data.length < 1) {
    return;
  }
  return data.reduce((prev, current) => prev + current) / data.length;
};

function median(array) {
  var concat = array;
  concat = concat.sort(
    function (a, b) { return a - b });
  var length = concat.length;
  if (length % 2 == 1) {
    return concat[(length / 2) - .5]

  }
  else {
    return (concat[length / 2]
      + concat[(length / 2) - 1]) / 2;
  }
}

const note = document.createElement("note");
const difficulties = ["relaxed", "normal", "hard", "brutal"];

  var hp = 100,
  difficulty = "normal",
  hitcommenttimeout = 1000;

var missHpCost = 5,
  badMissHpCost = 15,
  forgotNoteCost = 7,
  minHeal = 13,
  maxHeal = 30,
  perfectThreshold = 8,
  hitThreshold = 40,
  shitThreshold = 80;

var missCount = 0,
  hitCount = 0,
  shitCount = 0,
  perfectCount = 0,
  hitResult = null;

var earlyOrLate = null;

var noteStepSize = 1;
var noteSpacingPx;
var noteSpeedFrequency = 60;
const noteStartingPosition = -10;
var hitAccuracy = [];

const perfectSound = new Audio("sfx/perfect.wav"),
  badmissSound = new Audio("sfx/badmiss.mp3"),
  hitSound = new Audio("sfx/hit.wav"),
  shitSound = new Audio("sfx/shit.wav");

let Slane, Dlane, Flane, spacelane, Jlane, Klane, Llane;

async function parseNotemap(filePath) {
  try {
    const response = await fetch(filePath);
    const text = await response.text();

    // Parse the file - split on 3+ dashes
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
      throw new Error("header not found, check your syntax");
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
      throw new Error("body not found, check your syntax");
    }

    return { head, body };
  } catch (error) {
    console.error("Error reading notemap:", error);
    return null;
  }
}

async function createNotes(data) {
  let laneList = [];
  Array.from(document.querySelectorAll("track")).forEach((element) =>
    (laneList.push(element))
  );

  for (const line of data.body) {
    const notesInLine = [];

    for (let i = 0; i < Math.min(line.length, laneList.length); i++) {
      if (line[i] === "0") {
        const newNote = document.createElement("note");
        newNote.style.top = noteStartingPosition + "px";
        laneList[i].appendChild(newNote);
        handleNote(newNote);
        notesInLine.push(newNote);
      }
    }

    // Wait for the first note in this line to complete its delay before creating the next line
    if (notesInLine.length > 0) {
      await new Promise(resolve => {
        notesInLine[0].addEventListener('noteDelayDone', resolve, { once: true });
      });
    }
  }
}

//TODO add transition time for ticks if low bpm

function handleNote(noteElement) {
  let eventTriggered = false,
    distanceMoved = 0;
  // Move the note down the track
  // Get --bottompadding CSS variable and convert to pixels
  noteElement.setAttribute("aria-active", "true");
  // const containerHeight = getComputedStyle(document.notecontainer)
  //   .getPropertyValue("height")
  //   .trim();
  // const bottomPaddingPixels =
  //   (parseFloat(bottomPaddingValue) * window.innerHeight) / 100; // Convert vh to pixels
  // Calculate starting position: -(100vh - bottompadding) = bottompadding - 100vh
  let position = noteStartingPosition;
  const startPosition = position;
  const fallInterval = setInterval(() => {

    if (paused) {
      return;
    }

    position += noteStepSize;
    distanceMoved = position - startPosition;
    noteElement.style.top = position + "px";

    // Trigger event when note has moved noteSpacingPx
    if (!eventTriggered && distanceMoved >= noteSpacingPx) {
      eventTriggered = true;
      noteElement.dispatchEvent(new CustomEvent('noteDelayDone', { detail: { distance: distanceMoved } }));
    }

    // Delete the note when it goes offscreen
    if (position > window.innerHeight) {
      clearInterval(fallInterval);
      if (noteElement.getAttribute("aria-active") === "true") {
        console.log("Note offscreen, completely missed");
        badmissSound.play();
        earlyOrLate = "late.";
        createHitComment("miss!");
        hp -= forgotNoteCost;
        missCount++;
        updatehp();
      }
      noteElement.remove();
    } //TODO: make aria-active aither preset or not present rather than boolean??????
  }, 1000 / noteSpeedFrequency);
}

function createHitComment(msg) {
  if (hitResult && hitResult.distance > 0) {
    earlyOrLate = "early";
  }
  else if (hitResult && hitResult.distance === 0) {
    earlyOrLate = "exact!!!"
  }
  else if (hitResult) {
    earlyOrLate = "late";
  }
  document.querySelectorAll("hitcomment").forEach(el => el.remove());
  const newHitComment = document.createElement("hitcomment"),
    container = document.querySelector("notecontainer");
  newHitComment.textContent = msg;
  container.appendChild(newHitComment);
  newHitComment.style.setProperty("--after-hitcomment", `"${earlyOrLate}"`);
  setTimeout(() => newHitComment.remove(), hitcommenttimeout);
}

//TODO: make hitcomments appear for each lane individually eg robeats for higher difficulty

function updatehp() {
  document.documentElement.style.setProperty(
    "--pulsespeed",
    //linear interpolation
    0.1 + hp * 0.007 + "s"
  );
  document.documentElement.style.setProperty("--hp", hp + "%");
  console.log("HP updated to:", hp + "%");
  if (difficulty != "relaxed") {
    if (hp > 100) {
      hp == 100;
    }
  }
  if (hp <= 0) {
    showDeathMsg();
  }
}

function songSetup(songFilePath) {

  function checkHit(laneId) {
    // const lane = document.getElementById(laneId);
    const lanenotes = laneId.querySelectorAll('note[aria-active="true"]');

    // console.log(`Lane: ${laneId}, Notes found: ${lanenotes.length}`, lanenotes);

    if (lanenotes.length === 0) {
      return null;
    }

    // Get the tick's center position (bottom of lane)
    const laneRect = laneId.getBoundingClientRect(),
      tickCenterY = laneRect.bottom - (laneRect.height / 2);

    let closestNote = null,
      closestDistance = Infinity;

    // Find the closest note to the tick
    lanenotes.forEach((note) => {
      const noteRect = note.getBoundingClientRect();
      const noteCenterY = noteRect.top + (noteRect.height / 2);
      const distance = noteCenterY - tickCenterY;
      const absoluteDistance = Math.abs(distance)

      if (absoluteDistance < closestDistance) {
        closestDistance = absoluteDistance;
        closestNote = note;
      }
    });

    return {
      note: closestNote,
      distance: closestDistance,
    };
  }

  fetch("markup/song.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("allthestuff").innerHTML = html;

      // Initialize lane elements after HTML is loaded

      const rightHand = document.createElement("ticksection"),
        leftHand = document.createElement("ticksection"),
        hitline = document.querySelector("hitline");
      Dlane = document.createElement("tick");
      Flane = document.createElement("tick");
      Jlane = document.createElement("tick");
      Klane = document.createElement("tick");

      parseNotemap(songFilePath).then((data) => {
        const accuracyDiv = document.getElementById("accuracyDiv");

        const bps = data.head.bpm / 60;
        // console.log(bps);
        const speed = ((1000 / noteSpeedFrequency) * noteStepSize);
        noteSpacingPx = 100;
        console.log("frequency: " + noteSpeedFrequency)
        // noteSpacingPx = speed / bps;

        hitline.appendChild(leftHand);
        leftHand.appendChild(Dlane);
        leftHand.appendChild(Flane);
        if (data.head.centerLane == true) {
          const centerHand = document.createElement("ticksection");
          hitline.appendChild(centerHand);
          spacelane = document.createElement("tick");
          centerHand.appendChild(spacelane);
          spacelane.id = "spacelane";
        }
        hitline.appendChild(rightHand);
        rightHand.appendChild(Jlane);
        rightHand.appendChild(Klane);
        if (data.head.sixLanes == true) {
          Slane = document.createElement("tick");
          leftHand.insertBefore(Slane, Dlane);
          Llane = document.createElement("tick");
          rightHand.appendChild(Llane);
        }

        document.querySelectorAll("tick").forEach((tick) => {
          tick.appendChild(document.createElement("track"));
        });

        // Move code that depends on lanes here

        tickEventListeners();
        countdown();

        createNotes(data);
      });
    });

  function tickEventListeners() {
    // Setup pause modal buttons

    // Build keymap with actual lane elements
    let keymap = new Map();
    if (Slane) keymap.set(Slane, ["Digit1", "KeyS"]);
    keymap.set(Dlane, ["Digit2", "KeyD", "ArrowLeft"]);
    keymap.set(Flane, ["Digit3", "KeyF", "ArrowDown"]);
    if (spacelane) keymap.set(spacelane, ["Space"]);
    keymap.set(Jlane, ["Digit4", "KeyJ", "ArrowUp"]);
    keymap.set(Klane, ["Digit5", "KeyK", "ArrowRight"]);
    if (Llane) keymap.set(Llane, ["Digit6", "KeyL"]);

    if (difficulty === "relaxed") {
      missHpCost = 0;
      badMissHpCost = 0;
    } else if (difficulty === "hard") {

    }

    // Event listeners - optimized using keymap
    document.addEventListener("keydown", (event) => {
      // Ignore repeated keydown events from holding the key
      if (event.repeat) {
        return;
      }

      // Loop through each lane in the keymap
      for (const [lane, keys] of keymap) {
        // Check if the pressed key matches any key for this lane
        if (keys.includes(event.code)) {
          lane.setAttribute("aria-pressed", "true");

          hitResult = checkHit(lane);
          if (hitResult) {
            const absoluteDistance = hitResult.distance;

            console.log(
              `Lane ${lane || 'unknown'}: Closest note is ${absoluteDistance.toFixed(
                2
              )} pixels away`
            );

            // hit evaluation
            hitAccuracy.push(absoluteDistance);
            accuracyDiv.textContent = Math.round(median(hitAccuracy));

            if (absoluteDistance <= perfectThreshold) {
              console.log("perfect");
              perfectSound.play();
              createHitComment("perfect!");
              hp += Math.random() * (maxHeal - minHeal) + minHeal;
              hitResult.note.setAttribute("aria-active", "false");
              perfectCount++;
            } else if (absoluteDistance <= hitThreshold) {
              console.log("hit");
              hitSound.play();
              hitResult.note.setAttribute("aria-active", "false");
              hitCount++;
            } else if (absoluteDistance <= shitThreshold) {
              console.log("shit");
              createHitComment("ok");
              shitSound.play();
              hitResult.note.setAttribute("aria-active", "false");
              shitCount++;
            } else {
              console.log("miss");
              badmissSound.play();
              createHitComment("miss");
              hp -= missHpCost;
              if (absoluteDistance <= 200) {
                hitResult.note.setAttribute("aria-active", "false");
              }
              missCount++;
            }
          } else {
            console.log("No note present");
            badmissSound.play();
            createHitComment("miss!");
            hp -= badMissHpCost;
            missCount++;
            updatehp();
          }
          updatehp();

          break; // Exit loop once we find a match
        }
      }
    });

    // remove 'pressed' on keyup
    document.addEventListener("keyup", (event) => {
      for (const [lane, keys] of keymap) {
        if (keys.includes(event.code)) {
          lane.setAttribute("aria-pressed", "false");
          break;
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || event.key === "Enter") {
        if (paused) {
          unpause();
        } else {
          pause();
        }
      }
    });

    updatehp();

    let grades = {
      F: "You Suck",
      D: "Bruh",
      C: "Meh",
      //mid and decent, phi is godlike
      B: "Nice",
      A: "Sick",
    };
    const lettergrade = document.querySelector("lettergrade");
    const plusminus = document.querySelector("plusminus");

    function checkForFC() {
      if ((missCount = 0)) {
        lettergrade.innerText = "β";
        plusminus.innerText = "-";
        if ((shitCount = 0)) {
          plusminus.innerText = "";
          if ((hitCount = 0)) {
            plusminus.innerText = "+";
          }
        }
      }
    }
  }
}
