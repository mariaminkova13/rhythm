import { songSetup } from "./song.js";
import { parseNotemap } from "./notemapReader.js";
import osuCursor from "./style/cursor/src/osu-cursor.js";

export { songFilePath };
let songFilePath;

var cursor = new osuCursor();

function audioFilter() {
  //TODO muffled & lo-fi echoey filter
}

function song(songParameter) {
  songFilePath = songParameter;
  songSetup();

  // Read the notemap after songFilePath is set
  parseNotemap(songFilePath).then((data) => {
    console.log("bpm:", data.head.bpm);
    console.log("body:", data.body);
  });
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

  //FIXME reappear titlebar when unfulscreen
  //FIXME make buttons work in fullscreen not maximize
  //FIXME border
  //FIXME borderbox
  // Handle fullscreen changes
  const win = remote.BrowserWindow.getFocusedWindow();
  win.on("enter-full-screen", () => {
    songprogressUp();
  });

  win.on("maximize", () => {
    songprogressUp();
  });

  win.on("leave-full-screen", () => {
    songprogressDown();
  });

  win.on("unmaximize", () => {
    songprogressDown();
  });

  document.getElementById("minimizeBtn").addEventListener("click", () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
  });

  document.getElementById("maximizeBtn").addEventListener("click", () => {
    const win = remote.BrowserWindow.getFocusedWindow();
    console.log("maximize");
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  document.getElementById("closeBtn").addEventListener("click", () => {
    remote.BrowserWindow.getFocusedWindow().close();
  });

  /////////////AUDIO FILTER

  win.on("minimize", () => {
    //enable filter
  });

  win.on("unminimize", () => {
    //disable filter
  });

  songprogressDown();
}

addEventListener("DOMContentLoaded", () => {
  initializeWindowControls();

  fetch("markup/albumsMenu.html")
  .then((response) => response.text())
  .then((html) => {
    document.getElementById("allthestuff").innerHTML = html;
  });

  // song("notemaps/notemap.txt");
});