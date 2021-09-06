// based off of https://github.com/atom/atom/blob/master/src/browser/application-menu.coffee
// use js2.coffee to convert it to JS

var electron = require('electron');
var ipc = require('hadron-ipc');
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var app = electron.app;
var fs = require('fs');
var path = require('path');

var State = require('ampersand-state');
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:menu');

const COMPASS_HELP = 'https://docs.mongodb.com/compass/';
const LICENSE = path.join(__dirname, '..', '..', 'LICENSE');

function isReadonlyDistro() {
  return process.env.HADRON_READONLY === 'true';
}

// submenu related
function separator() {
  return {
    type: 'separator'
  };
}

function quitItem(label) {
  return {
    label: label,
    accelerator: 'CmdOrCtrl+Q',
    click: function() {
      app.quit();
    }
  };
}

function compassOverviewItem() {
  return {
    label: `${app.getName()} &Overview`,
    click: function() {
      ipc.broadcastFocused('window:show-compass-tour');
    }
  };
}

function networkOptInDialogItem() {
  return {
    label: '&Privacy Settings',
    click: function() {
      ipc.broadcastFocused('window:show-network-optin');
    }
  };
}

function darwinCompassSubMenu() {
  return {
    label: app.getName(),
    submenu: [
      {
        label: `About ${app.getName()}`,
        selector: 'orderFrontStandardAboutPanel:'
      },
      separator(),
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
      separator(),
      quitItem('Quit')
    ]
  };
}

function connectItem() {
  return {
    label: '&Connect to...',
    accelerator: 'CmdOrCtrl+N',
    click: function() {
      app.emit('app:show-connect-window');
    }
  };
}

function disconnectItem() {
  return {
    label: '&Disconnect',
    click: function() {
      ipc.broadcastFocused('app:disconnect');
    }
  };
}

function connectSubMenu(nonDarwin) {
  var subMenu = [
    connectItem(),
    disconnectItem()
  ];

  if (nonDarwin) {
    subMenu.push(separator());
    subMenu.push(quitItem('E&xit'));
  }

  return {
    label: '&Connect',
    submenu: subMenu
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
      separator(),
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
      },
      separator(),
      {
        label: 'Find',
        accelerator: 'CmdOrCtrl+F',
        click: function() {
          ipc.broadcast('app:find');
        }
      }
    ]
  };
}

function nonDarwinAboutItem() {
  return {
    label: `&About ${app.getName()}`,
    click: function() {
      app.emit('window:show-about-dialog');
    }
  };
}

function helpWindowItem() {
  return {
    label: `&Online ${app.getName()} Help`,
    accelerator: 'F1',
    click: function() {
      require('electron').shell.openExternal(COMPASS_HELP);
    }
  };
}

function securityItem() {
  return {
    label: '&Plugins',
    click: function() {
      ipc.broadcastFocused('window:show-security-panel');
    }
  };
}

function license() {
  return {
    label: '&License',
    click: function() {
      const licenseTemp = path.join(app.getPath('temp'), 'file');
      const stream = fs.createWriteStream(licenseTemp);
      fs.createReadStream(LICENSE).pipe(stream);
      stream.on('finish', () => {
        electron.shell.openItem(licenseTemp);
      });
    }
  };
}

function helpSubMenu() {
  var subMenu = [];
  subMenu.push(helpWindowItem());

  subMenu.push(compassOverviewItem());

  if (process.env.HADRON_ISOLATED !== 'true') {
    subMenu.push(networkOptInDialogItem());
  }

  subMenu.push(securityItem());
  subMenu.push(license());

  if (process.platform !== 'darwin') {
    subMenu.push(separator());
    subMenu.push(nonDarwinAboutItem());
  }

  return {
    label: '&Help',
    submenu: subMenu
  };
}

function collectionSubMenu() {
  var subMenu = [];
  subMenu.push({
    label: '&Share Schema as JSON',
    accelerator: 'Alt+CmdOrCtrl+S',
    click: function() {
      ipc.broadcastFocused('window:menu-share-schema-json');
    }
  });
  subMenu.push(separator());
  if (!isReadonlyDistro()) {
    subMenu.push({
      label: '&Import Data',
      click: function() {
        ipc.broadcastFocused('compass:open-import');
      }
    });
  }
  subMenu.push({
    label: '&Export Collection',
    click: function() {
      ipc.broadcastFocused('compass:open-export');
    }
  });
  return {
    label: '&Collection',
    submenu: subMenu
  };
}

