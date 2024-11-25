import type { MenuItemConstructorOptions } from 'electron';
import {
  BrowserWindow,
  Menu,
  app as electronApp,
  dialog,
  shell,
} from 'electron';
import { ipcMain } from 'hadron-ipc';
import fs from 'fs';
import path from 'path';
import createDebug from 'debug';
import type { THEMES } from 'compass-preferences-model';

import COMPASS_ICON from './icon';
import type { CompassApplication } from './application';
import { AutoUpdateManagerState } from './auto-update-manager';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';

const track = createIpcTrack();

type MenuTemplate = MenuItemConstructorOptions | MenuItemConstructorOptions[];

const debug = createDebug('mongodb-compass:menu');

const COMPASS_HELP = 'https://docs.mongodb.com/compass/';

function separator(): MenuItemConstructorOptions {
  return {
    type: 'separator' as const,
  };
}

function quitItem(
  label: string,
  compassApp: typeof CompassApplication
): MenuItemConstructorOptions {
  return {
    label: label,
    accelerator: 'CmdOrCtrl+Q',
    click() {
      !compassApp.preferences.getPreferences().enableShowDialogOnQuit
        ? electronApp.quit()
        : void dialog
            .showMessageBox({
              type: 'warning',
              title: `Quit ${electronApp.getName()}`,
              icon: COMPASS_ICON,
              message: 'Are you sure you want to quit?',
              buttons: ['Quit', 'Cancel'],
              checkboxLabel: 'Do not ask me again',
            })
            .then((result) => {
              if (result.response === 0) {
                if (result.checkboxChecked)
                  void compassApp.preferences.savePreferences({
                    enableShowDialogOnQuit: false,
                  });
                electronApp.quit();
              }
            });
    },
  };
}

function settingsDialogItem(): MenuItemConstructorOptions {
  return {
    label: '&Settings',
    accelerator: 'CmdOrCtrl+,',
    click() {
      ipcMain?.broadcastFocused('window:show-settings');
    },
  };
}

function updateSubmenu(
  { updateManagerState }: WindowMenuState,
  compassApp: typeof CompassApplication
): MenuItemConstructorOptions {
  return updateManagerState === 'idle'
    ? {
        label: 'Check for updates…',
        click() {
          compassApp.emit('check-for-updates');
        },
      }
    : updateManagerState === 'installing updates'
    ? {
        label: 'Installing updates…',
        enabled: false,
      }
    : {
        label: 'Restart',
        click() {
          compassApp.emit('menu-request-restart');
        },
      };
}

function darwinCompassSubMenu(
  windowState: WindowMenuState,
  compassApp: typeof CompassApplication
): MenuItemConstructorOptions {
  return {
    label: electronApp.getName(),
    submenu: [
      {
        label: `About ${electronApp.getName()}`,
        role: 'about',
      },
      updateSubmenu(windowState, compassApp),
      separator(),
      settingsDialogItem(),
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
      quitItem('Quit', compassApp),
    ],
  };
}

function newWindowItem(
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  return {
    label: 'New &Window',
    accelerator: 'CmdOrCtrl+N',
    click() {
      app.emit('show-connect-window');
    },
  };
}

function connectSubMenu(
  nonDarwin: boolean,
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu: MenuTemplate = [
    {
      label: '&Import Saved Connections',
      click() {
        ipcMain?.broadcastFocused('compass:open-import-connections');
      },
    },
    {
      label: '&Export Saved Connections',
      click() {
        ipcMain?.broadcastFocused('compass:open-export-connections');
      },
    },
  ];

  if (nonDarwin) {
    subMenu.push(separator());
    subMenu.push(quitItem('E&xit', app));
  }

  return {
    label: '&Connections',
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
          ipcMain?.broadcastFocused('app:find');
        },
      },
      ...(process.platform === 'darwin'
        ? []
        : [separator(), settingsDialogItem()]),
    ],
  };
}

