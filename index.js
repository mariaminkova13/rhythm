import { songSetup } from "./song.js";
import { initializeTileEffects, loadStartPage } from "./markup/MenuFX.js";
import Cursor from "./style/cursor/cursor.js";
export { avg, median, audioFilter, loadAlbumMenu }
const yaml = require("yaml");

export { songFilePath };
let songFilePath;

var cursor = new Cursor();

const AdaptiveNoteSpeedPreference = 'true'

/////////////AUDIO FILTER
async function audioFilter(audio) {
  const ctx = new AudioContext();
  const src = ctx.createMediaElementSource(audio);

  // Low-pass filter
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1200;

  const lowshelf = ctx.createBiquadFilter();
  lowshelf.type = "lowshelf";
  lowshelf.frequency.value = 165;

  // Bitcrusher node
  await ctx.audioWorklet.addModule("style/bitcrusher-processor.js");
  const crusher = new AudioWorkletNode(ctx, "bitcrusher-processor", {});
  src.connect(lowpass).connect(crusher).connect(lowshelf).connect(ctx.destination);
}

function initializeWindowControls() {
  function songprogressUp() {
    titlebar.style.visibility = "hidden";
    controlButtonDiv.style.visibility = "visible";
    titlebar.style.position = "fixed";
    titlebar.style.cursor = "none";
    controlButtonDiv.style.opacity = "0";
    appContainer.style.border = "none";
    appContainer.style.height = "100%";

    controlButtonDiv.addEventListener("mouseover", mouseoverHandler);
    controlButtonDiv.addEventListener("mouseout", mouseoutHandler);
  }

  function songprogressDown() {
    titlebar.style.opacity = "1";
    titlebar.style.visibility = "visible";
    titlebar.style.cursor = "default";
    titlebar.style.position = "absolute";
    controlButtonDiv.style.opacity = "1";
    appContainer.style.height = "calc(100% - var(--titlebarheight))";

    appContainer.style.border = "4px solid var(--titlebarcolor)";
    appContainer.style.borderTop = "none";

    controlButtonDiv.removeEventListener("mouseover", mouseoverHandler);
    controlButtonDiv.removeEventListener("mouseout", mouseoutHandler);
  }

  /// titling
  var appTitle = "Rhythmata!";
  const gameName = document.getElementById("gameName");
  gameName.innerText = appTitle;
  document.title = appTitle;

  // Window control buttons
  const remote = require("@electron/remote");
  const titlebar = document.querySelector("titlebar");
  const songprogress = document.querySelector("songprogress");
  const controlButtonDiv = document.querySelector("controlbuttondiv");
  const appContainer = document.getElementById("appContainer");

  // Store event listeners for removal
  const mouseoverHandler = () => {
    controlButtonDiv.style.opacity = "1";
  };
  const mouseoutHandler = () => {
    controlButtonDiv.style.opacity = "0";
  };

  const win = remote.BrowserWindow.getFocusedWindow();

  win.on("maximize" || "enter-full-screen", () => {
    songprogressUp();
  });

  win.on("unmaximize" || "leave-full-screen", () => {
    songprogressDown();
  });

  document.getElementById("minimizeBtn").addEventListener("click", () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
  });

  document.getElementById("maximizeBtn").addEventListener("click", () => {
    const win = remote.BrowserWindow.getFocusedWindow();
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  document.getElementById("closeBtn").addEventListener("click", () => {
    remote.BrowserWindow.getFocusedWindow().close();
  });

  songprogressDown();
}

async function loadAlbumMenu() {
  var response = await fetch("markup/albumsMenu.html");
  allthestuff.innerHTML = await response.text();

  const parsedYaml = await yaml.parse(await (await fetch("markup/albums.yaml")).text());

  for (const albumName in parsedYaml) {
    const albumtile = document.createElement("div")
    albumtile.classList.add("tile")
    const thisTile = tileContainer.appendChild(albumtile)
    thisTile.setAttribute("id", albumName)
    thisTile.setAttribute("data-image", parsedYaml[albumName]['cover-image'])

    const menubutton = document.createElement('button')
    menubutton.classList.add('menubutton')
    menubutton.onclick = function () { songSetup(parsedYaml[albumName]['contents']['notemap'], parsedYaml[albumName]['contents']['audio'], AdaptiveNoteSpeedPreference) }
    thisTile.appendChild(menubutton)

    const title = document.createElement('h1')
    title.innerText = albumName
    thisTile.appendChild(title)
  }

  initializeTileEffects();
}

addEventListener("DOMContentLoaded", async () => {
  initializeWindowControls();

  // FIXME connect all future audio to filter
  // const filterInput = await audioFilter();
  // function patchAudioElement(audio) {
  //   const src = ctx.createMediaElementSource(audio);
  //   src.connect(filterInput);
  // }
  // const observer = new MutationObserver(mutations => {
  //   for (const m of mutations) {
  //     for (const node of m.addedNodes) {
  //       if (node.tagName === "AUDIO") {
  //         patchAudioElement(node);
  //       }
  //     }
  //   }
  // });

  // observer.observe(document.body, { childList: true, subtree: true });

  await loadStartPage()
  document.getElementById("startsingleplayer").onclick = async function () {
    await loadAlbumMenu()
  };
});

const avg = data => {
  if (data.length < 1) {
    return;
  }
  return data.reduce((prev, current) => prev + current) / data.length;
};

function median(array) {
  var concat = array;
  concat = concat.sort(
    function (a, b) { return a - b });
  var length = concat.length;
  if (length % 2 == 1) {
    return concat[(length / 2) - .5]

  }
  else {
    return (concat[length / 2]
      + concat[(length / 2) - 1]) / 2;
  }
}