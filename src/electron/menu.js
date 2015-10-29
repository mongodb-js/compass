var app = require('app');
var Menu = require('menu');

var menu = (function() {
  return {
    init: function(window) {
      /* eslint-disable no-extra-parens */
      var menu = (process.platform == 'darwin')
        ? darwinMenu(window) : nonDarwinMenu(window);
      /* eslint-enable no-extra-parens */
      menu = Menu.buildFromTemplate(menu);
      Menu.setApplicationMenu(menu);
    }
  };
}());

module.exports = menu;

// menus
function darwinMenu(window) {
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
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Connect',
      submenu: [
        {
          label: 'Connect to...',
          accelerator: 'Command+N',
          click: function() {
            app.emit('show connect dialog');
          }
        }
      ]
    },
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
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: function() {
            window.restart();
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+Command+I',
          click: function() {
            window.toggleDevTools();
          }
        }
      ]
    },

    {
      label: 'Share',
      submenu: [
        {
          label: 'Share Schema as JSON',
          accelerator: 'Alt+Command+S',
          click: function() {
            window.webContents.send('message', 'menu-share-schema-json');
          }
        }
      ]
    },
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

function genericMenu(window) {
  return [
    {
      label: 'MongoDB Compass',
      submenu: [
        {
          label: 'About Compass',
          click: function() {
            app.emit('show windows about dialog');
          }
        },
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Connect to...',
          accelerator: 'Ctrl+N',
          click: function() {
            app.emit('show connect dialog');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Ctrl+Q',
          click: function() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Ctrl+R',
          click: function() {
            window.restart();
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+Ctrl+I',
          click: function() {
            window.toggleDevTools();
          }
        }
      ]
    }
  ];
};