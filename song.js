export { songSetup, handleNote, note, beatLength, music, musicstart };
import { unpause, pause, countdown, paused, showDeathMsg } from "./modals.js";
import { avg, median, loadAlbumMenu } from "./index.js"
import { audioFX } from "./style/musicFX/audioFX.js";
import anime from "/node_modules/animejs/lib/anime.es.js";

//TODO when bpm 20 notes too close together, tweak adaptiveness factor.
//TODO make countdown be as first beat flies to hitlone
//TODO modifiers, like practice mode with no death and lenient timings, hide area around judgement line modifier. Amount of points/score based on actual hits not categories of hits

const note = document.createElement("note");
const difficulties = ["relaxed", "normal", "hard", "brutal"];

var hp = 100,
  difficulty = "normal"

var missHpCost = 5,
  forgotNoteCost = 7,
  minHeal = 13,
  maxHeal = 30,
  perfectThreshold = 8,
  hitThreshold = 40,
  shitThreshold = 80,
  shitLoseComboChance = 0.5;

var missCount = 0,
  hitCount = 0,
  shitCount = 0,
  perfectCount = 0,
  combo = 0,
  hitResult = null,
  earlyOrLate = null;

var noteSpacingPx, noteStepSize, bps, beatLength;
const displayComboAfter = 4
const fps = 80;
const noteStartingPosition = -10;
var hitAccuracy = [];

const perfectSound = new Audio("sfx/perfect.wav"),
  missSound = new Audio("sfx/miss.mp3"),
  hitSound = new Audio("sfx/hit.wav"),
  shitSound = new Audio("sfx/shit.wav");

let Slane, Dlane, Flane, spacelane, Jlane, Klane, Llane, music;
let musicstart = false

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
  musicstart = false

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


function handleBeat(beat, beatIndex, hitline) {
  let eventTriggered = false;
  let distanceMoved = 0;

  const beatNumber = document.createElement('beatnumber')
  beatNumber.textContent = beatIndex + 1
  beat.appendChild(beatNumber)

  var lightduration = 400;
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
    let adjustedPosition = position + 11; //TODO make adaptive, why 11
    distanceMoved = adjustedPosition - startPosition;
    beat.style.top = adjustedPosition + "px";

    if (!eventTriggered && distanceMoved >= noteSpacingPx) {
      eventTriggered = true;
      beat.dispatchEvent(new CustomEvent('noteDelayDone', { detail: { distance: distanceMoved } }));
    }

    if (beat.getBoundingClientRect().bottom + ((noteStepSize / (1000 / fps)) * (lightduration * peakOffset)) >= hitline.getBoundingClientRect().bottom) {
      if (beat.getAttribute("aria-active") === "false") { }
      else {
        lightup();
        beat.setAttribute("aria-active", "false")
      }
    }

    if (beat.getBoundingClientRect().bottom >= hitline.getBoundingClientRect().bottom) {
      clearInterval(fallInterval);
      beat.remove();
      if (beatIndex == 0) {
        musicstart = true
        window.dispatchEvent(new Event('musicmaystart'));
      }
    }

  }, 1000 / fps);
}
//TODO add transition time for ticks if low bpm

function handleNote(noteElement) {
  function moveNote() {
    if (paused) {
      return;
    }

    let elapsedms = Date.now() - startTime
    position = elapsedms * noteStepSize //FIXME
    noteElement.style.top = position + "px";

    // Delete the note when it goes offscreen
    if (position > window.innerHeight) {
      clearInterval(fallInterval);
      noteElement.remove();
    }
  }
  let position, distanceMoved = 0
  let startTime = Date.now();
  noteElement.setAttribute("aria-active", "true");
  const fallInterval = setInterval(() => {
    requestAnimationFrame(moveNote)

    //FIXME
    if (noteElement.getAttribute("aria-active") === "true" && distance > shitThreshold) {
      console.log("Note offscreen, completely missed");
      missSound.play();
      earlyOrLate = "late.";
      hp -= forgotNoteCost;
      missCount++;
      window.dispatchEvent(new Event('vignetteRed'))
      updatehp();
      combo = 0
      updateCombo()
    }
  }, 1000 / fps);
}

function updateCombo() {
  // if (hitResult && hitResult.distance > 0) {
  //   earlyOrLate = "early";
  // }
  // else if (hitResult && hitResult.distance === 0) {
  //   earlyOrLate = "exact!!!"
  // }
  // else if (hitResult) {
  //   earlyOrLate = "late";
  // }

  let comboCounter = document.querySelector('comboCounter')

  if (comboCounter && combo == displayComboAfter) {
    comboCounter.remove()
  }
  else if (comboCounter && combo > displayComboAfter) {
    comboCounter.textContent = combo
  }
  else if (!comboCounter && combo > displayComboAfter) {
    let newCounter = document.createElement('comboCounter')
    newCounter.textContent = combo;
    document.querySelector('noteContainer').appendChild(newCounter)
  }

  // container.appendChild(newHitComment);
  // newCounter.style.setProperty("--after-comboCounter", `"${earlyOrLate}"`);
}

