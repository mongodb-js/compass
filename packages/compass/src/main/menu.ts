import { RendererDefinedMenuState } from '@mongodb-js/compass-electron-menu/ipc-provider-main';
import { type CompassAppMenu } from '@mongodb-js/compass-electron-menu';
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
import { AutoUpdateManagerStates } from './auto-update-manager';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';
import { translate } from '@mongodb-js/compass-components/i18n';

const track = createIpcTrack();

type MenuItemConstructorOptions = CompassAppMenu; // Alias to reduce diff complexity
type MenuTemplate = CompassAppMenu | CompassAppMenu[];

const debug = createDebug('mongodb-compass:menu');

const COMPASS_HELP = 'https://docs.mongodb.com/compass/';

let menuLanguage = 'en';

function t(
  key: string,
  english: string,
  vars?: Record<string, string | number>
): string {
  return translate(menuLanguage, key, english, vars);
}

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
      if (!compassApp.preferences.getPreferences().enableShowDialogOnQuit) {
        electronApp.quit();
        return;
      }

      menuLanguage =
        compassApp.preferences.getPreferences().language ?? menuLanguage;
      void dialog
        .showMessageBox({
          type: 'warning',
          title: t('menu.quitDialog.title', 'Quit {name}', {
            name: electronApp.getName(),
          }),
          icon: COMPASS_ICON,
          message: t(
            'menu.quitDialog.message',
            'Are you sure you want to quit?'
          ),
          buttons: [
            t('menu.quitDialog.quit', 'Quit'),
            t('menu.quitDialog.cancel', 'Cancel'),
          ],
          checkboxLabel: t(
            'menu.quitDialog.doNotAskAgain',
            'Do not ask me again'
          ),
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
    label: t('menu.settings', '&Settings'),
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
        label: t('menu.checkForUpdates', 'Check for updates…'),
        click() {
          compassApp.emit('check-for-updates');
        },
      }
    : updateManagerState === 'installing updates'
      ? {
          label: t('menu.installingUpdates', 'Installing updates…'),
          enabled: false,
        }
      : {
          label: t('menu.restartToUpdate', 'Restart to Update'),
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
        label: t('menu.about', 'About {name}', {
          name: electronApp.getName(),
        }),
        role: 'about',
      },
      updateSubmenu(windowState, compassApp),
      separator(),
      settingsDialogItem(),
      separator(),
      {
        label: t('menu.hide', 'Hide'),
        accelerator: 'Command+H',
        role: 'hide',
      },
      {
        label: t('menu.hideOthers', 'Hide Others'),
        accelerator: 'Command+Shift+H',
        role: 'hideOthers',
      },
      {
        label: t('menu.showAll', 'Show All'),
        role: 'unhide',
      },
      separator(),
      quitItem(t('menu.quit', 'Quit'), compassApp),
    ],
  };
}

function connectSubMenu(
  nonDarwin: boolean,
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu: MenuTemplate = [
    {
      label: t('menu.importConnections', '&Import Saved Connections'),
      click() {
        ipcMain?.broadcastFocused('compass:open-import-connections');
      },
    },
    {
      label: t('menu.exportConnections', '&Export Saved Connections'),
      click() {
        ipcMain?.broadcastFocused('compass:open-export-connections');
      },
    },
  ];

  if (nonDarwin) {
    subMenu.push(separator());
    subMenu.push(quitItem(t('menu.exit', 'E&xit'), app));
  }

  return {
    label: t('menu.connections', '&Connections'),
    submenu: subMenu,
  };
}

