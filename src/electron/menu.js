var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');

// submenus
function quitSubMenu() {
  return {
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click: function() {
      app.quit();
    }
  };
}

function darwinCompassSubMenu() {
  return {
    label: 'MongoDB Compass',
    submenu: [
      {
        label: 'About Compass',
        selector: 'orderFrontStandardAboutPanel:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide',
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      },
      {
        type: 'separator'
      },
      quitSubMenu()
    ]
  };
}

function connectSubMenu() {
  return {
    label: 'Connect',
    submenu: [
      {
        label: 'Connect to...',
        accelerator: 'CmdOrCtrl+N',
        click: function() {
          app.emit('show connect dialog');
        }
      }
    ]
  };
}

function editSubMenu() {
  return {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'Command+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'Command+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        role: 'selectall'
      }
    ]
  };
}

function nonDarwinCompassSubMenu() {
  return {
    label: 'MongoDB Compass',
    submenu: [
      {
        label: 'About Compass',
        click: function() {
          app.emit('show about dialog');
        }
      },
      quitSubMenu()
    ]
  };
}

function shareSubMenu() {
  return {
    label: 'Share',
    submenu: [
      {
        label: 'Share Schema as JSON',
        accelerator: 'Alt+CmdOrCtrl+S',
        click: function() {
          BrowserWindow.getFocusedWindow().webContents.send('message', 'menu-share-schema-json');
        }
      }
    ]
  };
}

function viewSubMenu() {
  return {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function() {
          BrowserWindow.getFocusedWindow().restart();
        }
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: function() {
          BrowserWindow.getFocusedWindow().toggleDevTools();
        }
      }
    ]
  };
}

function windowSubMenu() {
  return {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'Command+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'Command+W',
        role: 'close'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      }
    ]
  };
}

// menus
function darwinMenu(showShareSubMenu) {
  var m = [
    darwinCompassSubMenu(),
    connectSubMenu(),
    editSubMenu(),
    viewSubMenu(),
    windowSubMenu()
  ];
  if (showShareSubMenu) {
    m.splice(4, 0, shareSubMenu());
  }
  return m;
}

function nonDarwinMenu(showShareSubMenu) {
  var m = [
    nonDarwinCompassSubMenu(),
    connectSubMenu(),
    viewSubMenu()
  ];
  if (showShareSubMenu) {
    m.push(shareSubMenu());
  }
  return m;
}

// menu singleton
var menu = (function() {
  return {
    init: function() {
      var m;
      if (process.platform === 'darwin') {
        m = darwinMenu();
      } else {
        m = nonDarwinMenu();
      }
      m = Menu.buildFromTemplate(m);
      Menu.setApplicationMenu(m);
    },
    hideShareSubMenu: function() {

    },
    showShareSubMenu: function() {

    }
  };
}());

module.exports = menu;
