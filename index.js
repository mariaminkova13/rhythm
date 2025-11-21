// Window control buttons
const remote = require("@electron/remote");
const titlebar = document.getElementById("custom-titlebar");
const songprogress = document.querySelector("songprogress");

// Handle fullscreen changes
const win = remote.BrowserWindow.getFocusedWindow();
win.on("enter-full-screen", () => {
  document.body.classList.add("is-fullscreen");
  if (songprogress) {
    songprogress.style.position = "fixed";
    songprogress.style.top = "0";
  }
});

win.on("leave-full-screen", () => {
  document.body.classList.remove("is-fullscreen");
  if (songprogress) {
    songprogress.style.position = "";
    songprogress.style.top = "";
  }
});

document.getElementById("minimizeBtn").addEventListener("click", () => {
  remote.BrowserWindow.getFocusedWindow().minimize();
});

document.getElementById("maximizeBtn").addEventListener("click", () => {
  const win = remote.BrowserWindow.getFocusedWindow();
  console.log('maximize')
  if (win.isMaximized()) {
    win.unmaximize();
    titlebar.style.visibility = "visible";
  } else {
    win.maximize();
    titlebar.style.visibility = "hidden";
  }
});

document.getElementById("closeBtn").addEventListener("click", () => {
  remote.BrowserWindow.getFocusedWindow().close();
});