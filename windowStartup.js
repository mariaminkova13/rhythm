// Creating a window https://www.geeksforgeeks.org/how-to-create-a-desktop-app-using-javascript/
const { app, BrowserWindow, Menu, MenuItem, ipcMain } = require('electron');
require('@electron/remote/main').initialize();
let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        minWidth: 700,
        minHeight: 800,
        frame: false,
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        // icon: 'style/icons/pilcrow.ico'
    });
    require('@electron/remote/main').enable(mainWindow.webContents);
    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});