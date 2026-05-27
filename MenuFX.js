const { animate, scrambleText } = require('animejs');
import { songSetup } from "./song.js"
import { muffleAudio } from "./style/musicFX/audioFX.js";
import { initParticles } from "./style/dust.js";
import { parseSplashTexts } from "./utils/parser.js"
export { initializeTileEffects, loadStartPage, loadAlbumMenu, voicePath };
const yaml = require("yaml");
const { addCorners, Flat, Squircle } = require('@monokai/monoco')

let parsedYaml, currentCharacter, voicePath, audio
const buttonpress = new Audio('./assets/sfx/button.ogg')
const scrambleSpd = 80

async function loadAlbumMenu() {
  var response = await fetch("markup/albumsMenu.html");
  allthestuff.innerHTML = await response.text();

  addCorners(document.getElementById('startButton'), {
    smoothing: 1,
    borderRadius: 32,
    clip: true,
    cornerType: Flat
  })

  parsedYaml = await yaml.parse(await (await fetch("markup/albums.yaml")).text());

  for (const albumName in parsedYaml) {
    const albumtile = document.createElement("div")
    albumtile.classList.add("tile")
    const thisTile = tileContainer.appendChild(albumtile)
    thisTile.setAttribute("id", albumName)
    thisTile.setAttribute("data-image", parsedYaml[albumName]['cover-image'])

    const title = document.createElement('h1')
    title.innerText = albumName
    thisTile.appendChild(title)
  }

  initializeTileEffects();

  document.getElementById('returnBtn').onclick = function () {
    audio?.pause()
    loadStartPage()
    buttonpress.play()
  }
}

//TODO make it normal scrolling and not press and hold. maybe use rellax.js

const scaleMultiplier = "1.15";
const startPgMovement = 15

