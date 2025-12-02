export { songSetup };
import { unpause, pause, countdown, paused, showDeathMsg } from "./modals.js";
import { songFilePath } from "./index.js";
import { parseNotemap } from "./notemapReader.js";

function songSetup() {
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

  function checkHit(laneId) {
    // const lane = document.getElementById(laneId);
    const lanenotes = laneId.querySelectorAll('note[aria-active="true"]');

    console.log(`Lane: ${laneId}, Notes found: ${lanenotes.length}`, lanenotes);

    if (lanenotes.length === 0) {
      return null; // No notes in this lane
    }

    // Get the tick's center position (bottom of lane)
    const laneRect = laneId.getBoundingClientRect();
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

  const difficulties = ["relaxed", "normal", "hard", "brutal"];

  var fps = 60;
  var timeout = 100;
  var hp = 100;
  var difficulty = "normal";
  var speed = 5; // pixels per frame
  var hitcommenttimeout = 1000;

  const perfectSound = new Audio("sfx/perfect.wav");
  const badmissSound = new Audio("sfx/badmiss.mp3");
  const hitSound = new Audio("sfx/hit.wav");
  const shitSound = new Audio("sfx/shit.wav");

  const note = document.createElement("note");
  // const hitcomment = document.createElement("hitcomment")

  let Slane, Dlane, Flane, spacelane, Jlane, Klane, Llane;

  fetch("markup/song.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("allthestuff").innerHTML = html;

      // Initialize lane elements after HTML is loaded

      const rightHand = document.createElement("ticksection");
      const leftHand = document.createElement("ticksection");
      const hitline = document.querySelector("hitline");
      Dlane = document.createElement("tick");
      Flane = document.createElement("tick");
      Jlane = document.createElement("tick");
      Klane = document.createElement("tick");

      parseNotemap(songFilePath).then((data) => {
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
        Dlane.firstChild.appendChild(note);
        handleNote(note);

        tickEventListeners();
        countdown();
      });
    });

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

  let missHpCost, badMissHpCost, perfectHeal, minHeal, maxHeal;
  let missCount,
    hitCount,
    shitCount,
    perfectCount = 0;

  if (difficulty === "relaxed") {
    missHpCost = 0;
    badMissHpCost = 0;
  } else if (difficulty === "normal") {
    missHpCost = 5;
    badMissHpCost = 15;
    minHeal = 13;
    maxHeal = 30;
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

        // Check for hit detection
        const hitResult = checkHit(lane);
        if (hitResult) {
          console.log(
            `Lane ${lane || 'unknown'}: Closest note is ${hitResult.distance.toFixed(
              2
            )} pixels away`
          );
          // hit evaluation
          if (hitResult.distance <= 8) {
            console.log("perfect");
            perfectSound.play();
            createHitComment("perfect!");
            hp += Math.random() * (maxHeal - minHeal) + minHeal;
            updatehp();
            note.setAttribute("aria-active", "false");
            perfectCount++;
          } else if (hitResult.distance <= 40) {
            console.log("hit");
            hitSound.play();
            note.setAttribute("aria-active", "false");
            hitCount++;
          } else if (hitResult.distance <= 80) {
            console.log("shit");
            shitSound.play();
            note.setAttribute("aria-active", "false");
            shitCount++;
          } else {
            console.log("miss");
            badmissSound.play();
            createHitComment("miss");
            hp -= missHpCost;
            updatehp();
            if (hitResult.distance <= 200) {
              note.setAttribute("aria-active", "false");
            }
            missCount++;
          }
        } else {
          console.log(`Lane ${lane || 'unknown'}: No notes to hit`);
          badmissSound.play();
          hp -= badMissHpCost;
          updatehp();
          const newHitComment = document.createElement("hitcomment");
          newHitComment.textContent = "miss";
          const container = document.querySelector("notecontainer");
          container.appendChild(newHitComment);
          setTimeout(() => newHitComment.remove(), hitcommenttimeout);
          missCount++;
        }

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
