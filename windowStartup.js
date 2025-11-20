const { app, BrowserWindow, Menu, MenuItem, ipcMain } = require("electron");
const { spawn } = require("child_process");

require("@electron/remote/main").initialize();

let mainWindow;
let pythonServer = null;
const PORT = 8000;

// Function to start the Python server
function startPythonServer() {
  if (pythonServer) {
    pythonServer.kill();
  }

  return new Promise((resolve, reject) => {
    console.log("Starting Python server...");

    // Spawn the Python server process
    pythonServer = spawn("python", ["server.py", PORT.toString()], {
      cwd: __dirname,
      stdio: "pipe",
    });

    pythonServer.stdout.on("data", (data) => {
      console.log(`Python server: ${data}`);
      // When we see the server is running message, resolve the promise
      if (data.toString().includes("Server is running")) {
        resolve();
      }
    });

    pythonServer.stderr.on("data", (data) => {
      console.error(`Python server error: ${data}`);
    });

    pythonServer.on("error", (error) => {
      console.error("Failed to start Python server:", error);
      reject(error);
    });

    pythonServer.on("close", (code) => {
      console.log(`Python server exited with code ${code}`);
    });

    // Timeout if server doesn't start in 5 seconds
    setTimeout(() => resolve(), 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hidden",
    ...(process.platform !== "darwin" ? { titleBarOverlay: false } : {}),
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      enableRemoteModule: true,
      // icon: 'icons/logo.ico'
    },
  });
  require("@electron/remote/main").enable(mainWindow.webContents);
  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  //development stuff
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.session.clearCache();
}

// Start the app: first start Python server, then create window
app.whenReady().then(async () => {
  try {
    await startPythonServer();
    createWindow();
  } catch (error) {
    console.error("Failed to start server:", error);
    app.quit();
  }
});

app.on("window-all-closed", function () {
  // Kill the Python server when closing
  if (pythonServer) {
    pythonServer.kill();
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (pythonServer) {
    pythonServer.kill();
  }
});