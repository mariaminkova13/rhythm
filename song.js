export { songSetup, handleNote, handleBeat, handleHold, note, beatLength, music, musicstart, noteStartingPosition };
import { unpause, pause, countdown, paused, showDeathMsg } from "./utils/modals.js";
import { avg, median } from "./index.js"
import { loadAlbumMenu } from "./MenuFX.js";
import { visualizeAudio } from "./style/musicFX/audioFX.js";
const { animate } = require('animejs');
import { sing, initVoice } from "./utils/soundfonts.js"
import { parseNotemap, readNotemap } from "./utils/parser.js";
import { GlobalOrchestratorFactory } from "./utils/timer.js";

//TODO when bpm 20 notes too close together, tweak adaptiveness factor.
//TODO make countdown be as first beat flies to hitlone
//TODO modifiers, like practice mode with no death and lenient timings, hide area around judgement line modifier. Amount of points/score based on actual hits not categories of hits
//TODO fix unpause given new system
//TODO on restart animate the notes onscreen going back and then restart countdown make seamless

const note = document.createElement("note");
const difficulties = ["relaxed", "normal", "hard", "brutal"];

var hp = 100,
  difficulty = "normal"

const missHpCost = 5,
  forgotNoteCost = 7,
  minHeal = 0,
  maxHeal = 10

const preciseThreshold = 30, //more than which is just hit
  hitThreshold = 70, //more than which is just offbeat
  offbeatThreshold = 100 //more than which is miss

const offbeatLoseComboChance = 0.5;

var missCount = 0,
  hitCount = 0,
  offbeatCount = 0,
  preciseCount = 0,
  combo = 0,
  hitResult = null,
  earlyOrLate = null;

var noteSpacingPx, noteStepSize, bps, beatLength, beatsPerBar;
const displayComboAfter = 4
const fps = 70;
const noteStartingPosition = -10
var hitAccuracy = [];
var deleteBelow

const missSound = new Audio("assets/sfx/miss.mp3"),
  offbeatSound = new Audio("assets/sfx/offbeat.wav");

let Slane, Dlane, Flane, spacelane, Jlane, Klane, Llane, music;
let musicstart = false

var orchestrator

async function createNotes(data) {
  musicstart = false

  let laneList = [];
  Array.from(document.querySelectorAll("track")).forEach((element) =>
    (laneList.push(element))
  );

  var linesCounter = 0;

  await new Promise(resolve => {
    window.addEventListener('playStarted', resolve, { once: true });
  });

  await readNotemap(data, linesCounter, laneList)
}


function handleBeat(beat, beatIndex, hitlinePos) {
  let distanceMoved = 0;
  let noteDelayDoneTriggered = false

  const beatNumber = document.createElement('beatnumber')
  beatNumber.textContent = beatIndex + 1
  beat.appendChild(beatNumber)

  var lightduration = beatLength * 0.8;
  const peakOffset = 0.2
  const pulselights = document.querySelectorAll("pulselight")
  const pulseL = document.getElementById('pulselightL')
  const pulseR = document.getElementById('pulselightR')

  function lightup() {
    animate(pulselights, {
      keyframes: [
        { opacity: 0, offset: 0 },
        { opacity: 1, width: '20px', filter: "", offset: peakOffset },
        { opacity: 0, offset: 1 },
      ],
      duration: lightduration,
      loop: false
    });
  }

  function lightupStrong() {
    animate(pulselights, {
      keyframes: [
        { opacity: 0, offset: 0 },
        { opacity: 1, width: '40px', filter: 'saturation(2)', offset: peakOffset },
        { opacity: 0, offset: 1 },
      ],
      duration: lightduration,
      loop: false
    });
    animate(pulseL, {
      keyframes: [
        { left: '-20px', offset: 0 },
        { left: '-40px', offset: peakOffset },
        { left: '-20px', offset: 1 },
      ],
      duration: lightduration,
      loop: false
    });
    animate(pulseR, {
      keyframes: [
        { right: '-20px', offset: 0 },
        { right: '-40px', offset: peakOffset },
        { right: '-20px', offset: 1 },
      ],
      duration: lightduration,
      loop: false
    });
  }

  document.querySelector('notecontainer').appendChild(beat)

  let position = noteStartingPosition;
  const startPosition = position;
  let startTime = Date.now()

  let timer = orchestrator.createTimer();

  function moveBeat() {
    if (paused) {
      return;
    }
    let beatBottom = beat.getBoundingClientRect().bottom

    //TODO position starts from notestartingpos

    let adjustedPosition = updatePositionOfThing(beat, timer) - 22; //TODO fix this, sync everything with timer
    distanceMoved = adjustedPosition - startPosition;
    beat.style.top = adjustedPosition + "px";

    if (timer.getElapsed() >= beatLength && noteDelayDoneTriggered == false) {
      beat.dispatchEvent(new CustomEvent('noteDelayDone', { detail: { distance: distanceMoved } }));
      noteDelayDoneTriggered = true
      console.log('delaydone')
    }

    if (beatBottom + ((noteStepSize / (1000 / fps)) * (lightduration * peakOffset)) >= hitlinePos) {
      if (beat.getAttribute("aria-active") === "false") { }
      else {
        beat.setAttribute("aria-active", "false")
        if (beatIndex % beatsPerBar === 0) { lightupStrong() }
        else { lightup() }
      }
    }

    if (beatBottom >= hitlinePos) {
      if (beatIndex == 0) {
        musicstart = true
        window.dispatchEvent(new Event('musicmaystart'));
      }
    }

    if (beatBottom >= deleteBelow) {
      beat.remove()
      clearInterval(fallInterval);
    }
  }

  const fallInterval = setInterval(() => {
    requestAnimationFrame(moveBeat)
  }, 1000 / fps);
}
//TODO add transition time for ticks if low bpm

