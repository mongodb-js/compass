// based off of https://github.com/atom/atom/blob/master/src/browser/application-menu.coffee
// use js2.coffee to convert it to JS
import {
  BrowserWindow,
  Menu,
  app,
  dialog,
  shell,
  nativeTheme,
  MenuItemConstructorOptions,
} from 'electron';
import { ipcMain } from 'hadron-ipc';
import fs from 'fs';
import path from 'path';
import createDebug from 'debug';
import COMPASS_ICON from './icon';
import type { CompassApplication } from './application';
import { THEMES } from 'compass-preferences-model';

type MenuTemplate = MenuItemConstructorOptions | MenuItemConstructorOptions[];

const debug = createDebug('mongodb-compass:menu');

const COMPASS_HELP = 'https://docs.mongodb.com/compass/';

class ThemeState {
  theme: THEMES = THEMES.OS_THEME;
}

function updateTheme({
  theme
}: ThemeState) {
  if (theme === THEMES.OS_THEME) {
    if (nativeTheme.shouldUseDarkColors) {
      ipcMain.broadcast('app:darkreader-enable');
    } else {
      ipcMain.broadcast('app:darkreader-disable');
    }
    return;
  }
  
  if (theme === THEMES.DARK) {
    ipcMain.broadcast('app:darkreader-enable');
    return;
  }
  
  ipcMain.broadcast('app:darkreader-disable');
}

function separator(): MenuItemConstructorOptions {
  return {
    type: 'separator' as const,
  };
}

function quitItem(label: string): MenuItemConstructorOptions {
  return {
    label: label,
    accelerator: 'CmdOrCtrl+Q',
    click() {
      app.quit();
    },
  };
}

function compassOverviewItem(): MenuItemConstructorOptions {
  return {
    label: `${app.getName()} &Overview`,
    click() {
      ipcMain.broadcastFocused('window:show-compass-tour');
    },
  };
}

function networkOptInDialogItem(): MenuItemConstructorOptions {
  return {
    label: '&Privacy Settings',
    click() {
      ipcMain.broadcastFocused('window:show-network-optin');
    },
  };
}

function darwinCompassSubMenu(): MenuItemConstructorOptions {
  return {
    label: app.getName(),
    submenu: [
      {
        label: `About ${app.getName()}`,
        role: 'about',
      },
      separator(),
      {
        label: 'Hide',
        accelerator: 'Command+H',
        role: 'hide',
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideOthers',
      },
      {
        label: 'Show All',
        role: 'unhide',
      },
      separator(),
      quitItem('Quit'),
    ],
  };
}

function connectItem(app: typeof CompassApplication): MenuItemConstructorOptions {
  return {
    label: 'New &Connection',
    accelerator: 'CmdOrCtrl+N',
    click() {
      app.emit('show-connect-window');
    },
  };
}

function disconnectItem(): MenuItemConstructorOptions {
  return {
    label: '&Disconnect',
    click() {
      ipcMain.broadcastFocused('app:disconnect');
    },
  };
}

function connectSubMenu(
  nonDarwin: boolean,
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu: MenuTemplate = [connectItem(app), disconnectItem()];

  if (nonDarwin) {
    subMenu.push(separator());
    subMenu.push(quitItem('E&xit'));
  }

  return {
    label: '&Connect',
    submenu: subMenu,
  };
}

function editSubMenu(): MenuItemConstructorOptions {
  return {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'Command+Z',
        role: 'undo' as const,
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        role: 'redo' as const,
      },
      separator(),
      {
        label: 'Cut',
        accelerator: 'Command+X',
        role: 'cut' as const,
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        role: 'copy' as const,
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        role: 'paste' as const,
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        role: 'selectAll' as const,
      },
      separator(),
      {
        label: 'Find',
        accelerator: 'CmdOrCtrl+F',
        click() {
          ipcMain.broadcastFocused('app:find');
        },
      },
    ],
  };
}

function nonDarwinAboutItem(): MenuItemConstructorOptions {
  return {
    label: `&About ${app.getName()}`,
    click() {
      void dialog.showMessageBox({
        type: 'info',
        title: 'About ' + app.getName(),
        icon: COMPASS_ICON,
        message: app.getName(),
        detail: 'Version ' + app.getVersion(),
        buttons: ['OK'],
      });
    },
  };
}

function helpWindowItem(): MenuItemConstructorOptions {
  return {
    label: `&Online ${app.getName()} Help`,
    accelerator: 'F1',
    click() {
      void shell.openExternal(COMPASS_HELP);
    },
  };
}

function securityItem(): MenuItemConstructorOptions {
  return {
    label: '&Plugins',
    click() {
      ipcMain.broadcastFocused('window:show-security-panel');
    },
  };
}

function license(): MenuItemConstructorOptions {
  return {
    label: '&License',
    async click() {
      const LICENSE = (await import('../../LICENSE')).default;
      const licenseTemp = path.join(app.getPath('temp'), 'License');
      fs.writeFile(licenseTemp, LICENSE, (err) => {
        if (!err) {
          shell.openPath(licenseTemp);
        }
      });
    },
  };
}

