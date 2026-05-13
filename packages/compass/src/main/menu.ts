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
import { i18n, initLanguage } from './menu-i18n';

const track = createIpcTrack();

type MenuItemConstructorOptions = CompassAppMenu; // Alias to reduce diff complexity
type MenuTemplate = CompassAppMenu | CompassAppMenu[];

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
      if (!compassApp.preferences.getPreferences().enableShowDialogOnQuit) {
        electronApp.quit();
        return;
      }

      void dialog
        .showMessageBox({
          type: 'warning',
          title: i18n.t('quitDialogTitle', {
            appName: electronApp.getName(),
          }),
          icon: COMPASS_ICON,
          message: i18n.t('quitDialogMessage'),
          buttons: [i18n.t('quitConfirm'), i18n.t('cancel')],
          checkboxLabel: i18n.t('doNotAskAgain'),
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
    label: i18n.t('settings'),
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
        label: i18n.t('checkForUpdates'),
        click() {
          compassApp.emit('check-for-updates');
        },
      }
    : updateManagerState === 'installing updates'
    ? {
        label: i18n.t('installingUpdates'),
        enabled: false,
      }
    : {
        label: i18n.t('restartToUpdate'),
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
        label: i18n.t('aboutApp', { appName: electronApp.getName() }),
        role: 'about',
      },
      updateSubmenu(windowState, compassApp),
      separator(),
      settingsDialogItem(),
      separator(),
      {
        label: i18n.t('hide'),
        accelerator: 'Command+H',
        role: 'hide',
      },
      {
        label: i18n.t('hideOthers'),
        accelerator: 'Command+Shift+H',
        role: 'hideOthers',
      },
      {
        label: i18n.t('showAll'),
        role: 'unhide',
      },
      separator(),
      quitItem(i18n.t('quit'), compassApp),
    ],
  };
}

function connectSubMenu(
  nonDarwin: boolean,
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu: MenuTemplate = [
    {
      label: i18n.t('importConnections'),
      click() {
        ipcMain?.broadcastFocused('compass:open-import-connections');
      },
    },
    {
      label: i18n.t('exportConnections'),
      click() {
        ipcMain?.broadcastFocused('compass:open-export-connections');
      },
    },
  ];

  if (nonDarwin) {
    subMenu.push(separator());
    subMenu.push(quitItem(i18n.t('exit'), app));
  }

  return {
    label: i18n.t('connections'),
    submenu: subMenu,
  };
}