function handleNote(noteElement) {
  let hitlineBottom = document.querySelector('hitline').getBoundingClientRect().bottom
  let position, distanceMoved = 0
  noteElement.setAttribute("aria-active", "true");
  let elapsedms = 0
  // let startTime = Date.now()
  var timer = orchestrator.createTimer();

  function moveNote() {
    if (paused) {
      return;
    }

    updatePositionOfThing(noteElement, timer)

    let noteRect = noteElement.getBoundingClientRect()
    let noteCenter = ((noteRect.bottom - noteRect.y) / 2) + noteRect.y

    let msUntilHit = (hitlineBottom - noteCenter) / (noteStepSize / (1000 / fps))
    noteElement.setAttribute('msUntilHit', msUntilHit)

    if (noteElement.getAttribute("aria-active") === "true" && msUntilHit * -1 > offbeatThreshold) {
      // console.log("didn't press note");
      missSound.play();
      hp -= forgotNoteCost;
      missCount++;
      window.dispatchEvent(new Event('vignetteRed'))
      updatehp();
      combo = 0
      earlyOrLate = "late.";
      updateCombo()
      noteElement.setAttribute('aria-active', false)
    }

    if (noteCenter > deleteBelow && !noteElement.hasAttribute('holdStartOf')) {
      noteElement.remove()
      clearInterval(fallInterval)
    }
  }

  const fallInterval = setInterval(() => {
    requestAnimationFrame(moveNote)
  }, 1000 / fps);
}

function handleHold(holdBody, startNote) {
  let holdEndAdded = false
  holdBody.addEventListener('holdEnd', (e) => {
    let end = e.detail.element.getBoundingClientRect().bottom
    let rect = holdBody.getBoundingClientRect()
    let currentHeight = rect.bottom - rect.top
    holdEndAdded = true
  }, { once: true });
  startNote.parentElement.appendChild(holdBody)
  let timer = orchestrator.createTimer()
  function moveHold() {
    let holdRect = holdBody.getBoundingClientRect()
    if (holdEndAdded == false) {
      holdBody.style.height = parseFloat(startNote.style.top) + 'px'
    }
    holdBody.style.top = parseFloat(startNote.style.top) - (holdRect.bottom - holdRect.top) + 'px'
  }

  const fallInterval = setInterval(() => {
    if (paused) { return }
    if (holdBody.getBoundingClientRect().top > deleteBelow) {
      startNote.remove()
      holdBody.remove()
      clearInterval(fallInterval)
    }
    if (document.body.contains(startNote)) {
      requestAnimationFrame(moveHold);
      if (startNote.getAttribute('aria-active' === false)) { holdBody.setAttribute('aria-active', false) }
    }
  }, 1000 / fps);
}

function updatePositionOfThing(thing, timer) {
  let pos = timer.getElapsed() / (1000 / fps) * noteStepSize
  thing.style.top = pos + 'px'
  return pos
}

function updateCombo(msg) {
  let comboCounter = document.getElementById('comboCounter')
  let counterAfter = document.getElementById('counterAfter')
  let hitcomment = document.getElementById('hitcomment')

  if (msg) { hitcomment.textContent = msg }

  if (combo == 0) {
    animate(comboCounter, {
      loop: false,
      duration: 200,
      keyframes: {
        '0%': { translate: '1px, 1px', rotate: '0deg' },
        '10%': { translate: '-1px, -2px', rotate: '-1deg', },
        '20%': { translate: '-3px, 0px', rotate: '1deg' },
        '30%': { translate: '3px, 2px', rotate: '0deg' },
        '40%': { translate: '1px, -1px', rotate: '1deg' },
        '50%': { translate: '-1px, 2px', rotate: '-1deg' },
        '60%': { translate: '-3px, 1px', rotate: '0deg' },
        '70%': { translate: '3px, 1px', rotate: '-1deg' },
        '80%': { translate: '-1px, -1px', rotate: '1deg' },
        '90%': { translate: '1px, 2px', rotate: '0deg' },
        '100%': { translate: '1px, -2px', rotate: '-1deg', opacity: 0 }
      }
    })
  }

  if (combo <= displayComboAfter) {
    // comboCounter.textContent = null
  }
  else if (combo > displayComboAfter) {
    comboCounter.textContent = combo
  }
  counterAfter.textContent = earlyOrLate
  setTimeout(() => {
    animate([counterAfter, hitcomment], {
      opacity: 0,
      loop: false,
      duration: 200
    });
  }, 1000)
}

