const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

const MAIN = url.format({
  pathname: path.join(__dirname, 'index.html'),
  protocol: 'file:',
  slashes: true
});
const LOAD = url.format({
  pathname: path.join(__dirname, 'loading.html'),
  protocol: 'file:',
  slashes: true
});

let win;
let loadingWin;

function createWindow() {
  win = new BrowserWindow({ width: 800, height: 600, show: false });
  loadingWin = new BrowserWindow({ width: 800, height: 600 });

  ipcMain.on('loadingFinished', () => {
    /* eslint no-console:0 */
    console.log('LOADING FINISHED');
    if (loadingWin) {
      loadingWin.hide();
      loadingWin.close();
      win.show();
    }
  });

  win.loadURL(MAIN);
  loadingWin.loadURL(LOAD);

  win.on('closed', () => {
    win = null;
  });

  loadingWin.on('closed', () => {
    loadingWin = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
