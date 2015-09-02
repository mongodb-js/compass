var app = require('app');
var Menu = require('menu');
var debug = require('debug')('scout-electron:menu');

function getTemplate(_window) {
  if (process.platform === 'darwin') {
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
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'Command+Z',
            selector: 'undo:'
          },
          {
            label: 'Redo',
            accelerator: 'Shift+Command+Z',
            selector: 'redo:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Cut',
            accelerator: 'Command+X',
            selector: 'cut:'
          },
          {
            label: 'Copy',
            accelerator: 'Command+C',
            selector: 'copy:'
          },
          {
            label: 'Paste',
            accelerator: 'Command+V',
            selector: 'paste:'
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            selector: 'selectAll:'
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Connect to...',
            accelerator: 'Command+N',
            click: function() {
              app.emit('show connect dialog');
            }
          },
          {
            label: 'Reload',
            accelerator: 'Command+R',
            click: function() {
              _window.restart();
            }
          },
          {
            label: 'Toggle DevTools',
            accelerator: 'Alt+Command+I',
            click: function() {
              _window.toggleDevTools();
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
              _window.webContents.send('message', 'menu-share-schema-json');
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
            selector: 'performMiniaturize:'
          },
          {
            label: 'Close',
            accelerator: 'Command+W',
            selector: 'performClose:'
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
  }

  return [
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
            _window.restart();
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+Ctrl+I',
          click: function() {
            _window.toggleDevTools();
          }
        }
      ]
    }
  ];
}

/**
 * @param {BrowserWindow} _window - The window to attach to.
 * @see https://github.com/atom/electron/blob/master/docs/api/menu.md
 */
module.exports = function(_window) {
  debug('attaching window menu');
  var template = getTemplate(_window);
  var menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