function editSubMenu(): MenuItemConstructorOptions {
  return {
    label: t('menu.edit', 'Edit'),
    submenu: [
      {
        label: t('menu.undo', 'Undo'),
        accelerator: 'Command+Z',
        role: 'undo' as const,
      },
      {
        label: t('menu.redo', 'Redo'),
        accelerator: 'Shift+Command+Z',
        role: 'redo' as const,
      },
      separator(),
      {
        label: t('menu.cut', 'Cut'),
        accelerator: 'Command+X',
        role: 'cut' as const,
      },
      {
        label: t('menu.copy', 'Copy'),
        accelerator: 'Command+C',
        role: 'copy' as const,
      },
      {
        label: t('menu.paste', 'Paste'),
        accelerator: 'Command+V',
        role: 'paste' as const,
      },
      {
        label: t('menu.selectAll', 'Select All'),
        accelerator: 'Command+A',
        role: 'selectAll' as const,
      },
      separator(),
      {
        label: t('menu.find', 'Find'),
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
    label: t('menu.aboutMnemonic', '&About {name}', {
      name: electronApp.getName(),
    }),
    click() {
      void dialog.showMessageBox({
        type: 'info',
        title: t('menu.aboutDialog.title', 'About {name}', {
          name: electronApp.getName(),
        }),
        icon: COMPASS_ICON,
        message: electronApp.getName(),
        detail: t('menu.aboutDialog.version', 'Version {version}', {
          version: electronApp.getVersion(),
        }),
        buttons: [t('menu.aboutDialog.ok', 'OK')],
      });
    },
  };
}

function helpWindowItem(): MenuItemConstructorOptions {
  return {
    label: t('menu.onlineHelp', '&Online {name} Help', {
      name: electronApp.getName(),
    }),
    accelerator: 'F1',
    click() {
      void shell.openExternal(COMPASS_HELP);
    },
  };
}

function sourceCodeLink(): MenuItemConstructorOptions {
  return {
    label: t('menu.viewSourceCode', '&View Source Code on GitHub'),
    click() {
      void shell.openExternal('https://github.com/mongodb-js/compass');
    },
  };
}

function feedbackForumLink(): MenuItemConstructorOptions {
  return {
    label: t('menu.suggestFeature', '&Suggest a Feature'),
    click() {
      void shell.openExternal('https://feedback.mongodb.com/');
    },
  };
}

function bugReportLink(): MenuItemConstructorOptions {
  return {
    label: t('menu.reportBug', '&Report a Bug'),
    click() {
      void shell.openExternal(
        'https://jira.mongodb.org/projects/COMPASS/summary'
      );
    },
  };
}

function license(): MenuItemConstructorOptions {
  return {
    label: t('menu.license', '&License'),
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
    label: t('menu.openLogFile', '&Open Log File'),
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
    label: t('menu.help', '&Help'),
    submenu: subMenu,
  };
}

function viewSubMenu(
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu = [
    {
      label: t('menu.reload', '&Reload'),
      accelerator: 'CmdOrCtrl+Shift+R',
      click() {
        BrowserWindow.getFocusedWindow()?.reload();
      },
    },
    {
      label: t('menu.reloadData', '&Reload Data'),
      accelerator: 'CmdOrCtrl+R',
      click() {
        ipcMain?.broadcast('app:refresh-data');
      },
    },
    separator(),
    {
      label: t('menu.actualSize', 'Actual Size'),
      accelerator: 'CmdOrCtrl+0',
      click() {
        ipcMain?.broadcast('window:zoom-reset');
      },
    },
    {
      label: t('menu.zoomIn', 'Zoom In'),
      accelerator: 'CmdOrCtrl+=',
      click() {
        ipcMain?.broadcast('window:zoom-in');
      },
    },
    {
      label: t('menu.zoomOut', 'Zoom Out'),
      accelerator: 'CmdOrCtrl+-',
      click() {
        ipcMain?.broadcast('window:zoom-out');
      },
    },
  ];

  if (app.preferences.getPreferences().enableDevTools) {
    subMenu.push(separator());
    subMenu.push({
      label: t('menu.toggleDevTools', '&Toggle DevTools'),
      accelerator: 'Alt+CmdOrCtrl+I',
      click() {
        BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
      },
    });
  }

  return {
    label: t('menu.view', '&View'),
    submenu: subMenu,
  };
}

function windowSubMenu(
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const submenu: MenuTemplate = [
    {
      label: t('menu.newWindow', 'New &Window'),
      accelerator: 'CmdOrCtrl+N',
      click() {
        app.emit('show-connect-window');
      },
    },
    {
      label: t('menu.minimize', 'Minimize'),
      accelerator: 'Command+M',
      role: 'minimize' as const,
    },
    {
      label: t('menu.close', 'Close'),
      accelerator: 'Command+Shift+W',
      role: 'close' as const,
    },
    separator(),
    {
      label: t('menu.bringAllToFront', 'Bring All to Front'),
      role: 'front',
    },
  ];

  return {
    label: t('menu.window', 'Window'),
    submenu,
  };
}

// menus
function darwinMenu(
  menuState: WindowMenuState,
  app: typeof CompassApplication
): MenuItemConstructorOptions[] {
  return menuState.rendererState.translateRoles([
    darwinCompassSubMenu(menuState, app),
    connectSubMenu(false, app),
    editSubMenu(),
    viewSubMenu(app),
    ...menuState.rendererState.menus(),
    windowSubMenu(app),
    helpSubMenu(menuState, app),
  ]);
}

function nonDarwinMenu(
  menuState: WindowMenuState,
  app: typeof CompassApplication
): MenuItemConstructorOptions[] {
  return menuState.rendererState.translateRoles([
    connectSubMenu(true, app),
    editSubMenu(),
    viewSubMenu(app),
    ...menuState.rendererState.menus(),
    helpSubMenu(menuState, app),
  ]);
}

type UpdateManagerState = 'idle' | 'installing updates' | 'ready to restart';

class WindowMenuState {
  rendererState: RendererDefinedMenuState = new RendererDefinedMenuState(
    ipcMain
  );
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
          case AutoUpdateManagerStates.ManualDownload:
          case AutoUpdateManagerStates.DownloadingUpdate:
            return 'installing updates';
          case AutoUpdateManagerStates.RestartDismissed:
          case AutoUpdateManagerStates.PromptForRestart:
            return 'ready to restart';
          default:
            return 'idle';
        }
      })();
      this.updateMenu(() => ({ updateManagerState }));
    });

    ipcMain?.respondTo({
      [RendererDefinedMenuState.modifyApplicationMenuIpcEvent]: (ev, params) =>
        this.updateMenu((state) => ({
          rendererState:
            state.rendererState.modifyApplicationMenuHandler(params),
        })),
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

    preferences.onPreferenceValueChanged('language', () => {
      this.refreshMenu();
      void this.setupDockMenu();
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
    menuLanguage = this.app.preferences.getPreferences().language ?? 'en';
    if (process.platform === 'darwin') {
      // Dock is always available on macOS, `?` is just to satisfy TypeScript
      electronApp.dock?.setMenu(
        Menu.buildFromTemplate([
          {
            label: t('menu.dock.newWindow', 'New Window'),
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

    menuLanguage = this.app.preferences.getPreferences().language ?? 'en';

    const menu =
      process.platform === 'darwin'
        ? darwinMenu(menuState, this.app)
        : nonDarwinMenu(menuState, this.app);
    return menuState.rendererState.translateRoles(menu);
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

  private static updateMenu(
    newValues: (state: WindowMenuState) => Partial<WindowMenuState>,
    bw: BrowserWindow | null = this.lastFocusedWindow
  ) {
    debug(`updateMenu() set menu state to ${JSON.stringify(newValues)}`);

    if (!bw) {
      debug(`Can't update menu state: no window to update`);
      return;
    }

    const menuState = this.windowState.get(bw.id);

    if (menuState) {
      Object.assign(menuState, newValues(menuState));
      this.windowState.set(bw.id, menuState);
      this.setTemplate(bw.id);
    }
  }
}

export { CompassMenu, quitItem };
