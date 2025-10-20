import { unpause, pause, countdown, paused, showDeathMsg } from './modals.js';

var fps = 60;
var timeout = 100;
var hp = 100;
var difficulty = "normal";
var speed = 5; // pixels per frame
var hitcommenttimeout = 500;

const perfectSound = new Audio("sfx/perfect.wav");
const missSound = new Audio("sfx/miss.mp3");
const hitSound = new Audio("sfx/hit.wav");
const shitSound = new Audio("sfx/shit.wav");

const note = document.createElement("note");
// const hitcomment = document.createElement("hitcomment")

const lane1 = document.getElementById("lane1");
const lane2 = document.getElementById("lane2");
const lane3 = document.getElementById("lane3");
const lane4 = document.getElementById("lane4");
const lane5 = document.getElementById("lane5");
const lane6 = document.getElementById("lane6");

function updatehp() {
  document.documentElement.style.setProperty(
    "--pulsespeed",
    //linear interpolation
    0.1 + hp * 0.007 + "s"
  );
  document.documentElement.style.setProperty("--hp", hp + "%");
  if (hp <= 0) {
    showDeathMsg()
  }
}

function checkHit(laneId) {
  const lane = document.getElementById(laneId);
  const lanenotes = lane.querySelectorAll('note[aria-active="true"]');

  console.log(`Lane: ${laneId}, Notes found: ${lanenotes.length}`, lanenotes);

  if (lanenotes.length === 0) {
    return null; // No notes in this lane
  }

  // Get the tick's center position (bottom of lane)
  const laneRect = lane.getBoundingClientRect();
  // Get the computed tick height directly from the lane's height
  const tickHeightPixels = laneRect.height;
  const tickCenterY = laneRect.bottom - tickHeightPixels / 2;

  let closestNote = null;
  let closestDistance = Infinity;

  // Find the closest note to the tick
  lanenotes.forEach((note) => {
    const noteRect = note.getBoundingClientRect();
    const noteCenterY = noteRect.top + noteRect.height / 2;
    const distance = Math.abs(noteCenterY - tickCenterY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestNote = note;
    }
  });

  return {
    note: closestNote,
    distance: closestDistance,
  };
}

function createHitComment(msg) {
  const newHitComment = document.createElement("hitcomment");
  newHitComment.textContent = msg;
  const container = document.querySelector("notecontainer");
  container.appendChild(newHitComment);
  setTimeout(() => newHitComment.remove(), hitcommenttimeout);
}

