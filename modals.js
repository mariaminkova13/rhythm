import { beatLength, music, musicstart } from "./song.js";
import anime from "/node_modules/animejs/lib/anime.es.js";
export { showModal, countdown, pause, unpause, paused, showDeathMsg }

var paused

function countdown() {
  paused = true
  const countdowncircle = document.createElement("countdowncircle");
  const countdownElement = document.createElement("countdownnumber");
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  const polygon = document.createElementNS(svgNS, "polygon");

  const numbers = ["3", "2", "1"];
  let index = 0;
  let startTime = Date.now();
  let animationFrame;

  polygon.setAttribute("fill", "rgba(255, 255, 255, 0.5)");
  svg.appendChild(polygon);

  countdownElement.textContent = numbers[0];
  countdownElement.appendChild(svg);
  document.body.appendChild(countdowncircle);
  countdowncircle.appendChild(countdownElement);

  // Function to calculate polygon points based on percentage
  function getPoints(w, h, percent) {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 3 * Math.min(w, h) / 2;
    // Start from center
    let points = [`${centerX},${centerY}`];
    // Start point at top
    points.push(`${centerX},${-h}`);

    // Add corner points as we sweep clockwise
    if (percent > 12.5) points.push(`${w * 2},${-h}`); // Top-right corner
    if (percent > 37.5) points.push(`${w * 2},${h * 2}`); // Bottom-right corner
    if (percent > 62.5) points.push(`${-w},${h * 2}`); // Bottom-left corner
    if (percent > 87.5) points.push(`${-w},${-h}`); // Top-left corner

    // Calculate the current point on the circle edge
    const angleInRadians = (percent / 100) * 2 * Math.PI;
    const x = centerX + radius * Math.sin(angleInRadians);
    const y = centerY - radius * Math.cos(angleInRadians);

    points.push(`${x},${y}`);
    return points.join(" ");
  }

  function animateSweep() {
    const now = Date.now();
    const elapsed = now - startTime;
    const percent = Math.min((elapsed / beatLength) * 100, 100);

    const rect = countdownElement.getBoundingClientRect();
    polygon.setAttribute("points", getPoints(rect.width, rect.height, percent));

    if (percent < 100) {
      animationFrame = requestAnimationFrame(animateSweep);
    }
  }

  animateSweep();

  // Cycle through numbers
  const countdownInterval = setInterval(() => {
    index++;

    if (index < numbers.length) {
      // Reset for next number
      startTime = Date.now();
      countdownElement.textContent = numbers[index];
      countdownElement.appendChild(svg);
      animateSweep();
    } else {
      // Clean up
      cancelAnimationFrame(animationFrame);
      countdowncircle.remove();
      clearInterval(countdownInterval);

      // Start music
      if (music && paused == true && musicstart == true) {
        music.play()
      }

      paused = false;
    }
  }, beatLength);
}

function pauseMusic() {
  if (music) { music.pause() }
}

function pause() {
  if (paused) return;
  document.querySelector("countdowncircle")?.remove();
  pauseMusic();
  showModal("pausemodal");
  paused = true;
}

function unpause() {
  document.body.style.cursor = "none";
  if (!paused) return;
  console.log('unpause')
  hideModal("pausemodal");
  countdown();
}

function showDeathMsg() {
  document.getElementById('hpbar').remove()
  showModal("deathmsg")
}

function showModal(modalId) {
  //TODO why so much lag when change cursor. also remove actual cursor when cursor pointer
  document.body.style.cursor = "default"; //TODO fix customcursor at first
  const modal = document.getElementById(modalId)
  modal.style.visibility = "visible"
  anime({
    targets: modal,
    opacity: [0.5, 1],
    duration: 150,
    easing: 'linear'
  });
}

function hideModal(modalId) {
  document.getElementById(modalId).style.visibility = "hidden";
  document.body.style.cursor = "none";
}