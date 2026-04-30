import anime from "/node_modules/animejs/lib/anime.es.js";
export { initializeTileEffects, loadStartPage };

//TODO ok it works but why is nextPercentage more than 100 or less than 0\
//TODO make it normal scrolling and not press and hold. maybe use rellax.js

const scaleMultiplier = "1.15";

function initializeTileEffects() {
  const tileContainer = document.getElementById("tileContainer");
  const tiles = document.querySelectorAll(".tile");

  function initializeParallax() {
    tileContainer.onscroll = (e) => {
      requestAnimationFrame(updateCenteredTile);
      let percentage = (tileContainer.scrollTop / (tileContainer.scrollHeight - tileContainer.clientHeight)) * 100
      Array.from(tileContainer.getElementsByClassName("photo")).forEach((photo) => {
        photo.style.backgroundPosition = `50% ${percentage}%`
        // photo.animate({
        //   backgroundPosition: `50% ${percentage}%`
        // }, {
        //   duration: 300, fill: "forwards"
        // }); Too laggy
      });
    }
  };

  function updateCenteredTile() {
    let closest = null;
    let closestDistance = Infinity;

    const appContainerRect = document.getElementById('appContainer').getBoundingClientRect();
    const appCenter = appContainerRect.y + appContainerRect.height / 2;

    //TODO prevent holding up or down arrow and fix focus

    tiles.forEach(tile => {
      const rect = tile.getBoundingClientRect();
      const center = rect.y + rect.height / 2;
      const distance = Math.abs(center - appCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = tile;
      }
    });

    if (closest) {
      tiles.forEach(t => t.removeAttribute('selected'));
      closest.setAttribute('selected', '');
    }
  }

  tiles.forEach(function (tile) {
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

    tile.onclick = (e) => {
      tile.scrollIntoView({
        behavior: "smooth", //make faster
        block: "center"
      });
      tiles.forEach(tile => tile.removeAttribute('selected'));
      tile.setAttribute('selected', '');
    }
  });

  initializeParallax()
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
    })
  });
}