//https://codepen.io/amit_sheen/pen/oKaabp
//https://codepen.io/paulita_p/pen/gLqLZr

let spinner = null;

export function countdown() {
  spinner = document.createElement("spinner");
  const countdownElement = document.createElement("countdownnumber");
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  const polygon = document.createElementNS(svgNS, "polygon");

  let numbers = ["3", "2", "1", "GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO","GO"];
  let index = 0;
  let startTime = Date.now();
  let animationFrame;

  // Setup SVG
  // svg.setAttribute("width", "110%");
  // svg.setAttribute("height", "110%");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.pointerEvents = "none";
  svg.style.clipPath = "circle(50% at 50% 50%)";
  svg.style.zIndex = "-1";

  polygon.setAttribute("fill", "rgba(255, 255, 255, 0.5)");
  svg.appendChild(polygon);

  countdownElement.textContent = numbers[0];
  countdownElement.appendChild(svg);
  document.body.appendChild(spinner);
  spinner.appendChild(countdownElement);

  // Function to calculate polygon points based on percentage
  function getPoints(w, h, percent) {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2;
    // Start from center
    let points = [`${centerX},${centerY}`];
    // Start point at top
    points.push(`${centerX},0`);

    const angleInRadians = (percent / 100) * 2 * Math.PI;

    // Add corner points as we sweep clockwise
    if (percent > 12.5) points.push(`${w},0`); // Top-right corner
    if (percent > 37.5) points.push(`${w},${h}`); // Bottom-right corner
    if (percent > 62.5) points.push(`0,${h}`); // Bottom-left corner
    if (percent > 87.5) points.push(`0,0`); // Top-left corner

    // Calculate the current point on the circle edge
    const x = centerX + radius * Math.sin(angleInRadians);
    const y = centerY - radius * Math.cos(angleInRadians);

    points.push(`${x},${y}`);

    return points.join(" ");
  }

  // Animate the polygon sweep (like animate_countdown)
  function animateSweep() {
    const now = Date.now();
    const elapsed = now - startTime;
    const percent = Math.min((elapsed / 1000) * 100, 100);

    const rect = countdownElement.getBoundingClientRect();
    polygon.setAttribute("points", getPoints(rect.width, rect.height, percent));

    if (percent < 100) {
      animationFrame = requestAnimationFrame(animateSweep);
    }
  }

  // Start animation
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
      spinner.remove();
      clearInterval(countdownInterval);
    }
  }, 1000);
}

export var paused = false;
const blurring = document.createElement("blurring");

export function pause() {
  if (paused) return; // Don't pause if already paused
  if (spinner) {spinner.remove();}

  paused = true;
  document.body.appendChild(blurring);
  document.documentElement.style.setProperty(
    "--pausemodalvisibility",
    "visible"
  );
  document.documentElement.style.setProperty("--cursor", "default");
}

export function unpause() {
  if (!paused) return; // Don't unpause if not paused

  paused = false;
  document.body.removeChild(blurring);
  document.documentElement.style.setProperty(
    "--pausemodalvisibility",
    "hidden"
  );
  document.documentElement.style.setProperty("--cursor", "none");
  countdown();
}

export function showDeathMsg() {
  document.body.appendChild(blurring);
  document.documentElement.style.setProperty("--cursor", "default");
  document.documentElement.style.setProperty("--deathmsgvisibility", "visible");
}