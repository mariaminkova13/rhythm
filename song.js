export { songSetup, handleNote, note, beatLength, music, musicstart };
import { unpause, pause, countdown, paused, showDeathMsg } from "./modals.js";
import { avg, median } from "./index.js"
import { loadAlbumMenu } from "./MenuFX.js";
import { visualizeAudio } from "./style/musicFX/audioFX.js";
import anime from "/node_modules/animejs/lib/anime.es.js";
import { sing, initVoice } from "./soundfonts.js"
import { parseNotemap } from "./parser.js";

//TODO when bpm 20 notes too close together, tweak adaptiveness factor.
//TODO make countdown be as first beat flies to hitlone
//TODO modifiers, like practice mode with no death and lenient timings, hide area around judgement line modifier. Amount of points/score based on actual hits not categories of hits

const note = document.createElement("note");
const difficulties = ["relaxed", "normal", "hard", "brutal"];

var hp = 100,
  difficulty = "normal"

const missHpCost = 5,
  forgotNoteCost = 7,
  minHeal = 13,
  maxHeal = 30

const preciseThreshold = 20, //more than which is just hit
  hitThreshold = 50, //more than which is just offbeat
  offbeatThreshold = 100 //more than which is miss

const offbeatLoseComboChance = 0.5;

var missCount = 0,
  hitCount = 0,
  offbeatCount = 0,
  preciseCount = 0,
  combo = 0,
  hitResult = null,
  earlyOrLate = null;

var noteSpacingPx, noteStepSize, bps, beatLength;
const displayComboAfter = 4
const fps = 80;
const noteStartingPosition = -10;
var hitAccuracy = [];

const preciseSound = new Audio("assets/sfx/perfect.wav"),
  missSound = new Audio("assets/sfx/miss.mp3"),
  hitSound = new Audio("assets/sfx/hit.wav"),
  offbeatSound = new Audio("assets/sfx/offbeat.wav");

let Slane, Dlane, Flane, spacelane, Jlane, Klane, Llane, music;
let musicstart = false

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

  for (const line of data.body) {
    const newBeat = document.createElement("beat");
    handleBeat(newBeat, linesCounter, document.querySelector('hitline').getBoundingClientRect().bottom);

    const lineParsed = line.split(" ");

    for (let i = 0; i < Math.min(lineParsed.length, laneList.length); i++) {
      if (lineParsed[i] != ".") {
        const newNote = document.createElement("note");
        newNote.style.top = noteStartingPosition + "px";
        newNote.setAttribute('pitch', lineParsed[i])
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


function handleBeat(beat, beatIndex, hitlinePos) {
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
  let startTime = Date.now();

  function moveBeat() {
    if (paused) {
      return;
    }
    let beatBottom = beat.getBoundingClientRect().bottom

    let elapsedms = Date.now() - startTime
    position = elapsedms / (1000 / fps) * noteStepSize

    let adjustedPosition = position - 22; //TODO make adaptive, why this num
    distanceMoved = adjustedPosition - startPosition;
    beat.style.top = adjustedPosition + "px";

    if (elapsedms >= beatLength) {
      beat.dispatchEvent(new CustomEvent('noteDelayDone', { detail: { distance: distanceMoved } }));
    }

    if (beatBottom + ((noteStepSize / (1000 / fps)) * (lightduration * peakOffset)) >= hitlinePos) {
      if (beat.getAttribute("aria-active") === "false") { }
      else {
        lightup();
        beat.setAttribute("aria-active", "false")
      }
    }

    if (beatBottom >= hitlinePos) {
      if (beatIndex == 0) {
        musicstart = true
        window.dispatchEvent(new Event('musicmaystart'));
      }
    }

    if (beatBottom >= document.getElementById('appContainer').getBoundingClientRect().bottom) {
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
  let position, distanceMoved = 0
  let startTime = Date.now();
  noteElement.setAttribute("aria-active", "true");

  function moveNote() {
    if (paused) {
      return;
    }

    let elapsedms = Date.now() - startTime
    position = elapsedms * (noteStepSize / (1000 / fps))
    noteElement.style.top = position + "px";

    let noteRect = noteElement.getBoundingClientRect()
    let noteCenter = ((noteRect.bottom - noteRect.y) / 2) + noteRect.y
    let hitlineBottom = document.querySelector('hitline').getBoundingClientRect().bottom

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

    if (noteCenter > appContainer.getBoundingClientRect().bottom) {
      noteElement.remove()
      clearInterval(fallInterval)
    }
  }

  const fallInterval = setInterval(() => {
    requestAnimationFrame(moveNote)
  }, 1000 / fps);
}

function updateCombo(msg) {
  let comboCounter = document.getElementById('comboCounter')
  let counterAfter = document.getElementById('counterAfter')

  if (msg) { document.getElementById('hitcomment').textContent = msg }

  if (combo == displayComboAfter) {
    comboCounter.textContent = null
  }
  else if (combo > displayComboAfter) {
    comboCounter.textContent = combo
  }
  counterAfter.textContent = earlyOrLate
  // TODO fade after 500 ms
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
              if (absoluteDistance <= preciseThreshold) {
                updateCombo('precise')
                // preciseSound.play();
                hp = Math.min(hp + Math.random() * (maxHeal - minHeal) + minHeal, 100);
                preciseCount++;
                combo++
              } else if (absoluteDistance <= hitThreshold) {
                // hitSound.play();
                hitCount++;
                combo++

                //TODO make the legth defaultLength from nm * beat length
              } else {
                updateCombo('offbeat')
                offbeatSound.play();
                offbeatCount++;
                if (Math.random() >= offbeatLoseComboChance) { combo++ } else { combo = 0 }
              }
              hitResult.note.setAttribute("aria-active", "false");
              sing(hitResult.note.getAttribute('pitch'), 0.5)
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
              updateCombo()
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