function viewSubMenu() {
  return {
    label: '&View',
    submenu: [
      {
        label: '&Reload',
        accelerator: 'CmdOrCtrl+Shift+R',
        click: function() {
          BrowserWindow.getFocusedWindow().reload();
        }
      },
      {
        label: '&Reload Data',
        accelerator: 'CmdOrCtrl+R',
        click: function() {
          ipc.broadcast('app:refresh-data');
        }
      },
      separator(),
      {
        label: 'Actual Size',
        accelerator: 'CmdOrCtrl+0',
        click: function() {
          ipc.broadcast('window:zoom-reset');
        }
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        click: function() {
          ipc.broadcast('window:zoom-in');
        }
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: function() {
          ipc.broadcast('window:zoom-out');
        }
      },
      {
        label: 'Darkmode Enable',
        click: function() {
          ipc.broadcast('app:darkreader-enable');
        }
      },
      {
        label: 'Darkmode Disable',
        click: function() {
          ipc.broadcast('app:darkreader-disable');
        }
      },
      separator(),
      {
        label: '&Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: function() {
          const win = BrowserWindow.getFocusedWindow();
          if (win) {
            win.toggleDevTools();
          }
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
      separator(),
      {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      }
    ]
  };
}

// menus
function darwinMenu(menuState) {
  var menu = [
    darwinCompassSubMenu()
  ];

  menu.push(connectSubMenu(false));
  menu.push(editSubMenu());
  menu.push(viewSubMenu());

  if (menuState.showCollection) {
    menu.push(collectionSubMenu());
  }

  menu.push(windowSubMenu());
  menu.push(helpSubMenu(menuState.showCompassOverview));

  return menu;
}

function nonDarwinMenu(menuState) {
  var menu = [
    connectSubMenu(true),
    viewSubMenu()
  ];

  if (menuState.showCollection) {
    menu.push(collectionSubMenu());
  }

  menu.push(helpSubMenu(menuState.showCompassOverview));

  return menu;
}

var MenuState = State.extend({
  props: {
    showCompassOverview: {
      type: 'boolean',
      default: false
    },
    showCollection: {
      type: 'boolean',
      default: false
    }
  }
});

// menu singleton
var AppMenu = (function() {
  return {
    addWindow: function(_window) {
      debug('lastFocusedWindow set to WINDOW ' + _window.id);
      this.lastFocusedWindow = _window;

      var focusHandler = (function(_this) {
        return function() {
          debug('WINDOW ' + _window.id + ' focused');
          debug('lastFocusedWindow set to WINDOW ' + _window.id);

          _this.lastFocusedWindow = _window;
          _this.load(this);
        };
      })(this);
      _window.on('focus', focusHandler);

      _window.once('close', (function(_this) {
        return function() {
          debug('WINDOW ' + _window.id + ' closing');

          _this.windowTemplates.delete(_window.id);
          _window.removeListener('focus', focusHandler);
        };
      })(this));

      _window.once('closed', (function() {
        return function() {
          debug('WINDOW closed');
          _window = null;
        };
      })(this));
    },

    getTemplate: function(winID) {
      var menuState = this.windowTemplates.get(winID);

      if (process.platform === 'darwin') {
        return darwinMenu(menuState);
      }

      return nonDarwinMenu(menuState);
    },

    init: function() {
      debug('init()');
      this.windowTemplates = new Map();
    },

    load: function(_window) {
      debug('WINDOW ' + _window.id + ' load()');

      if (_window.id !== this.currentWindowMenuLoaded) {
        if (_.isUndefined(this.windowTemplates.get(_window.id))) {
          this.addWindow(_window);

          debug('create menu state for new WINDOW ' + _window.id);
          this.windowTemplates.set(_window.id, new MenuState());
        }

        this.setTemplate(_window.id);
        debug('WINDOW ' + _window.id + '\'s menu loaded');
      } else {
        debug('WINDOW ' + _window.id + '\'s menu already loaded');
      }
    },

    setTemplate: function(winID) {
      debug('WINDOW ' + winID + ' setTemplate()');
      this.currentWindowMenuLoaded = winID;
      var template = this.getTemplate(winID);
      var menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    },

    hideCollection: function() {
      this.updateMenu('showCollection', false);
    },

    showCompassOverview: function() {
      this.updateMenu('showCompassOverview', true);
    },

    showCollection: function() {
      this.updateMenu('showCollection', true);
    },

    updateMenu: function(property, val, _window) {
      debug('updateMenu() set ' + property + ' to ' + val);

      if (_.isUndefined(_window)) {
        _window = this.lastFocusedWindow;
      }

      var menuState = this.windowTemplates.get(_window.id);
      menuState[property] = val;
      this.windowTemplates.set(_window.id, menuState);
      this.setTemplate(_window.id);
    }
  };
}());

module.exports = AppMenu;
