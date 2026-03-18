export { songSetup, handleNote, note, beatLength };
import { unpause, pause, countdown, paused, showDeathMsg } from "./modals.js";
import { avg, median } from "./index.js"
import anime from "/node_modules/animejs/lib/anime.es.js";

//TODO when bpm 20 notes too close together, tweak adaptiveness factor.
//TODO make it start with the first beat already there to allow for song intro

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
  hitResult = null,
  earlyOrLate = null;

var noteSpacingPx, noteStepSize, bps, beatLength;
var fps = 60;
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

  var linesCounter = 0;
  const hitline = document.querySelector('hitline');

  for (const line of data.body) {

    const newBeat = document.createElement("beat");
    handleBeat(newBeat, linesCounter, hitline, data.head.precision);

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
    await new Promise(resolve => {
      newBeat.addEventListener('noteDelayDone', resolve, { once: true });
    });

    linesCounter++;
  }
}


function handleBeat(beat, beatIndex, hitline, precision) {
  let eventTriggered = false;
  let distanceMoved = 0;

  var lightduration = 800;
  const peakOffset = 0.2

  const lightup = function () {
    // alert('lightup');
    const hitlinelight = document.querySelector("hitlinelight")
    hitlinelight.style.background = "linear-gradient(to top, var(--color1), transparent)";

    const lightanimation = anime({
      targets: hitlinelight,
      keyframes: [
        { opacity: 0, offset: 0 },
        { opacity: 0.7, offset: peakOffset },
        { opacity: 0, offset: 1 },
      ],
      duration: lightduration,
      easing: 'linear',
      loop: 'false'
    });
    lightanimation.restart();
  }

  document.querySelector('notecontainer').appendChild(beat)

  let position = noteStartingPosition;
  const startPosition = position;
  const fallInterval = setInterval(() => {
    if (paused) {
      return;
    }

    position += noteStepSize;
    let adjustedPosition = position + 11; //TODO make adaptive
    distanceMoved = adjustedPosition - startPosition;
    beat.style.top = adjustedPosition + "px";

    if (!eventTriggered && distanceMoved >= noteSpacingPx) {
      eventTriggered = true;
      beat.dispatchEvent(new CustomEvent('noteDelayDone', { detail: { distance: distanceMoved } }));
    }

    if (beat.getBoundingClientRect().bottom + ((noteStepSize / (1000 / fps)) * (lightduration * peakOffset)) >= hitline.getBoundingClientRect().bottom) {
      if (beat.getAttribute("aria-active") === "false") { }
      else {
        if (beatIndex % precision == 0) {
          lightup();
          beat.setAttribute("aria-active", "false")
        }
      }
    }

    if (beat.getBoundingClientRect().bottom >= hitline.getBoundingClientRect().bottom) {
      clearInterval(fallInterval);
      beat.remove();
    }

  }, 1000 / fps);
}
//TODO add transition time for ticks if low bpm

function handleNote(noteElement) {
  let distanceMoved = 0;
  noteElement.setAttribute("aria-active", "true");
  let position = noteStartingPosition;
  const startPosition = position;
  const fallInterval = setInterval(() => {

    if (paused) {
      return;
    }

    position += noteStepSize;
    distanceMoved = position - startPosition;
    noteElement.style.top = position + "px";

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
    }
  }, 1000 / fps);
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

function songSetup(songFilePath, AdaptiveNoteSpeedPreference) {

  function checkHit(laneId) {
    const lanenotes = laneId.querySelectorAll('note[aria-active="true"]');

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

      const rightHand = document.createElement("ticksection"),
        leftHand = document.createElement("ticksection"),
        hitline = document.querySelector("hitline");
      Dlane = document.createElement("tick");
      Flane = document.createElement("tick");
      Jlane = document.createElement("tick");
      Klane = document.createElement("tick");

      parseNotemap(songFilePath).then((data) => {
        const accuracyDiv = document.getElementById("accuracyDiv");
        bps = data.head.bpm / 60;
        beatLength = 1000 / bps
        if (AdaptiveNoteSpeedPreference === 'true') {
          noteSpacingPx = 100 * bps;
        }
        else {
          noteSpacingPx = 100 * AdaptiveNoteSpeedPreference
        }
        noteStepSize = bps * noteSpacingPx / fps;
        // console.log("noteStepSize: " + noteStepSize);
        // console.log("noteSpacingPx: " + noteSpacingPx);

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
      if (event.repeat || paused) {
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

    let countdowncircle = document.querySelector("countdowncircle")

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || event.key === "Enter") {
          if (paused) {
            unpause()}
          else {
            pause()
          }
        }
      }
    );

    updatehp();

    let grades = {
      F: "You Suck",
      D: "Bruh",
      C: "Mid",
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
