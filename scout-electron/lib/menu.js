var app = require('app'),
  Menu = require('menu'),
  windows = require('./window-manager'),
  debug = require('debug')('scout-electron:menu');


app.on('ready', function() {
  var template, menu;

  if (process.platform === 'darwin') {
    template = [
      {
        label: 'Scout',
        submenu: [
          {
            label: 'About Scout',
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
          },
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
          },
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'Command+R',
            click: function() {
              windows.main.restart();
            }
          },
          {
            label: 'Enter Fullscreen',
            click: function() {
              windows.main.setFullscreen(true);
            }
          },
          {
            label: 'Toggle DevTools',
            accelerator: 'Alt+Command+I',
            click: function() {
              windows.main.toggleDevTools();
            }
          },
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'New Window',
            accelerator: 'Command+N',
            click: windows.create
          },
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
          },
        ]
      },
    ];
    debug('attaching app menu');
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open',
            accelerator: 'Ctrl+O',
          },
          {
            label: 'Close',
            accelerator: 'Ctrl+W',
            click: function() {
              windows.main.close();
            }
          },
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'Ctrl+R',
            click: function() {
              windows.main.restart();
            }
          },
          {
            label: 'Enter Fullscreen',
            click: function() {
              windows.main.setFullScreen(true);
            }
          },
          {
            label: 'Toggle DevTools',
            accelerator: 'Alt+Ctrl+I',
            click: function() {
              windows.main.toggleDevTools();
            }
          },
        ]
      },
    ];

    menu = Menu.buildFromTemplate(template);
    windows.main.setMenu(menu);
  }
});