function logFile(app: typeof CompassApplication): MenuItemConstructorOptions {
  return {
    label: '&Open Log File',
    click() {
      app.emit('show-log-file-dialog');
    },
  };
}

function helpSubMenu(app: typeof CompassApplication): MenuItemConstructorOptions {
  const subMenu = [];
  subMenu.push(helpWindowItem());

  subMenu.push(compassOverviewItem());

  if (process.env.HADRON_ISOLATED !== 'true') {
    subMenu.push(networkOptInDialogItem());
  }

  subMenu.push(securityItem());
  subMenu.push(license());
  subMenu.push(logFile(app));

  if (process.platform !== 'darwin') {
    subMenu.push(separator());
    subMenu.push(nonDarwinAboutItem());
  }

  return {
    label: '&Help',
    submenu: subMenu,
  };
}

function collectionSubMenu(): MenuItemConstructorOptions {
  const subMenu = [];
  subMenu.push({
    label: '&Share Schema as JSON',
    accelerator: 'Alt+CmdOrCtrl+S',
    click() {
      ipcMain.broadcastFocused('window:menu-share-schema-json');
    },
  });
  subMenu.push(separator());
  if (process.env.HADRON_READONLY !== 'true') {
    subMenu.push({
      label: '&Import Data',
      click() {
        ipcMain.broadcastFocused('compass:open-import');
      },
    });
  }
  subMenu.push({
    label: '&Export Collection',
    click() {
      ipcMain.broadcastFocused('compass:open-export');
    },
  });
  return {
    label: '&Collection',
    submenu: subMenu,
  };
}

function viewSubMenu(
  themeState: ThemeState,
  saveThemeAndRefreshMenu: (theme: ThemeState) => void
): MenuItemConstructorOptions {
  return {
    label: '&View',
    submenu: [
      {
        label: '&Reload',
        accelerator: 'CmdOrCtrl+Shift+R',
        click() {
          BrowserWindow.getFocusedWindow()?.reload();
        },
      },
      {
        label: '&Reload Data',
        accelerator: 'CmdOrCtrl+R',
        click() {
          ipcMain.broadcast('app:refresh-data');
        },
      },
      separator(),
      {
        label: 'Actual Size',
        accelerator: 'CmdOrCtrl+0',
        click() {
          ipcMain.broadcast('window:zoom-reset');
        },
      },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+=',
        click() {
          ipcMain.broadcast('window:zoom-in');
        },
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click() {
          ipcMain.broadcast('window:zoom-out');
        },
      },
      separator(),
      {
        label: 'Use OS Theme (Preview)',
        click: function() {
          themeState.theme = THEMES.OS_THEME;
          updateTheme(themeState);
          saveThemeAndRefreshMenu(themeState);
        },
        type: 'checkbox',
        checked: themeState.theme === THEMES.OS_THEME
      },
      {
        label: 'Dark Theme (Preview)',
        click: function() {
          themeState.theme = THEMES.DARK;

          updateTheme(themeState);
          saveThemeAndRefreshMenu(themeState);
        },
        type: 'checkbox',
        checked: themeState.theme === THEMES.DARK
      },

      {
        label: 'Light Theme',
        click: function() {
          themeState.theme = THEMES.LIGHT;

          updateTheme(themeState);
          saveThemeAndRefreshMenu(themeState);
        },
        type: 'checkbox',
        checked: themeState.theme === THEMES.LIGHT,
        // enabled: !themeState.useOSTheme
      },
      separator(),
      {
        label: '&Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click() {
          BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
        },
      },
    ],
  };
}

function windowSubMenu(): MenuItemConstructorOptions {
  return {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'Command+M',
        role: 'minimize' as const,
      },
      {
        label: 'Close',
        accelerator: 'Command+W',
        role: 'close' as const,
      },
      separator(),
      {
        label: 'Bring All to Front',
        role: 'front',
      },
    ],
  };
}

// menus
function darwinMenu(
  menuState: WindowMenuState,
  themeState: ThemeState,
  saveThemeAndRefreshMenu: (theme: ThemeState) => void,
  app: typeof CompassApplication
) {
  const menu: MenuTemplate = [darwinCompassSubMenu()];

  menu.push(connectSubMenu(false, app));
  menu.push(editSubMenu());
  menu.push(viewSubMenu(themeState, saveThemeAndRefreshMenu));

  if (menuState.showCollection) {
    menu.push(collectionSubMenu());
  }

  menu.push(windowSubMenu());
  menu.push(helpSubMenu(app));

  return menu;
}

function nonDarwinMenu(
  menuState: WindowMenuState,
  themeState: ThemeState,
  saveThemeAndRefreshMenu: (theme: ThemeState) => void,
  app: typeof CompassApplication
) {
  const menu = [connectSubMenu(true, app), viewSubMenu(themeState, saveThemeAndRefreshMenu)];

  if (menuState.showCollection) {
    menu.push(collectionSubMenu());
  }

  menu.push(helpSubMenu(app));

  return menu;
}

class WindowMenuState {
  showCollection = false;
}

class CompassMenu {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static windowState = new Map<BrowserWindow['id'], WindowMenuState>();

