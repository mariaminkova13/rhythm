//https://codepen.io/ccrch/pen/yyaraz

export { initializeTileEffects };

const scaleMultiplier = "1.1";

function initializeTileEffects() {
  // Set data-image attributes for specific tiles if not already set
  const album1 = document.getElementById("album1");
  album1.setAttribute("data-image", "windowsdarkmode.jpg");

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
    photoDiv.style.backgroundImage = "url(" + dataImage + ")";
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
}
