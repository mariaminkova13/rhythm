// triple press space in quick succession to pause song

var fps = 60
var timeout = 100
var hp = 80
// var difficulty = normal
document.documentElement.style.setProperty('--pulsespeed', (0.1 + hp * 0.009) + "s");
document.documentElement.style.setProperty('--hp', (hp) + "%");

const note = document.createElement("note");
const pausemodal = document.createElement("pausemodal");

const lane1 = document.getElementById("lane1");
const lane2 = document.getElementById("lane2");
const lane3 = document.getElementById("lane3");
const lane4 = document.getElementById("lane4");
const lane5 = document.getElementById("lane5");
const lane6 = document.getElementById("lane6");

let keymap = {};
keymap["lane1"] = ["1", "s", "S"];
keymap["lane2"] = ["2", "d", "D"];
keymap["lane3"] = ["3", "f", "F"];
keymap["lane4"] = ["4", "j", "J"];
keymap["lane5"] = ["5", "k", "K"];
keymap["lane6"] = ["6", "l", "L"];

// Event listeners - optimized using keymap
document.addEventListener("keydown", (event) => {
  // Loop through each lane in the keymap
  for (const [laneId, keys] of Object.entries(keymap)) {
    // Check if the pressed key matches any key for this lane
    if (keys.includes(event.key)) {
      const lane = document.getElementById(laneId);
      lane.setAttribute("aria-pressed", "true");
      break; // Exit loop once we find a match
    }
  }
});

document.addEventListener("keyup", (event) => {
  // Loop through each lane in the keymap
  for (const [laneId, keys] of Object.entries(keymap)) {
    // Check if the released key matches any key for this lane
    if (keys.includes(event.key)) {
      const lane = document.getElementById(laneId);
      lane.setAttribute("aria-pressed", "false");
      break; // Exit loop once we find a match
    }
  }
});

document.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        document.body.appendChild(pausemodal);
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                document.body.removeChild(pausemodal);
                removeEventListener
            }
        });
    }
});

function handleNote(noteElement) {
  // Move the note down the track
  // Get --bottompadding CSS variable and convert to pixels
  const bottomPaddingValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--bottompadding")
    .trim();
  const bottomPaddingPixels =
    (parseFloat(bottomPaddingValue) * window.innerHeight) / 100; // Convert vh to pixels
  // Calculate starting position: -(100vh - bottompadding) = bottompadding - 100vh
  let position = -(window.innerHeight - bottomPaddingPixels) - 100;
  const speed = 5; // pixels per frame
  const fallInterval = setInterval(() => {
    position += speed;
    noteElement.style.top = position + "px";

    // Delete the note when it goes offscreen
    if (position > window.innerHeight) {
      noteElement.remove();
      clearInterval(fallInterval);
    }
  }, 1000 / fps);
}

lane1.appendChild(note);
handleNote(note);