  private static app: typeof CompassApplication;

  private static lastFocusedWindow?: BrowserWindow;

  private static currentWindowMenuLoaded?: BrowserWindow['id'];

  private static initCalled = false;

  private static themeState = new ThemeState();

  private static _init(app: typeof CompassApplication): void {
    this.app = app;

    app.on('new-window', (bw) => {
      this.load(bw);
    });

    ipcMain.respondTo({
      'window:show-collection-submenu': this.showCollection.bind(this),
      'window:hide-collection-submenu': this.hideCollection.bind(this),
    });

    ipcMain.respondTo({
      'window:theme-loaded': (_, theme) => {
        if (this.themeState.theme !== theme) {
          this.themeState.theme = theme;
          this.saveThemeAndRefreshMenu({
            theme
          });
        }
      },
    });

    nativeTheme.on('updated', () => {
      updateTheme(this.themeState);
    });

    void this.setupDockMenu();
  }

  static init(app: typeof CompassApplication): void {
    if (!this.initCalled) {
      this.initCalled = true;
      this._init(app);
    }
  }

  static load(bw: BrowserWindow): void {
    debug(`WINDOW ${bw.id} load()`);

    if (bw.id !== this.currentWindowMenuLoaded) {
      if (this.windowState.has(bw.id)) {
        this.addWindow(bw);

        debug(`create menu state for new WINDOW ${bw.id}`);
        this.windowState.set(bw.id, new WindowMenuState());
      }

      this.setTemplate(bw.id);
      debug(`WINDOW ${bw.id}'s menu loaded`);
    } else {
      debug(`WINDOW ${bw.id}'s menu already loaded`);
    }
  }

  private static async setupDockMenu() {
    await app.whenReady();
    if (process.platform === 'darwin') {
      app.dock.setMenu(
        Menu.buildFromTemplate([
          {
            label: 'New Connection',
            click: () => {
              this.app.emit('show-connect-window');
            },
          },
        ])
      );
    }
  }

  private static addWindow(bw: BrowserWindow) {
    debug(`lastFocusedWindow set to WINDOW ${bw.id}`);
    this.lastFocusedWindow = bw;

    const onFocus = () => {
      debug(`WINDOW ${bw.id} focused`);
      debug(`lastFocusedWindow set to WINDOW ${bw.id}`);
      this.lastFocusedWindow = bw;
      this.load(bw);
    };

    bw.on('focus', onFocus);

    const onClose = () => {
      debug(`WINDOW ${bw.id} closing`);
      this.windowState.delete(bw.id);
      bw.removeListener('focus', onFocus);
    };

    bw.once('close', onClose);

    bw.once('closed', () => {
      debug(`WINDOW ${bw.id} closed`);
    });
  }

  private static setTemplate(id: BrowserWindow['id']) {
    debug(`WINDOW ${id} setTemplate()`);
    this.currentWindowMenuLoaded = id;
    const template = this.getTemplate(id);
    const menu = Menu.buildFromTemplate(
      template as MenuItemConstructorOptions[]
    );
    Menu.setApplicationMenu(menu);
  }

  static getTemplate(id: BrowserWindow['id']): MenuTemplate[] {
    let menuState = this.windowState.get(id);

    if (!menuState) {
      debug(`WINDOW ${id} doesn't have any stored state. Using a default one`);
      menuState = new WindowMenuState();
    }

    if (process.platform === 'darwin') {
      return darwinMenu(menuState, this.themeState, this.saveThemeAndRefreshMenu, this.app);
    }
    return nonDarwinMenu(menuState, this.themeState, this.saveThemeAndRefreshMenu, this.app);
  }

  private static saveThemeAndRefreshMenu = (themeState: ThemeState) => {
    const currentWindowMenuId = this.currentWindowMenuLoaded;
    if (!currentWindowMenuId) {
      // Nothing to refresh.
      debug(`Cannot refresh WINDOW menu`);

      return;
    }

    // Tell the active window to save the chosen theme.
    ipcMain.broadcastFocused('app:save-theme', themeState.theme);

    debug(`WINDOW ${currentWindowMenuId} refreshing menu`);

    const template = this.getTemplate(currentWindowMenuId);
    const menu = Menu.buildFromTemplate(
      template as MenuItemConstructorOptions[]
    );
    Menu.setApplicationMenu(menu);
  }

  private static showCollection() {
    this.updateMenu('showCollection', true);
  }

  private static hideCollection() {
    this.updateMenu('showCollection', false);
  }

  private static updateMenu(
    prop: keyof WindowMenuState,
    val: WindowMenuState[typeof prop],
    bw: BrowserWindow | undefined = this.lastFocusedWindow
  ) {
    debug(`updateMenu() set ${prop} to ${String(val)}`);

    if (!bw) {
      debug(`Can't update menu state: no window to update`);
      return;
    }

    const menuState = this.windowState.get(bw.id);

    if (menuState) {
      menuState[prop] = val;
      this.windowState.set(bw.id, menuState);
      this.setTemplate(bw.id);
    }
  }
}

export { CompassMenu };