function setup() {
  // Setup pause modal buttons
  const resumeButton = document.getElementById("resumeButton");
  const quitButton = document.getElementById("quitButton");

  if (resumeButton) {
    resumeButton.addEventListener("click", unpause);
  }

  if (quitButton) {
    quitButton.addEventListener("click", () => {
      // Add quit functionality here
      console.log("Quit button clicked");
    });
  }

  let keymap = {};
  keymap["lane1"] = ["1", "s", "S"];
  keymap["lane2"] = ["2", "d", "D"];
  keymap["lane3"] = ["3", "f", "F"];
  keymap["lane4"] = ["4", "j", "J"];
  keymap["lane5"] = ["5", "k", "K"];
  keymap["lane6"] = ["6", "l", "L"];

  let missHpCost, badMissHpCost, perfectHeal, minHeal, maxHeal;
  let missCount, hitCount, shitCount, perfectCount = 0;

  if (difficulty === "relaxed") {
    missHpCost = 0;
    badMissHpCost = 0;
    perfectHeal = 0;
  } else if (difficulty === "normal") {
    missHpCost = 5;
    badMissHpCost = 15;
    perfectHeal = 20;
    minHeal = perfectHeal / 1.8;
    maxHeal = 20 * 1.2;
  }

  // Event listeners - optimized using keymap
  document.addEventListener("keydown", (event) => {
    // Ignore repeated keydown events from holding the key
    if (event.repeat) {
      return;
    }

    // Loop through each lane in the keymap
    for (const [laneId, keys] of Object.entries(keymap)) {
      // Check if the pressed key matches any key for this lane
      if (keys.includes(event.key)) {
        const lane = document.getElementById(laneId);
        lane.setAttribute("aria-pressed", "true");

        // Check for hit detection
        const hitResult = checkHit(laneId);
        if (hitResult) {
          console.log(
            `Lane ${laneId}: Closest note is ${hitResult.distance.toFixed(
              2
            )} pixels away`
          );
          // hit evaluation
          if (hitResult.distance <= 8) {
            console.log("perfect");
            perfectSound.play();
            createHitComment("perfect!");
            const minHeal = perfectHeal / 1.5;
            const maxHeal = perfectHeal * 1.5;
            hp += Math.random() * (maxHeal - minHeal) + minHeal;
            updatehp();
            note.setAttribute("aria-active", "false");
            perfectCount++
          } else if (hitResult.distance <= 40) {
            console.log("hit");
            hitSound.play();
            note.setAttribute("aria-active", "false");
            hitCount++
          } else if (hitResult.distance <= 80) {
            console.log("shit");
            shitSound.play();
            note.setAttribute("aria-active", "false");
            shitCount++
          } else {
            console.log("miss");
            missSound.play();
            createHitComment("miss");
            hp -= missHpCost;
            updatehp();
            if (hitResult.distance <= 200) {
              note.setAttribute("aria-active", "false");
            }
            missCount++
          }
        } else {
          console.log(`Lane ${laneId}: No notes to hit`);
          missSound.play();
          hp -= badMissHpCost;
          updatehp();
          const newHitComment = document.createElement("hitcomment");
          newHitComment.textContent = "miss";
          const container = document.querySelector("notecontainer");
          container.appendChild(newHitComment);
          setTimeout(() => newHitComment.remove(), hitcommenttimeout);
          missCount++
        }

        break; // Exit loop once we find a match
      }
    }
  });

  // remove 'pressed' on keyup
  document.addEventListener("keyup", (event) => {
    for (const [laneId, keys] of Object.entries(keymap)) {
      if (keys.includes(event.key)) {
        const lane = document.getElementById(laneId);
        lane.setAttribute("aria-pressed", "false");
        break;
      }
    }
  });

  //open the pause modal on double spacebar press
  let spacebarPressCount = 0;
  let spacebarTimeout;

  document.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      spacebarPressCount++;

      // Clear the previous timeout if it exists
      if (spacebarTimeout) {
        clearTimeout(spacebarTimeout);
      }

      // Check if double press
      if (spacebarPressCount === 2) {
        pause();
        spacebarPressCount = 0; // Reset counter

        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            unpause();
            removeEventListener;
          }
        });
      }

      // Reset counter after timeout if no second press
      spacebarTimeout = setTimeout(() => {
        spacebarPressCount = 0;
      }, 250); // 250ms window for double press
    }
  });
  updatehp();
}

function handleNote(noteElement) {
  // Move the note down the track
  // Get --bottompadding CSS variable and convert to pixels
  noteElement.setAttribute("aria-active", "true");
  const bottomPaddingValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--bottompadding")
    .trim();
  const bottomPaddingPixels =
    (parseFloat(bottomPaddingValue) * window.innerHeight) / 100; // Convert vh to pixels
  // Calculate starting position: -(100vh - bottompadding) = bottompadding - 100vh
  let position = -(window.innerHeight - bottomPaddingPixels) - 100;
  const fallInterval = setInterval(() => {
    // Don't move notes while paused
    if (paused) {
      return;
    }

    position += speed;
    noteElement.style.top = position + "px";

    // Delete the note when it goes offscreen
    if (position > window.innerHeight) {
      noteElement.remove();
      clearInterval(fallInterval);
    }
  }, 1000 / fps);
}

let grades = ['F', 'D', 'C', 'B', 'A'];
const lettergrade = document.querySelector("lettergrade");
const plusminus = document.querySelector("plusminus");

function checkForFC() {
  if (missCount = 0){
    lettergrade.innerText = "β"
    plusminus.innerText = "-"
    if (shitCount = 0){
      plusminus.innerText = ""
      if (hitCount = 0) {
        plusminus.innerText = "+"
      }
    }
  }
}

setup();
countdown();
lane1.appendChild(note);
handleNote(note);