function updatehp() {
  let heart = document.getElementById('heart')
  heart.firstChild.innerText = Math.round(hp)
  document.documentElement.style.setProperty(
    "--pulsespeed",
    0.1 + hp * 0.007 + "s"  //linear interpolation
  );
  document.documentElement.style.setProperty("--hp", hp + "%");
  console.log("HP:", hp + "%");
  if (hp > 100) {
    hp == 100;
  }
  if (hp <= 0) {
    showDeathMsg();
    music.pause()
  }
}

function checkHit(lane) {
  const lanenotes = lane.querySelectorAll('note[aria-active="true"]');

  if (lanenotes.length === 0) {
    return null;
  }

  // Get the tick's center position (bottom of lane)
  const laneRect = lane.getBoundingClientRect(),
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

function songSetup(mapFilePath, musicFilePath, AdaptiveNoteSpeedPreference) {
  console.clear()
  document.body.style.cursor = "none";
  musicstart = false;
  hp = 100;

  const controller = new AbortController()
  const { signal } = controller

  fetch("markup/song.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("allthestuff").innerHTML = html;

      requestAnimationFrame(() => { //so that runs only after all is loaded
        const redobuttons = ["restartButton", "retryButton"];
        redobuttons.forEach(id => {
          document.getElementById(id).onclick = function () {
            if (music) {
              music.pause()
              music.currentTime = 0
            }
            controller.abort()
            songSetup(mapFilePath, musicFilePath, AdaptiveNoteSpeedPreference)
          };
        });

        const exitbuttons = ['quitButton', 'exitButton']
        exitbuttons.forEach(id => {
          document.getElementById(id).onclick = function () {
            loadAlbumMenu()
            controller.abort()
          };
        })
      });

      const rightHand = document.createElement("ticksection"),
        leftHand = document.createElement("ticksection"),
        hitline = document.querySelector("hitline");
      Dlane = document.createElement("tick");
      Flane = document.createElement("tick");
      Jlane = document.createElement("tick");
      Klane = document.createElement("tick");

      parseNotemap(mapFilePath).then((data) => {
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

        requestAnimationFrame(() => { //so that runs only after all is loaded
          tickEventListeners();
          countdown();
          createNotes(data);
          updatehp()
        });
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
              hp = Math.min(hp + Math.random() * (maxHeal - minHeal) + minHeal, 100);
              hitResult.note.setAttribute("aria-active", "false");
              perfectCount++;
              combo++
            } else if (absoluteDistance <= hitThreshold) {
              console.log("hit");
              hitSound.play();
              hitResult.note.setAttribute("aria-active", "false");
              hitCount++;
              combo++
            } else if (absoluteDistance <= shitThreshold) {
              console.log("shit");
              shitSound.play();
              hitResult.note.setAttribute("aria-active", "false");
              shitCount++;
              if (Math.random() >= shitLoseComboChance) { combo++ } else { combo = 0 }
            } else {
              console.log("miss");
              missSound.play();
              hp -= missHpCost;
              combo = 0
              if (absoluteDistance <= 200) {
                hitResult.note.setAttribute("aria-active", "false");
              }
              missCount++;
            }
          } else {
            console.log("no note on screen");
            missSound.play();
            hp -= missHpCost;
            combo = 0
            window.dispatchEvent(new Event('vignetteRed'))
          }
          updatehp();
          updateCombo()

          break; // Exit loop once we find a match
        }
      }
    }, { signal });

    // remove 'pressed' on keyup
    document.addEventListener("keyup", (event) => {
      for (const [lane, keys] of keymap) {
        if (keys.includes(event.code)) {
          lane.setAttribute("aria-pressed", "false");
          break;
        }
      }
    }, { signal });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" && event.key !== "Enter") return;
      if (paused) {
        unpause();
      }
      else {
        pause();
      }
    }, { signal });

    updatehp();

    //TODO do we need eventTriggered?

    async function startMusic() {
      if (!music) { music = new Audio(musicFilePath); await audioFX(music); }
      music.play();

      const songprogress = document.querySelector('songprogress')
      const timestamp = document.getElementById('timestamp')
      const progressUpdate = setInterval(() => {
        songprogress.style.width = `${music.currentTime / music.duration * 100}%`;
        let secondsElapsed = Math.floor(music.duration - music.currentTime)
        let ss = (secondsElapsed % 60).toString().padStart(2, "0");
        let mm = (Math.floor(secondsElapsed / 60)).toString().padStart(2, "0");
        //TODO only if not NaN
        timestamp.textContent = `${mm}:${ss}`
        if (secondsElapsed == music.duration) {
          clearInterval(progressUpdate)
          timestamp.style.visibility = 'hidden'
        }

      }, 1000 / fps);
    };

    window.addEventListener("musicmaystart", async (event) => { await startMusic(); }, { once: true });

    //TODO base score on ms offset, not px offset

    let grades = {
      F: "You Suck",
      D: "Bruh",
      C: "Mid",
      //mid and decent, phi is godlike
      B: "ok",
      A: "good",
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