function initializeTileEffects() {
  const tileContainer = document.getElementById("tileContainer");
  const tiles = document.querySelectorAll(".tile");
  const sidebar = document.getElementById('songInfo')

  const appContainerRect = document.getElementById('appContainer').getBoundingClientRect();
  const appCenter = appContainerRect.y + appContainerRect.height / 2;

  function initializeParallax() {
    tileContainer.onscroll = (e) => {
      requestAnimationFrame(updateCenteredTile);
      let percentage = (tileContainer.scrollTop / (tileContainer.scrollHeight - tileContainer.clientHeight)) * 100
      Array.from(tileContainer.getElementsByClassName("photo")).forEach((photo) => {
        photo.style.backgroundPosition = `50% ${percentage}%`
      });
    }
  };

  function updateCenteredTile() {
    let closest = null;
    let closestDistance = Infinity;

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
      let prevClosest = document.querySelector('[selected]');
      tiles.forEach(t => t.removeAttribute('selected'));
      closest.setAttribute('selected', '');
      if (closest != prevClosest) { updateSidebar(closest) }
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

    tile.onclick = (e) => { //TODO await done so that no flashing intermediate tileinfos
      tile.scrollIntoView({
        behavior: "smooth", //make faster
        block: "center",
        container: "nearest"
      });
    }
  });

  initializeParallax()
  const channelSwitch = new Audio('./assets/sfx/channel_switch.ogg')
  function updateSidebar(tile) {
    channelSwitch.play()
    let albumName = tile.getAttribute('id')
    document.getElementById('startButton').onclick = async function () {
      audio.pause();
      await songSetup(parsedYaml[albumName]['notemap'], parsedYaml[albumName]['audio'], 'true')
    }
    animate(document.getElementById('songArtist'), {
      innerHTML: scrambleText({
        text: parsedYaml[albumName]['composer'],
        settleDuration: scrambleSpd
      })
    });
    document.getElementById('songCover').setAttribute('src', parsedYaml[albumName]['cover-image'])
    addCorners(document.getElementById('songCover'), {
      smoothing: 1,
      borderRadius: 32,
      clip: true,
      cornerType: Flat,
    })

    addCorners(document.getElementById('coverBg'), {
      smoothing: 1,
      borderRadius: 32,
      clip: true,
      cornerType: Flat,
    })

    // document.getElementById('songTitle').innerText = albumName
    animate(document.getElementById('songTitle'), {
      innerHTML: scrambleText({
        text: albumName,
        settleDuration: scrambleSpd
      })
    });
    audio?.pause()
    audio = new Audio(parsedYaml[albumName]['audio']);
    audio.addEventListener("loadedmetadata", () => {
      animate(document.getElementById('songLength'), {
        innerHTML: scrambleText({
          text: `${Math.floor(audio.duration / 60)}:${Math.round(audio.duration % 60)}`,
          settleDuration: scrambleSpd
        })
      });
    });
    audio.play()
    muffleAudio(audio)
  }
}
const lobbysongs = ['./assets/ww.mp3', './assets/And bliss everywhere bliss.mp3']
async function loadStartPage() {
  allthestuff.innerHTML = await (await fetch("markup/startpage.html")).text()
  initParticles();
  const lobbymusic = new Audio(lobbysongs[Math.floor(Math.random() * lobbysongs.length)])
  lobbymusic.play()
  muffleAudio(lobbymusic)

  const texture = document.getElementById('texture-canvas')
  function updatebg(e) {
    const rect = texture.getBoundingClientRect();
    const width = rect.right - rect.left
    const height = rect.bottom - rect.top
    const x =
      (((width - e.pageX) - rect.left - window.scrollX) / texture.offsetWidth) * startPgMovement;
    const y =
      (((height - e.pageY) - rect.top - window.scrollY) / texture.offsetHeight) * startPgMovement;
    texture.style.transformOrigin = (100 - x) + "% " + (100 - y) + "%";
  }
  window.addEventListener("mousemove", function (e) {
    updatebg(e)
  });
  window.addEventListener("mouseover", function (e) {
    updatebg(e)
  });

  //TODO fix window resize

  addCorners(document.getElementById('startsingleplayer'), {
    smoothing: 1,
    borderRadius: 32,
    clip: true,
    cornerType: Flat
  }) //do forEach in array?

  addCorners(document.getElementById('startmultiplayer'), {
    smoothing: 1,
    borderRadius: 32,
    clip: true,
    cornerType: Flat
  })

  const parsedTexts = await parseSplashTexts()
  const randomIndex = Math.floor(Math.random() * parsedTexts.length);
  document.getElementById('splashText').innerText = parsedTexts[randomIndex].trim();

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

    animate(targetObj, {
      translateX: (relX - boundingRect.width / 2) / boundingRect.width * force,
      translateY: (relY - boundingRect.height / 2) / boundingRect.height * force,
      duration: speed
    });
  });

  target.addEventListener('mouseout', function () {
    animate(targetObj, {
      translateX: 0,
      translateY: 0,
      duration: speed,
    });
  });

  document.getElementById("startsingleplayer").onclick = async function () {
    lobbymusic.pause()
    await loadAlbumMenu()
    buttonpress.play()
  };

  const parsedYaml = await yaml.parse(await (await fetch("markup/characters.yaml")).text());
  const characterSelection = document.getElementById('characterSelection')
  const total = Object.keys(parsedYaml).length
  const viewport = document.querySelector('.carousel__viewport')
  let i = 0

  for (const characterName in parsedYaml) {
    const slideNum = i + 1
    const prevNum = i === 0 ? total : i
    const nextNum = i === total - 1 ? 1 : slideNum + 1

    const template = document.createElement('template')
    template.innerHTML = `
      <li id="carousel__slide${slideNum}" tabindex="0" class="carousel__slide">
        <div class="carousel__snapper">
          <a href="#carousel__slide${prevNum}" class="carousel__prev"></a>
          <a href="#carousel__slide${nextNum}" class="carousel__next"></a>
        </div>
        <h1>${characterName}</h1>
      </li>
    `
    viewport.appendChild(template.content.firstElementChild);

    const portrait = document.createElement("div")
    portrait.classList.add("portrait")
    const thisTile = characterSelection.appendChild(portrait)
    if (i == 0) {
      thisTile.setAttribute('selected', '');
      voicePath = parsedYaml[characterName]['voice']
    }
    thisTile.onclick = function () {
      document.querySelectorAll('.portrait').forEach(t => t.removeAttribute('selected'));
      thisTile.setAttribute('selected', '');
      voicePath = parsedYaml[characterName]['voice']
    }
    const label = document.createElement('span')
    label.textContent = characterName
    thisTile.appendChild(label)
    i++
  }
}