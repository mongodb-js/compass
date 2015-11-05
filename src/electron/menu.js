// based off of https://github.com/atom/atom/blob/master/src/browser/application-menu.coffee
// use js2.coffee to convert it to JS

var _ = require('lodash');
var app = require('app');
var BrowserWindow = require('browser-window');
var debug = require('debug')('electron:menu');
var Menu = require('menu');
var State = require('ampersand-state');

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
function darwinMenu(menuState) {
  var menu = [
    darwinCompassSubMenu()
  ];

  if (menuState.showConnectSubMenu) {
    menu.push(connectSubMenu());
  }

  menu.push(editSubMenu());
  menu.push(viewSubMenu());

  if (menuState.showShareSubMenu) {
    menu.push(shareSubMenu());
  }

  menu.push(windowSubMenu());

  return menu;
}

function nonDarwinMenu(menuState) {
  var menu = [
    nonDarwinCompassSubMenu()
  ];

  if (menuState.showConnectSubMenu) {
    menu.push(connectSubMenu());
  }

  menu.push(viewSubMenu());

  if (menuState.showShareSubMenu) {
    menu.push(shareSubMenu());
  }

  return menu;
}

var MenuState = State.extend({
  props: {
    showConnectSubMenu: { type: 'boolean', default: true },
    showShareSubMenu: { type: 'boolean', default: false }
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

      _window.once('closed', (function(_this) {
        return function() {
          debug('WINDOW ' + _window.id + ' closed');
          _this.windowTemplates.delete(_window.id);
          _window.removeListener('focus', focusHandler);
        };
      })(this));
    },

    getTemplate: function(winID) {
      var menuState = this.windowTemplates.get(winID);

      debug('Menu State for WINDOW ' + winID);
      debug('showConnectSubMenu: ' + menuState.showConnectSubMenu);
      debug('showShareSubMenu: ' + menuState.showShareSubMenu);

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
        debug('WINDOW ' + _window.id + "'s menu loaded");
      } else {
        debug('WINDOW ' + _window.id + "'s menu already loaded");
      }
    },

    setTemplate: function(winID) {
      debug('WINDOW ' + winID + ' setTemplate()');
      this.currentWindowMenuLoaded = winID;
      var template = this.getTemplate(winID);
      var menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    },

    // share/hide submenu fns
    hideConnectSubMenu: function(_window) {
      this.updateMenu('showConnectSubMenu', false, _window);
    },

    hideShareSubMenu: function() {
      this.updateMenu('showShareSubMenu', false);
    },

    showConnectSubMenu: function() {
      this.updateMenu('showConnectSubMenu', true);
    },

    showShareSubMenu: function() {
      this.updateMenu('showShareSubMenu', true);
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