function nonDarwinAboutItem(): MenuItemConstructorOptions {
  return {
    label: `&About ${electronApp.getName()}`,
    click() {
      void dialog.showMessageBox({
        type: 'info',
        title: 'About ' + electronApp.getName(),
        icon: COMPASS_ICON,
        message: electronApp.getName(),
        detail: 'Version ' + electronApp.getVersion(),
        buttons: ['OK'],
      });
    },
  };
}

function helpWindowItem(): MenuItemConstructorOptions {
  return {
    label: `&Online ${electronApp.getName()} Help`,
    accelerator: 'F1',
    click() {
      void shell.openExternal(COMPASS_HELP);
    },
  };
}

function sourceCodeLink(): MenuItemConstructorOptions {
  return {
    label: `&View Source Code on GitHub`,
    click() {
      void shell.openExternal('https://github.com/mongodb-js/compass');
    },
  };
}

function feedbackForumLink(): MenuItemConstructorOptions {
  return {
    label: `&Suggest a Feature`,
    click() {
      void shell.openExternal(
        'https://feedback.mongodb.com/forums/924283-compass'
      );
    },
  };
}

function bugReportLink(): MenuItemConstructorOptions {
  return {
    label: `&Report a Bug`,
    click() {
      void shell.openExternal(
        'https://jira.mongodb.org/projects/COMPASS/summary'
      );
    },
  };
}

