const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const runner = require('mongodb-runner');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1200, height: 800 });
  mainWindow.loadURL(`file://${__dirname}/../renderer/index.html`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  runner({ port: 27018, action: 'start' }, () => {
    createWindow();
  });
});

app.on('window-all-closed', () => {
  runner({ port: 27018, action: 'stop' }, () => {
    app.quit();
  });
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
