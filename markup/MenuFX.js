// https://codepen.io/l422y/pen/ngpaGB

import anime from "/node_modules/animejs/lib/anime.es.js";
import { showModal } from "../modals.js"
export { initializeTileEffects, loadStartPage };

const scaleMultiplier = "1.1";
const scrollFactor = 1.2;

function initializeTileEffects() {
  const tileContainer = document.getElementById("tileContainer");

  // Get all tile elements
  const tiles = document.querySelectorAll(".tile");

  function initializeParallax() {

    const handleMouseDown = (e) => {
      tileContainer.dataset.mouseDownAt = e.clientX;
    };

    const handleMouseMove = (e) => {
      if (tileContainer.dataset.mouseDownAt == 0 || !tileContainer) return;
      //TODO optimize; instead of return when !tilecontainer, remove event listener when not in album menu

      const mouseDelta =
        parseFloat(tileContainer.dataset.mouseDownAt) - e.clientX,
        maxDelta = window.innerWidth / scrollFactor;

      const percentage = ((mouseDelta / maxDelta) * 100) * -1,
        prevPercentage = parseFloat(tileContainer.dataset.prevPercentage) || 0,
        nextPercentageUnclamped = prevPercentage + percentage;

      // Calculate max scroll based on container width
      const containerWidth = tileContainer.scrollWidth;
      const viewportWidth = window.innerWidth;
      const maxScroll = -((containerWidth - viewportWidth) / containerWidth) * 100;
      const nextPercentage = Math.max(Math.min(nextPercentageUnclamped, 0), maxScroll);
      tileContainer.dataset.percentage = nextPercentage;
      tileContainer.animate({
        transform: `translateX(${nextPercentage}%)`
      }, {
        duration: 1200, fill: "forwards"
      });

      Array.from(tileContainer.getElementsByClassName("photo")).forEach((photo) => {
        photo.animate({
          backgroundPosition: `${100 + nextPercentage}% 50%`
        }, {
          duration: 1200, fill: "forwards"
        });
      });
    };

    const handleMouseUp = () => {
      tileContainer.dataset.mouseDownAt = 0;
      tileContainer.dataset.prevPercentage = tileContainer.dataset.percentage;
    };

    // Initialize prevPercentage
    tileContainer.dataset.mouseDownAt = 0;
    tileContainer.dataset.prevPercentage = 0;
    tileContainer.dataset.percentage = 0;
    tileContainer.dataset.nextPercentage = 0;

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  tiles.forEach(function (tile) {
    // Skip if already initialized
    if (tile.dataset.vfxInitialized) return;
    tile.dataset.vfxInitialized = "true";

    // Add a photo container
    const photoDiv = document.createElement("div");
    photoDiv.className = "photo";
    tile.appendChild(photoDiv);

    // Set up background image based on data-image attribute
    const dataImage = tile.getAttribute("data-image");
    if (dataImage) {
      photoDiv.style.backgroundImage = "url(" + dataImage + ")";
    }
    const photo = tile.querySelector(".photo");

    // Tile mouse actions
    tile.addEventListener("mouseover", function () {
      photo.style.transform = "scale(" + scaleMultiplier + ")";
    });

    tile.addEventListener("mouseout", function () {
      photo.style.transform = "scale(1)";
    });

    tile.addEventListener("mousemove", function (e) {
      const rect = this.getBoundingClientRect();
      const x =
        ((e.pageX - rect.left - window.scrollX) / this.offsetWidth) * 100;
      const y =
        ((e.pageY - rect.top - window.scrollY) / this.offsetHeight) * 100;
      photo.style.transformOrigin = x + "% " + y + "%";
    });
  });

  // no parallax scroll if no scroll
  if (tileContainer.getBoundingClientRect().width <= tileContainer.parentElement.getBoundingClientRect().width) { tileContainer.style.justifyContent = "space-evenly" }
  else { initializeParallax() }
}

async function loadStartPage() {
  allthestuff.innerHTML = await (await fetch("markup/startpage.html")).text()

  const appContainer = document.getElementById("appContainer");
  appContainer.style.cursor = "default"

  const target = document.getElementById('title');
  const targetObj = document.getElementById('title-obj')
  var force = 40;
  var speed = 300;
  target.addEventListener('mousemove', function (e) {
    var boundingRect = this.getBoundingClientRect();
    var relX = e.pageX - boundingRect.left;
    var relY = e.pageY - boundingRect.top;

    anime({
      targets: targetObj,
      translateX: (relX - boundingRect.width / 2) / boundingRect.width * force,
      translateY: (relY - boundingRect.height / 2) / boundingRect.height * force,
      duration: speed
    })
  });

  target.addEventListener('mouseout', function () {
    anime({
      targets: targetObj,
      translateX: 0,
      translateY: 0,
      duration: speed,
      // easings: 
    })
  });
}