function license(): MenuItemConstructorOptions {
  return {
    label: '&License',
    click() {
      void import('../../LICENSE').then(({ default: LICENSE }) => {
        const licenseTemp = path.join(electronApp.getPath('temp'), 'License');
        fs.writeFile(licenseTemp, LICENSE, (err) => {
          if (!err) {
            void shell.openPath(licenseTemp);
          }
        });
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

function helpSubMenu(
  windowState: WindowMenuState,
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu = [];
  subMenu.push(helpWindowItem());

  subMenu.push(license());

  subMenu.push(sourceCodeLink());
  subMenu.push(feedbackForumLink());
  subMenu.push(bugReportLink());
  subMenu.push(logFile(app));

  if (process.platform !== 'darwin') {
    subMenu.push(separator());
    subMenu.push(nonDarwinAboutItem());
    subMenu.push(updateSubmenu(windowState, app));
  }

  return {
    label: '&Help',
    submenu: subMenu,
  };
}

function collectionSubMenu(
  menuReadOnly: boolean,
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu = [];
  subMenu.push({
    label: '&Share Schema as JSON',
    accelerator: 'Alt+CmdOrCtrl+S',
    click() {
      ipcMain?.broadcastFocused('window:menu-share-schema-json');
    },
  });
  subMenu.push(separator());
  if (!app.preferences.getPreferences().readOnly && !menuReadOnly) {
    subMenu.push({
      label: '&Import Data',
      click() {
        ipcMain?.broadcastFocused('compass:open-import');
      },
    });
  }
  subMenu.push({
    label: '&Export Collection',
    click() {
      ipcMain?.broadcastFocused('compass:open-export');
    },
  });
  return {
    label: '&Collection',
    submenu: subMenu,
  };
}

function viewSubMenu(
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu = [
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
        ipcMain?.broadcast('app:refresh-data');
      },
    },
    separator(),
    {
      label: 'Actual Size',
      accelerator: 'CmdOrCtrl+0',
      click() {
        ipcMain?.broadcast('window:zoom-reset');
      },
    },
    {
      label: 'Zoom In',
      accelerator: 'CmdOrCtrl+=',
      click() {
        ipcMain?.broadcast('window:zoom-in');
      },
    },
    {
      label: 'Zoom Out',
      accelerator: 'CmdOrCtrl+-',
      click() {
        ipcMain?.broadcast('window:zoom-out');
      },
    },
  ];

  if (app.preferences.getPreferences().enableDevTools) {
    subMenu.push(separator());
    subMenu.push({
      label: '&Toggle DevTools',
      accelerator: 'Alt+CmdOrCtrl+I',
      click() {
        BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
      },
    });
  }

  return {
    label: '&View',
    submenu: subMenu,
  };
}

function windowSubMenu(
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const { enableMultipleConnectionSystem: isMultiConnectionsEnabled } =
    app.preferences.getPreferences();

  const submenu: MenuTemplate = [
    {
      label: 'Minimize',
      accelerator: 'Command+M',
      role: 'minimize' as const,
    },
    {
      label: 'Close',
      accelerator: 'Command+Shift+W',
      role: 'close' as const,
    },
    separator(),
    {
      label: 'Bring All to Front',
      role: 'front',
    },
  ];

  if (isMultiConnectionsEnabled) submenu.unshift(newWindowItem(app));

  return {
    label: 'Window',
    submenu,
  };
}

// menus
function darwinMenu(
  menuState: WindowMenuState,
  app: typeof CompassApplication
): MenuItemConstructorOptions[] {
  const menu: MenuTemplate = [darwinCompassSubMenu(menuState, app)];

  menu.push(connectSubMenu(false, app));
  menu.push(editSubMenu());
  menu.push(viewSubMenu(app));

  if (menuState.showCollection) {
    menu.push(collectionSubMenu(menuState.isReadOnly, app));
  }

  menu.push(windowSubMenu(app));
  menu.push(helpSubMenu(menuState, app));

  return menu;
}

function nonDarwinMenu(
  menuState: WindowMenuState,
  app: typeof CompassApplication
): MenuItemConstructorOptions[] {
  const menu = [connectSubMenu(true, app), editSubMenu(), viewSubMenu(app)];

  if (menuState.showCollection) {
    menu.push(collectionSubMenu(menuState.isReadOnly, app));
  }

  menu.push(helpSubMenu(menuState, app));

  return menu;
}

type UpdateManagerState = 'idle' | 'installing updates' | 'ready to restart';

class WindowMenuState {
  showCollection = false;
  isReadOnly = false;
  updateManagerState: UpdateManagerState = 'idle';
}

class CompassMenu {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static windowState = new Map<BrowserWindow['id'], WindowMenuState>();

  private static app: typeof CompassApplication;

  private static lastFocusedWindow: BrowserWindow | null = null;

  private static currentWindowMenuLoaded: BrowserWindow['id'] | null = null;

  private static initCalled = false;

  private static _init(app: typeof CompassApplication): void {
    const { preferences } = app;
    this.app = app;

    app.on('new-window', (bw) => {
      this.load(bw);
    });

    app.on('auto-updater:new-state', (state) => {
      const updateManagerState = ((): UpdateManagerState => {
        switch (state) {
          case AutoUpdateManagerState.Initial:
          case AutoUpdateManagerState.Disabled:
          case AutoUpdateManagerState.UserPromptedManualCheck:
          case AutoUpdateManagerState.CheckingForUpdatesForManualCheck:
          case AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck:
          case AutoUpdateManagerState.NoUpdateAvailable:
          case AutoUpdateManagerState.UpdateAvailable:
          case AutoUpdateManagerState.UpdateDismissed:
          case AutoUpdateManagerState.DownloadingError:
          case AutoUpdateManagerState.PromptToUpdateExternally:
          case AutoUpdateManagerState.Restarting:
            return 'idle';
          case AutoUpdateManagerState.ManualDownload:
          case AutoUpdateManagerState.DownloadingUpdate:
            return 'installing updates';
          case AutoUpdateManagerState.RestartDismissed:
          case AutoUpdateManagerState.PromptForRestart:
            return 'ready to restart';
        }
      })();
      this.updateMenu({ updateManagerState });
    });

    ipcMain?.respondTo({
      'window:show-collection-submenu': this.showCollection.bind(this),
      'window:hide-collection-submenu': this.hideCollection.bind(this),
    });

    preferences.onPreferenceValueChanged('theme', (newTheme: THEMES) => {
      track('Theme Changed', {
        theme: newTheme,
      });

      this.refreshMenu();
    });

    preferences.onPreferenceValueChanged('readOnly', () => {
      this.refreshMenu();
    });

    preferences.onPreferenceValueChanged(
      'enableDevTools',
      (enableDevTools: boolean) => {
        this.refreshMenu();
        if (!enableDevTools) {
          BrowserWindow.getFocusedWindow()?.webContents.closeDevTools();
        }
      }
    );

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
      if (!this.windowState.has(bw.id)) {
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
    await electronApp.whenReady();
    if (process.platform === 'darwin') {
      electronApp.dock.setMenu(
        Menu.buildFromTemplate([
          {
            label: 'New Window',
            click: () => {
              this.app.emit('show-connect-window');
            },
          },
        ])
      );
    }
  }

  private static addWindow(bw: BrowserWindow) {
    const id = bw.id;
    this.lastFocusedWindow = bw;

    debug(`lastFocusedWindow set to WINDOW ${id}`);

    const onFocus = () => {
      debug(`WINDOW ${id} focused`);
      debug(`lastFocusedWindow set to WINDOW ${id}`);
      this.lastFocusedWindow = bw;
      this.load(bw);
    };

    bw.on('focus', onFocus);

    // Emitted no matter if the app was closed normally or "destroyed",
    // recommended event to clean up references to browser window. Do not access
    // properties and methods on bw instance here directly as the window is
    // already destroyed at that point and trying to access any property will
    // throw
    const onClosed = () => {
      debug(`WINDOW ${id} closed`);
      this.windowState.delete(id);
      if (this.lastFocusedWindow === bw) {
        this.lastFocusedWindow = null;
      }
      if (this.currentWindowMenuLoaded === id) {
        this.currentWindowMenuLoaded = null;
      }
    };

    bw.once('closed', onClosed);
  }

  private static setTemplate(id: BrowserWindow['id']) {
    debug(`WINDOW ${id} setTemplate()`);
    this.currentWindowMenuLoaded = id;
    const template = this.getTemplate(id);
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  static getTemplate(id: BrowserWindow['id']): MenuItemConstructorOptions[] {
    let menuState = this.windowState.get(id);

    if (!menuState) {
      debug(`WINDOW ${id} doesn't have any stored state. Using a default one`);
      menuState = new WindowMenuState();
    }

    if (process.platform === 'darwin') {
      return darwinMenu(menuState, this.app);
    }
    return nonDarwinMenu(menuState, this.app);
  }

  private static refreshMenu = () => {
    const currentWindowMenuId = this.currentWindowMenuLoaded;
    if (!currentWindowMenuId) {
      // Nothing to refresh.
      debug(`Cannot refresh WINDOW menu`);

      return;
    }

    debug(`WINDOW ${currentWindowMenuId} refreshing menu`);

    const template = this.getTemplate(currentWindowMenuId);
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  };

  private static showCollection(
    evt: unknown,
    { isReadOnly }: { isReadOnly: boolean }
  ) {
    this.updateMenu({ showCollection: true, isReadOnly });
  }

  private static hideCollection() {
    this.updateMenu({ showCollection: false });
  }

  private static updateMenu(
    newValues: Partial<WindowMenuState>,
    bw: BrowserWindow | null = this.lastFocusedWindow
  ) {
    debug(`updateMenu() set menu state to ${JSON.stringify(newValues)}`);

    if (!bw) {
      debug(`Can't update menu state: no window to update`);
      return;
    }

    const menuState = this.windowState.get(bw.id);

    if (menuState) {
      Object.assign(menuState, newValues);
      this.windowState.set(bw.id, menuState);
      this.setTemplate(bw.id);
    }
  }
}

export { CompassMenu, quitItem };
