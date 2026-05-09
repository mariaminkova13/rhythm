import { loadStartPage } from "./MenuFX.js";
// import Cursor from "./style/cursor/cursor.js";
export { avg, median }
export { songFilePath };
let songFilePath;

// new Cursor();
const AdaptiveNoteSpeedPreference = 'true'

function initializeWindowControls() {
  function fullscreenLayout() {
    titlebar.style.visibility = "hidden";
    controlButtonDiv.style.visibility = "visible";
    titlebar.style.position = "fixed";
    titlebar.style.cursor = "none";
    controlButtonDiv.style.cursor = "pointer"
    controlButtonDiv.style.opacity = "0";
    appContainer.style.border = "none";
    appContainer.style.height = "100%";

    controlButtonDiv.addEventListener("mouseover", mouseoverHandler);
    controlButtonDiv.addEventListener("mouseout", mouseoutHandler);
  }

  function partscreenLayout() {
    titlebar.style.opacity = "1";
    titlebar.style.visibility = "visible";
    titlebar.style.cursor = "default";
    titlebar.style.position = "absolute";
    controlButtonDiv.style.opacity = "1";
    appContainer.style.height = "calc(100% - 30px)";

    appContainer.style.border = "4px solid var(--bordercolor)";
    appContainer.style.borderTop = "none";

    controlButtonDiv.removeEventListener("mouseover", mouseoverHandler);
    controlButtonDiv.removeEventListener("mouseout", mouseoutHandler);
  }

  /// titling
  document.title = 'Rhythm Game';

  // Window control buttons
  const remote = require("@electron/remote");
  const titlebar = document.getElementById("titlebar");
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
    fullscreenLayout();
  });

  win.on("unmaximize" || "leave-full-screen", () => {
    partscreenLayout();
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

  partscreenLayout();
}

addEventListener("DOMContentLoaded", async () => {
  initializeWindowControls();

  await loadStartPage()
  document.body.style.cursor = "default";
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