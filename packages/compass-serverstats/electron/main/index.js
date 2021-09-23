const electron = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { nodeIntegration: true }
  });
  mainWindow.loadURL(
    process.env.COMPASS_INDEX_RENDERER_URL ||
      pathToFileURL(path.resolve(__dirname, 'index.html')).toString()
  );
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
