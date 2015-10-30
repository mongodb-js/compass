var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');

var menu = (function() {
  return {
    init: function() {
      /* eslint-disable no-extra-parens */
      var menu = (process.platform == 'darwin')
        ? darwinMenu() : nonDarwinMenu();
      /* eslint-enable no-extra-parens */
      menu = Menu.buildFromTemplate(menu);
      Menu.setApplicationMenu(menu);
    }
  };
}());

module.exports = menu;

// menus
function darwinMenu() {
  return [
    {
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
    },
    connectSubMenu(),
    {
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
    },
    viewSubMenu(),
    shareSubMenu(),
    {
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
    }
  ];
};

function genericMenu() {
  return [
    {
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
    },
    connectSubMenu(),
    viewSubMenu(),
    shareSubMenu()
  ];
};

// submenus
function connectSubMenu() {
  return {
    label: 'Connect',
    submenu: [
      {
        label: 'Connect to...', // todo: hide if there's a connect window
        accelerator: 'CmdOrCtrl+N',
        click: function() {
          app.emit('show connect dialog');
        }
      }
    ]
  };
}

function quitSubMenu() {
  return {
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click: function() {
      app.quit();
    }
  };
}

function shareSubMenu() {
  return {
    label: 'Share',
    submenu: [
      {
        label: 'Share Schema as JSON', // show if there's a schema to share
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