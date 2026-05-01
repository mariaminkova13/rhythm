const { app, BrowserWindow, ipcMain } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

require("@electron/remote/main").initialize();

let mainWindow;
let nodeServer = null;
const PORT = 8000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".yaml": "text/yaml",
  ".txt": "text/plain",
};

function startNodeServer() {
  return new Promise((resolve, reject) => {
    console.log("Starting Node server...");

    nodeServer = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url === "/" ? "index.html" : req.url).split("?")[0];
      const filePath = path.join(__dirname, urlPath);

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      });
    });

    nodeServer.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      resolve();
    });

    nodeServer.on("error", (err) => {
      console.error("Node server error:", err);
      reject(err);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    //900x600
    width: 1075,
    height: 800,
    minWidth: 1075,
    minHeight: 600,
    titleBarStyle: "hidden",
    ...(process.platform !== "darwin" ? { titleBarOverlay: false } : {}),
    roundedCorners: false,
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
    if (nodeServer) {
      nodeServer.close();
    }
    app.quit();
  });

  //development stuff
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.session.clearCache();
}

// Start the app: first start Node server, then create window
app.whenReady().then(async () => {
  try {
    await startNodeServer();
    createWindow();
  } catch (error) {
    console.error("Failed to start server:", error);
    app.quit();
  }
});

app.on("window-all-closed", function () {
  if (nodeServer) {
    nodeServer.close();
  }
  app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (nodeServer) {
    nodeServer.close();
  }
});