function editSubMenu(): MenuItemConstructorOptions {
  return {
    label: i18n.t('edit'),
    submenu: [
      {
        label: i18n.t('undo'),
        accelerator: 'Command+Z',
        role: 'undo' as const,
      },
      {
        label: i18n.t('redo'),
        accelerator: 'Shift+Command+Z',
        role: 'redo' as const,
      },
      separator(),
      {
        label: i18n.t('cut'),
        accelerator: 'Command+X',
        role: 'cut' as const,
      },
      {
        label: i18n.t('copy'),
        accelerator: 'Command+C',
        role: 'copy' as const,
      },
      {
        label: i18n.t('paste'),
        accelerator: 'Command+V',
        role: 'paste' as const,
      },
      {
        label: i18n.t('selectAll'),
        accelerator: 'Command+A',
        role: 'selectAll' as const,
      },
      separator(),
      {
        label: i18n.t('find'),
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
    label: i18n.t('nonDarwinAboutItem', { appName: electronApp.getName() }),
    click() {
      void dialog.showMessageBox({
        type: 'info',
        title: i18n.t('nonDarwinAboutDialogTitle', {
          appName: electronApp.getName(),
        }),
        icon: COMPASS_ICON,
        message: electronApp.getName(),
        detail: i18n.t('nonDarwinAboutVersion', {
          version: electronApp.getVersion(),
        }),
        buttons: [i18n.t('ok')],
      });
    },
  };
}

function helpWindowItem(): MenuItemConstructorOptions {
  return {
    label: i18n.t('onlineHelp', { appName: electronApp.getName() }),
    accelerator: 'F1',
    click() {
      void shell.openExternal(COMPASS_HELP);
    },
  };
}

function sourceCodeLink(): MenuItemConstructorOptions {
  return {
    label: i18n.t('viewSourceCode'),
    click() {
      void shell.openExternal('https://github.com/mongodb-js/compass');
    },
  };
}

function feedbackForumLink(): MenuItemConstructorOptions {
  return {
    label: i18n.t('suggestFeature'),
    click() {
      void shell.openExternal('https://feedback.mongodb.com/');
    },
  };
}

function bugReportLink(): MenuItemConstructorOptions {
  return {
    label: i18n.t('reportBug'),
    click() {
      void shell.openExternal(
        'https://jira.mongodb.org/projects/COMPASS/summary'
      );
    },
  };
}

function license(): MenuItemConstructorOptions {
  return {
    label: i18n.t('license'),
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
    label: i18n.t('openLogFile'),
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
    label: i18n.t('help'),
    submenu: subMenu,
  };
}

function viewSubMenu(
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const subMenu = [
    {
      label: i18n.t('reload'),
      accelerator: 'CmdOrCtrl+Shift+R',
      click() {
        BrowserWindow.getFocusedWindow()?.reload();
      },
    },
    {
      label: i18n.t('reloadData'),
      accelerator: 'CmdOrCtrl+R',
      click() {
        ipcMain?.broadcast('app:refresh-data');
      },
    },
    separator(),
    {
      label: i18n.t('actualSize'),
      accelerator: 'CmdOrCtrl+0',
      click() {
        ipcMain?.broadcast('window:zoom-reset');
      },
    },
    {
      label: i18n.t('zoomIn'),
      accelerator: 'CmdOrCtrl+=',
      click() {
        ipcMain?.broadcast('window:zoom-in');
      },
    },
    {
      label: i18n.t('zoomOut'),
      accelerator: 'CmdOrCtrl+-',
      click() {
        ipcMain?.broadcast('window:zoom-out');
      },
    },
  ];

  if (app.preferences.getPreferences().enableDevTools) {
    subMenu.push(separator());
    subMenu.push({
      label: i18n.t('toggleDevTools'),
      accelerator: 'Alt+CmdOrCtrl+I',
      click() {
        BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
      },
    });
  }

  return {
    label: i18n.t('view'),
    submenu: subMenu,
  };
}

function windowSubMenu(
  app: typeof CompassApplication
): MenuItemConstructorOptions {
  const submenu: MenuTemplate = [
    {
      label: i18n.t('newWindow'),
      accelerator: 'CmdOrCtrl+N',
      click() {
        app.emit('show-connect-window');
      },
    },
    {
      label: i18n.t('minimize'),
      accelerator: 'Command+M',
      role: 'minimize' as const,
    },
    {
      label: i18n.t('close'),
      accelerator: 'Command+Shift+W',
      role: 'close' as const,
    },
    separator(),
    {
      label: i18n.t('bringAllToFront'),
      role: 'front',
    },
  ];

  return {
    label: i18n.t('window'),
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

    preferences.onPreferenceValueChanged(
      'enableDevTools',
      (enableDevTools: boolean) => {
        this.refreshMenu();
        if (!enableDevTools) {
          BrowserWindow.getFocusedWindow()?.webContents.closeDevTools();
        }
      }
    );

    initLanguage(preferences.getPreferences().language);
    preferences.onPreferenceValueChanged('language', (language: string) => {
      initLanguage(language);
      this.refreshMenu();
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
      // Dock is always available on macOS, `?` is just to satisfy TypeScript
      electronApp.dock?.setMenu(
        Menu.buildFromTemplate([
          {
            label: i18n.t('newWindowDock'),
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
