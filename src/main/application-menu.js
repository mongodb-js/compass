var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var app = electron.app;

var State = require('ampersand-state');
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:main:application-menu');

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
    label: 'Compass &Overview',
    click: function() {
      BrowserWindow.getFocusedWindow().webContents.send('message', 'show-compass-tour');
    }
  };
}

function networkOptInDialogItem() {
  return {
    label: 'Help &Improve Compass',
    click: function() {
      BrowserWindow.getFocusedWindow().webContents.send('message', 'show-network-optin');
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
        label: 'Restart and Install Update',
        command: 'application:install-update',
        visible: false
      },
      {
        label: 'Check for Update',
        command: 'application:check-for-update',
        visible: false
      },
      {
        label: 'Checking for Update',
        enabled: false,
        visible: false
      },
      {
        label: 'Downloading Update',
        enabled: false,
        visible: false
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
      app.emit('show connect dialog');
    }
  };
}

function connectSubMenu(nonDarwin) {
  var subMenu = [connectItem()];

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
      }
    ]
  };
}

function nonDarwinAboutItem() {
  return {
    label: '&About Compass',
    click: function() {
      app.emit('show about dialog');
    }
  };
}

function helpWindowItem() {
  return {
    label: '&Show Compass Help',
    accelerator: 'F1',
    click: function() {
      app.emit('show help window');
    }
  };
}

function intercomItem() {
  return {
    label: '&Provide Feedback',
    click: function() {
      BrowserWindow.getFocusedWindow().webContents.send('message', 'show-intercom-panel');
    }
  };
}

function helpSubMenu(showCompassOverview) {
  var subMenu = [];
  subMenu.push(helpWindowItem());

  if (showCompassOverview) {
    subMenu.push(compassOverviewItem());
    subMenu.push(networkOptInDialogItem());
  }

  subMenu.push(separator());
  subMenu.push(intercomItem());

  if (process.platform !== 'darwin') {
    subMenu.push(separator());
    subMenu.push(nonDarwinAboutItem());
  }

  return {
    label: '&Help',
    submenu: subMenu
  };
}

function shareSubMenu() {
  return {
    label: '&Share',
    submenu: [
      {
        label: '&Share Schema as JSON',
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
    label: '&View',
    submenu: [
      {
        label: '&Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function() {
          BrowserWindow.getFocusedWindow().reload();
        }
      },
      {
        label: '&Toggle DevTools',
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

  if (menuState.showShare) {
    menu.push(shareSubMenu());
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

  if (menuState.showShare) {
    menu.push(shareSubMenu());
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
    showShare: {
      type: 'boolean',
      default: false
    }
  }
});

var ApplicationMenu = State.extend({
  windowTemplates: new Map(),
  initialize: function(opts) {
    this.autoUpdateManager = opts.autoUpdateManager;
    this.autoUpdateManager.on('change:state',
      this.showUpdateMenuItem.bind(this));
  },
  /**
   * Flattens the given menu and submenu items into an single Array.
   *
   * @param {Menu} menu - A complete menu configuration object
   * for electron's menu API.
   * @return {Array} of native menu items.
   */
  flattenMenuItems: function(menu) {
    var items = [];
    _.each(menu.items || {}, function(item) {
      items.push(item);
      if (item.submenu) {
        items = items.concat(this.flattenMenuItems(item.submenu));
      }
    }, this);
    return items;
  },
  /**
   * @param {String} label
   * @return {MenuItem}
   */
  getMenuItemWithLabel: function(label) {
    return _.find(this.flattenMenuItems(this.menu), function(l) {
      return label === l;
    });
  },
  showUpdateMenuItem: function() {
    var checkForUpdateItem = this.getMenuItemWithLabel(
      'Check for Update');

    var checkingForUpdateItem = this.getMenuItemWithLabel(
      'Checking for Update');

    var downloadingUpdateItem = this.getMenuItemWithLabel(
      'Downloading Update');

    var installUpdateItem = this.getMenuItemWithLabel(
      'Restart and Install Update');

    // if (!checkForUpdateItem && !checkingForUpdateItem) {
    //   return;
    // }
    checkForUpdateItem.visible = false;
    checkingForUpdateItem.visible = false;
    downloadingUpdateItem.visible = false;
    installUpdateItem.visible = false;

    if (this.autoUpdateManager.state === 'checking') {
      checkingForUpdateItem.visible = true;
    } else if (this.autoUpdateManager.state === 'downloading') {
      downloadingUpdateItem.visible = true;
    } else if (this.autoUpdateManager.state === 'update-available') {
      installUpdateItem.visible = true;
    } else {
      checkForUpdateItem.visible = true;
    }
  },
  /**
   * Register a BrowserWindow with this application menu.
   * @param {BrowserWindow} _window
   */
  addWindow: function(_window) {
    this.lastFocusedWindow = _window;

    var focusHandler = function() {
      debug('%s focused and becoming lastFocusedWindow', _window.id);
      this.lastFocusedWindow = _window;
      this.load(_window);
    }.bind(this);

    _window.on('focus', focusHandler);

    _window.once('close', function() {
      debug('%s closing', _window.id);
      this.windowTemplates.delete(_window.id);
      _window.removeListener('focus', focusHandler);
    }.bind(this));

    _window.once('closed', function() {
      _window = null;
    });
  },
  getTemplate: function(winID) {
    var menuState = this.windowTemplates.get(winID);

    if (process.platform === 'darwin') {
      return darwinMenu(menuState);
    }

    return nonDarwinMenu(menuState);
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
      debug('menu loaded for %s', _window.id);
    } else {
      debug('menu already loaded for %s', _window.id);
    }
  },
  setTemplate: function(winID) {
    this.currentWindowMenuLoaded = winID;
    var template = this.getTemplate(winID);
    this.menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(this.menu);
  },
  hideShare: function() {
    this.updateMenu('showShare', false);
  },
  showCompassOverview: function() {
    this.updateMenu('showCompassOverview', true);
  },
  showShare: function() {
    this.updateMenu('showShare', true);
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
});

module.exports = ApplicationMenu;
