addEventListener("DOMContentLoaded", () => {
  
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

  // Store event listeners for removal
  const mouseoverHandler = () => {
    controlButtonDiv.style.opacity = "1";
    console.log("hhhhhh");
  };
  const mouseoutHandler = () => {
    controlButtonDiv.style.opacity = "0";
  };

  function songprogressUp() {
    titlebar.style.visibility = "hidden";
    controlButtonDiv.style.visibility = "visible";
    titlebar.style.cursor = "none";
    controlButtonDiv.style.opacity = "0";
    songprogress.style.position = "fixed";
    songprogress.style.top = "0";
    controlButtonDiv.addEventListener("mouseover", mouseoverHandler);
    controlButtonDiv.addEventListener("mouseout", mouseoutHandler);
  }

  function songprogressDown() {
    titlebar.style.opacity = "1";
    titlebar.style.visibility = "visible";
    titlebar.style.cursor = "default";
    controlButtonDiv.style.cursor = "default";
    controlButtonDiv.style.opacity = "1";
    songprogress.style.position = "";
    songprogress.style.top = "";
    controlButtonDiv.removeEventListener("mouseover", mouseoverHandler);
    controlButtonDiv.removeEventListener("mouseout", mouseoutHandler);
  }


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
  function audioFilter() {
    //TODO muffled & lo-fi echoey filter
  }

  win.on("minimize", () => {
    //enable filter
  });

  win.on("unminimize", () => {
    //disable filter
  });
});