function updatehp() {
  let heart = document.getElementById('heart')
  if (!heart) return
  heart.firstChild.innerText = Math.round(hp)
  document.documentElement.style.setProperty(
    "--pulsespeed",
    0.1 + hp * 0.007 + "s"  //linear interpolation
  );
  document.documentElement.style.setProperty("--hp", hp + "%");
  // console.log("HP:", hp + "%");
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
    closestDistance = Infinity,
    closestDistanceRaw = Infinity;

  // Find the closest note to the tick
  lanenotes.forEach((note) => {
    const distance = note.getAttribute('msUntilHit');

    if (Math.abs(distance) < closestDistance) {
      closestDistance = Math.abs(distance);
      closestDistanceRaw = distance
      closestNote = note;
    }
  });

  return {
    note: closestNote,
    closestDistance: closestDistance,
    closestDistanceRaw: closestDistanceRaw
  };
}

async function songSetup(mapFilePath, musicFilePath, AdaptiveNoteSpeedPreference) {
  console.clear()
  await initVoice()
  orchestrator = new GlobalOrchestratorFactory()
  deleteBelow = document.getElementById('appContainer').getBoundingClientRect().bottom + 30

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
          document.getElementById(id).onclick = async function () {
            if (music) {
              music.pause()
              music.currentTime = 0
            }
            controller.abort()
            await songSetup(mapFilePath, musicFilePath, AdaptiveNoteSpeedPreference)
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
        beatLength = 1000 / bps;
        beatsPerBar = data.head.beatsPerBar
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
    keymap.set(Dlane, ["Digit2", "KeyD", "ArrowLeft", "KeyZ"]);
    keymap.set(Flane, ["Digit3", "KeyF", "ArrowDown", "KeyX"]);
    if (spacelane) keymap.set(spacelane, ["Space"]);
    keymap.set(Jlane, ["Digit4", "KeyJ", "ArrowUp", "Comma"]);
    keymap.set(Klane, ["Digit5", "KeyK", "ArrowRight", "Period"]);
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
            const absoluteDistance = hitResult.closestDistance;
            const rawDistance = hitResult.closestDistanceRaw

            console.log(
              `${lane || 'unknown'}: ${absoluteDistance.toFixed(
                2
              )}`
            );

            // hit evaluation
            hitAccuracy.push(rawDistance);
            accuracyDiv.textContent = Math.round(median(hitAccuracy));
            if (absoluteDistance <= offbeatThreshold) {
              let accuracy
              if (absoluteDistance <= preciseThreshold) {
                updateCombo('precise')
                accuracy = "precise"
                hp = Math.min(hp + Math.random() * (maxHeal - minHeal) + minHeal, 100);
                preciseCount++;
                combo++
              } else if (absoluteDistance <= hitThreshold) {
                accuracy = "hit"
                hitCount++;
                combo++
                updateCombo('')

                //TODO make the legth defaultLength from nm * beat length
              } else {
                updateCombo('offbeat')
                offbeatSound.play();
                offbeatCount++;
                if (Math.random() >= offbeatLoseComboChance) { combo++ } else { combo = 0 }
              }
              hitResult.note.setAttribute("aria-active", "false");
              sing(hitResult.note.getAttribute('pitch'), 0.5, accuracy)
            }
            else {
              console.log("miss");
              missSound.play();
              hp -= missHpCost;
              combo = 0
              if (absoluteDistance <= 200) {
                hitResult.note.setAttribute("aria-active", "false");
              }
              missCount++;
              updateCombo('miss')
            }
          } else {
            console.log("no note on screen");
            missSound.play();
            hp -= missHpCost;
            combo = 0
            window.dispatchEvent(new Event('vignetteRed'))
            updateCombo()
          }
          if (hitResult) {
            if (hitResult.rawDistance > 0) {
              earlyOrLate = "early";
            }
            if (hitResult.rawDistance === 0) {
              earlyOrLate = "exact!"
            }
            else {
              earlyOrLate = "late";
            }
          }
          updatehp();

          break;
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

    async function startMusic() {
      music = new Audio(musicFilePath)
      await visualizeAudio(music)
      music.play();

      const songprogress = document.querySelector('songprogress')
      const timestamp = document.getElementById('timestamp')
      const progressUpdate = setInterval(() => {
        songprogress.style.width = `${music.currentTime / music.duration * 100}%`;
        let secondsElapsed = Math.floor(music.duration - music.currentTime)
        let ss = (secondsElapsed % 60).toString().padStart(2, "0");
        let mm = (Math.floor(secondsElapsed / 60)).toString().padStart(2, "0");
        if (!isNaN(mm) && !isNaN(ss)) { timestamp.textContent = `${mm}:${ss}` }
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
        if ((offbeatCount = 0)) {
          plusminus.innerText = "";
          if ((hitCount = 0)) {
            plusminus.innerText = "+";
          }
        }
      }
    }
  }
}
