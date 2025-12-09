//https://codepen.io/ccrch/pen/yyaraz
// https://www.youtube.com/watch?v=PkADl0HubMY
// https://codepen.io/l422y/pen/ngpaGB

export { initializeTileEffects };

const scaleMultiplier = "1.1";
const scrollFactor = 1.2;

function initializeTileEffects() {
  const tileContainer = document.getElementById("tileContainer");
  // Set data-image attributes for specific tiles if not already set
  // const album1 = document.getElementById("album1");
  // album1.setAttribute("data-image", "windowsdarkmode.jpg");

  // Get all tile elements
  const tiles = document.querySelectorAll(".tile");

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

  //// parallax scroll

  // tileContainer.onmousedown = (e) => {
  //   tileContainer.dataset.mouseDownAt = e.clientX;
  // }
  // tileContainer.onmousemove = (e) => {
  //   if (!tileContainer.dataset.mouseDownAt) return;
  //   const mouseDelta = parseFloat(tileContainer.dataset.mouseDownAt) - e.clientX,
  //     maxDelta = window.innerWidth / scrollFactor;
  //   const percentage = (mouseDelta / maxDelta) * 100,
  //     nextPercentage = parseFloat(tileContainer.dataset.prevPercentage) + percentage;
  //   tileContainer.dataset.percentage = nextPercentage;
  //   tileContainer.style.transform = `translateX(${nextPercentage * -1}%)`;
  // }
  // tileContainer.onmouseup = () => {
  //   tileContainer.dataset.mouseDownAt = null;
  //   tileContainer.dataset.prevPercentage = tileContainer.dataset.percentage;
  // }

  const handleMouseDown = (e) => {
    tileContainer.dataset.mouseDownAt = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!tileContainer.dataset.mouseDownAt) return;

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
    tileContainer.dataset.mouseDownAt = null;
    tileContainer.dataset.prevPercentage = tileContainer.dataset.percentage;
  };

  // Initialize prevPercentage
  tileContainer.dataset.prevPercentage = 0;
  tileContainer.dataset.percentage = 0;
  tileContainer.dataset.nextPercentage = 0;

  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  //TODO make the tiles behind border
}

//TODO make title page https://codepen.io/iamryanyu/pen/OBORdo and shake on click like OvO
