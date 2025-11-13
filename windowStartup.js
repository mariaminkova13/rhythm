// Creating a window https://www.geeksforgeeks.org/how-to-create-a-desktop-app-using-javascript/
console.clear();

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
    titleBarStyle: 'hidden',
    ...(process.platform !== "darwin" ? { titleBarOverlay: false } : {}),
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    // icon: 'icons/logo.ico'
  });
  require("@electron/remote/main").enable(mainWindow.webContents);

  // Clear cache before loading (helpful during development)
  mainWindow.webContents.session.clearCache();

  // Load from the Python server instead of a local file
  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.webContents.openDevTools();
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
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

// Clean up Python server on quit
app.on("before-quit", () => {
  if (pythonServer) {
    pythonServer.kill();
  }
});

///////webGL
// const canvas = document.getElementById('glcanvas');
// const gl = canvas.getContext('webgl');

// if (!gl) {
//     alert("Unable to initialize WebGL. Your browser may not support it.");
// }
