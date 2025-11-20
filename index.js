// Window control buttons
const remote = require("@electron/remote");
const titlebar = document.getElementById("custom-titlebar");

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