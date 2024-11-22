import EventEmitter from 'events';
import type { MenuItemConstructorOptions } from 'electron';
import { BrowserWindow, ipcMain, Menu, app, dialog } from 'electron';
import { expect } from 'chai';
import sinon from 'sinon';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

import type { CompassApplication } from './application';
import type { CompassMenu as _CompassMenu } from './menu';
import { quitItem } from './menu';
import { AutoUpdateManagerState } from './auto-update-manager';

function serializable<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

describe('CompassMenu', function () {
  const App = new EventEmitter() as unknown as typeof CompassApplication;
  let CompassMenu: typeof _CompassMenu;

  beforeEach(async function () {
    App.preferences = await createSandboxFromDefaultPreferences();
    delete require.cache[require.resolve('./menu')];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    CompassMenu = require('./menu').CompassMenu;
    CompassMenu.init(App);
  });

  afterEach(function () {
    App.removeAllListeners();
    ipcMain.removeAllListeners();
    sinon.restore();
  });

  it('should create an instance of Compass menu handler with initial state where no window is loaded', function () {
    expect(CompassMenu['windowState']).to.have.property('size', 0);
    expect(CompassMenu).to.have.property('lastFocusedWindow', null);
    expect(CompassMenu).to.have.property('currentWindowMenuLoaded', null);
  });

  it('should create and set window menu state when new window is created', function () {
    const bw = new BrowserWindow({ show: false });
    App.emit('new-window', bw);
    expect(CompassMenu['windowState']).to.have.property('size', 1);
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: false,
      isReadOnly: false,
      updateManagerState: 'idle',
    });
  });

  it('should remove window from state when window is closed', function () {
    const bw = new BrowserWindow({ show: false });
    App.emit('new-window', bw);
    bw.destroy();
    expect(CompassMenu['windowState']).to.have.property('size', 0);
    expect(CompassMenu).to.have.property('lastFocusedWindow', null);
    expect(CompassMenu).to.have.property('currentWindowMenuLoaded', null);
  });

  it('should swich window state when windows change focus', function () {
    const bw1 = new BrowserWindow({ show: false });
    const bw2 = new BrowserWindow({ show: false });
    App.emit('new-window', bw1);
    App.emit('new-window', bw2);
    expect(CompassMenu['windowState']).to.have.property('size', 2);
    expect(CompassMenu).to.have.property('lastFocusedWindow', bw2);
    expect(CompassMenu).to.have.property('currentWindowMenuLoaded', bw2.id);
    bw1.emit('focus', { sender: bw1 });
    expect(CompassMenu).to.have.property('lastFocusedWindow', bw1);
    expect(CompassMenu).to.have.property('currentWindowMenuLoaded', bw1.id);
  });

  it('should change window state when window emits show-collection-submenu event', function () {
    const bw = new BrowserWindow({ show: false });
    App.emit('new-window', bw);
    ipcMain.emit(
      'window:show-collection-submenu',
      { sender: bw.webContents },
      { isReadOnly: false }
    );
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: true,
      isReadOnly: false,
      updateManagerState: 'idle',
    });
    ipcMain.emit('window:hide-collection-submenu', { sender: bw.webContents });
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: false,
      isReadOnly: false,
      updateManagerState: 'idle',
    });
    ipcMain.emit(
      'window:show-collection-submenu',
      { sender: bw.webContents },
      { isReadOnly: true }
    );
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: true,
      isReadOnly: true,
      updateManagerState: 'idle',
    });
  });

  it('should change window state when window emits update-manager:new-state event', function () {
    const bw = new BrowserWindow({ show: false });
    App.emit('new-window', bw);
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: false,
      isReadOnly: false,
      updateManagerState: 'idle',
    });
    App.emit('auto-updater:new-state', AutoUpdateManagerState.PromptForRestart);
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: false,
      isReadOnly: false,
      updateManagerState: 'ready to restart',
    });
    App.emit(
      'auto-updater:new-state',
      AutoUpdateManagerState.DownloadingUpdate
    );

    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: false,
      isReadOnly: false,
      updateManagerState: 'installing updates',
    });
  });

  describe('getTemplate', function () {
    it('should generate a menu template that can be passed to the Electron Menu without errors', function () {
      expect(() => {
        const template = CompassMenu.getTemplate(0);
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
      }).not.to.throw();
    });

    describe('manual update menu item', function () {
      const bw = new BrowserWindow({ show: false });
      beforeEach(() => {
        App.emit('new-window', bw);
      });
      describe('darwin', () => {
        beforeEach(function () {
          if (process.platform !== 'darwin') this.skip();
        });
        describe('when the auto updater is in an idle state', () => {
          it('displays `Checking for updates...` in the menu', () => {
            const idleStates = [
              AutoUpdateManagerState.Initial,
              AutoUpdateManagerState.Disabled,
              AutoUpdateManagerState.UserPromptedManualCheck,
              AutoUpdateManagerState.CheckingForUpdatesForManualCheck,
              AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck,
              AutoUpdateManagerState.NoUpdateAvailable,
              AutoUpdateManagerState.UpdateAvailable,
              AutoUpdateManagerState.UpdateDismissed,
              AutoUpdateManagerState.DownloadingError,
              AutoUpdateManagerState.Restarting,
            ];
            for (const state of idleStates) {
              App.emit('auto-updater:new-state', state);
              const menu = serializable(CompassMenu.getTemplate(bw.id));
              const updateItem = (
                menu[0].submenu as any
              )?.[1] as MenuItemConstructorOptions;
              expect(updateItem.label).to.equal('Check for updates…');
            }
          });
        });

        describe('when the auto updater is in an downloading an update', () => {
          it('displays `Installing update...` in the menu', () => {
            sinon.stub(process, 'platform').value('darwin');

            const idleStates = [
              AutoUpdateManagerState.ManualDownload,
              AutoUpdateManagerState.DownloadingUpdate,
            ];
            for (const state of idleStates) {
              App.emit('auto-updater:new-state', state);
              const menu = serializable(CompassMenu.getTemplate(bw.id));
              const updateItem = (
                menu[0].submenu as any
              )?.[1] as MenuItemConstructorOptions;
              expect(updateItem.label).to.equal('Installing updates…');
              expect(updateItem.enabled).to.be.false;
            }
          });
        });

        describe('when the auto updater is in ready for restart', () => {
          it('displays `Restart` in the menu', () => {
            sinon.stub(process, 'platform').value('darwin');

            const idleStates = [
              AutoUpdateManagerState.PromptForRestart,
              AutoUpdateManagerState.RestartDismissed,
            ];
            for (const state of idleStates) {
              App.emit('auto-updater:new-state', state);
              const menu = serializable(CompassMenu.getTemplate(bw.id));
              const updateItem = (
                menu[0].submenu as any
              )?.[1] as MenuItemConstructorOptions;
              expect(updateItem.label).to.equal('Restart');
            }
          });
        });
      });

      for (const platform of ['linux', 'win32']) {
        describe(platform, () => {
          beforeEach(function () {
            if (process.platform !== platform) this.skip();
          });
          describe('when the auto updater is in an idle state', () => {
            it('displays `Checking for updates...` in the menu', () => {
              const idleStates = [
                AutoUpdateManagerState.Initial,
                AutoUpdateManagerState.Disabled,
                AutoUpdateManagerState.UserPromptedManualCheck,
                AutoUpdateManagerState.CheckingForUpdatesForManualCheck,
                AutoUpdateManagerState.CheckingForUpdatesForAutomaticCheck,
                AutoUpdateManagerState.NoUpdateAvailable,
                AutoUpdateManagerState.UpdateAvailable,
                AutoUpdateManagerState.UpdateDismissed,
                AutoUpdateManagerState.DownloadingError,
                AutoUpdateManagerState.Restarting,
              ];
              for (const state of idleStates) {
                App.emit('auto-updater:new-state', state);
                const menu = serializable(CompassMenu.getTemplate(bw.id));
                const updateItem = (
                  menu[3].submenu as any
                )?.[8] as MenuItemConstructorOptions;
                expect(updateItem.label).to.equal('Check for updates…');
              }
            });
          });
        });

        describe('when the auto updater is in an downloading an update', () => {
          it('displays `Installing update...` in the menu', () => {
            sinon.stub(process, 'platform').value(platform);

            const idleStates = [
              AutoUpdateManagerState.ManualDownload,
              AutoUpdateManagerState.DownloadingUpdate,
            ];
            for (const state of idleStates) {
              App.emit('auto-updater:new-state', state);
              const menu = serializable(CompassMenu.getTemplate(bw.id));
              const updateItem = (
                menu[3].submenu as any
              )?.[8] as MenuItemConstructorOptions;
              expect(updateItem.label).to.equal('Installing updates…');
              expect(updateItem.enabled).to.be.false;
            }
          });
        });

        describe('when the auto updater is in ready for restart', () => {
          it('displays `Restart` in the menu', () => {
            sinon.stub(process, 'platform').value(platform);

            const idleStates = [
              AutoUpdateManagerState.PromptForRestart,
              AutoUpdateManagerState.RestartDismissed,
            ];
            for (const state of idleStates) {
              App.emit('auto-updater:new-state', state);
              const menu = serializable(CompassMenu.getTemplate(bw.id));
              const updateItem = (
                menu[3].submenu as any
              )?.[8] as MenuItemConstructorOptions;
              expect(updateItem.label).to.equal('Restart');
            }
          });
        });
      }
    });

    it('should generate a menu template for darwin', async function () {
      await App.preferences.savePreferences({
        enableMultipleConnectionSystem: true,
      });
      sinon.stub(process, 'platform').value('darwin');
      expect(serializable(CompassMenu.getTemplate(0))).to.deep.equal([
        {
          label: app.getName(),
          submenu: [
            { label: `About ${app.getName()}`, role: 'about' },
            { label: 'Check for updates…' },
            { type: 'separator' },
            { label: '&Settings', accelerator: 'CmdOrCtrl+,' },
            { type: 'separator' },
            { label: 'Hide', accelerator: 'Command+H', role: 'hide' },
            {
              label: 'Hide Others',
              accelerator: 'Command+Shift+H',
              role: 'hideOthers',
            },
            { label: 'Show All', role: 'unhide' },
            { type: 'separator' },
            { label: 'Quit', accelerator: 'CmdOrCtrl+Q' },
          ],
        },
        {
          label: '&Connections',
          submenu: [
            { label: '&Import Saved Connections' },
            { label: '&Export Saved Connections' },
          ],
        },
        {
          label: 'Edit',
          submenu: [
            { label: 'Undo', accelerator: 'Command+Z', role: 'undo' },
            { label: 'Redo', accelerator: 'Shift+Command+Z', role: 'redo' },
            { type: 'separator' },
            { label: 'Cut', accelerator: 'Command+X', role: 'cut' },
            { label: 'Copy', accelerator: 'Command+C', role: 'copy' },
            { label: 'Paste', accelerator: 'Command+V', role: 'paste' },
            {
              label: 'Select All',
              accelerator: 'Command+A',
              role: 'selectAll',
            },
            { type: 'separator' },
            { label: 'Find', accelerator: 'CmdOrCtrl+F' },
          ],
        },
        {
          label: '&View',
          submenu: [
            { label: '&Reload', accelerator: 'CmdOrCtrl+Shift+R' },
            { label: '&Reload Data', accelerator: 'CmdOrCtrl+R' },
            { type: 'separator' },
            { label: 'Actual Size', accelerator: 'CmdOrCtrl+0' },
            { label: 'Zoom In', accelerator: 'CmdOrCtrl+=' },
            { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-' },
          ],
        },
        {
          label: 'Window',
          submenu: [
            { label: 'New &Window', accelerator: 'CmdOrCtrl+N' },
            { label: 'Minimize', accelerator: 'Command+M', role: 'minimize' },
            { label: 'Close', accelerator: 'Command+Shift+W', role: 'close' },
            { type: 'separator' },
            { label: 'Bring All to Front', role: 'front' },
          ],
        },
        {
          label: '&Help',
          submenu: [
            { label: `&Online ${app.getName()} Help`, accelerator: 'F1' },
            { label: '&License' },
            { label: `&View Source Code on GitHub` },
            { label: `&Suggest a Feature` },
            { label: `&Report a Bug` },
            { label: '&Open Log File' },
          ],
        },
      ]);
    });

    it('does not crash when rendering menu item with an accelerator', () => {
      const window = new BrowserWindow({ show: false });
      const template = CompassMenu.getTemplate(window.id);

      // As the root menu items do not have accelerators, we test
      // against each item's submenu.
      for (const item of template) {
        // for TS. compass menu has submenus
        if (!Array.isArray(item.submenu)) {
          continue;
        }
        const menu = Menu.buildFromTemplate(item.submenu);
        menu.popup({ window });
        menu.closePopup();
      }
    });

    it('should generate a menu template without collection submenu if `showCollection` is `false`', function () {
      expect(
        CompassMenu.getTemplate(0).find((item) => item.label === '&Collection')
      ).to.be.undefined;
    });

    it('should generate a menu template with collection submenu if `showCollection` is `true`', function () {
      CompassMenu['windowState'].set(0, {
        showCollection: true,
        isReadOnly: false,
        updateManagerState: 'idle',
      });
      expect(
        // Contains functions, so we can't easily deep equal it without
        // converting to serializable format
        serializable(
          CompassMenu.getTemplate(0).find(
            (item) => item.label === '&Collection'
          )
        )
      ).to.deep.eq({
        label: '&Collection',
        submenu: [
          {
            accelerator: 'Alt+CmdOrCtrl+S',
            label: '&Share Schema as JSON',
          },
          {
            type: 'separator',
          },
          {
            label: '&Import Data',
          },
          {
            label: '&Export Collection',
          },
        ],
      });
    });

    it('should generate a menu template with import collection action hidden if `isReadOnly` is `true`', function () {
      CompassMenu['windowState'].set(0, {
        showCollection: true,
        isReadOnly: true,
        updateManagerState: 'idle',
      });
      expect(
        // Contains functions, so we can't easily deep equal it without
        // converting to serializable format
        serializable(
          CompassMenu.getTemplate(0).find(
            (item) => item.label === '&Collection'
          )
        )
      ).to.deep.eq({
        label: '&Collection',
        submenu: [
          {
            accelerator: 'Alt+CmdOrCtrl+S',
            label: '&Share Schema as JSON',
          },
          {
            type: 'separator',
          },
          {
            label: '&Export Collection',
          },
        ],
      });
    });

    it('should generate a view menu template with toggle devtools', async function () {
      await App.preferences.savePreferences({ enableDevTools: true });

      const menu = serializable(
        CompassMenu.getTemplate(0).find((item) => item.label === '&View')
          ?.submenu
      ) as any;

      expect(
        menu.find((item: any) => item.label === '&Toggle DevTools')
      ).to.deep.eq({
        accelerator: 'Alt+CmdOrCtrl+I',
        label: '&Toggle DevTools',
      });
    });
  });

  describe('quitItem', () => {
    it('should show box if enableShowDialogOnQuit is true, then cancels and does not save changes', async function () {
      await App.preferences.savePreferences({
        enableShowDialogOnQuit: true,
      });
      const showMessageBoxStub = sinon
        .stub(dialog, 'showMessageBox')
        .resolves({ response: 1, checkboxChecked: true });
      const quitStub = sinon.stub(app, 'quit');
      const item = quitItem('Quit', App);
      await (item as any).click();

      expect(showMessageBoxStub).to.have.been.called;
      expect(quitStub).not.to.have.been.called;
      expect(App.preferences.getPreferences().enableShowDialogOnQuit).to.be
        .true;
    });

    it('should show box if enableShowDialogOnQuit is true, then quits app and saves changes', async function () {
      await App.preferences.savePreferences({
        enableShowDialogOnQuit: true,
      });
      const showMessageBoxStub = sinon
        .stub(dialog, 'showMessageBox')
        .resolves({ response: 0, checkboxChecked: true });
      const quitStub = sinon.stub(app, 'quit');
      const item = quitItem('Quit', App);
      await (item as any).click();

      expect(showMessageBoxStub).to.have.been.called;
      expect(quitStub).to.have.been.called;
      expect(App.preferences.getPreferences().enableShowDialogOnQuit).to.be
        .false;
    });

    it('should quit app immediately if enableShowDialogOnQuit is false and keeps changes', async function () {
      await App.preferences.savePreferences({
        enableShowDialogOnQuit: false,
      });
      const showMessageBoxStub = sinon
        .stub(dialog, 'showMessageBox')
        .resolves({ response: 0, checkboxChecked: true });
      const quitStub = sinon.stub(app, 'quit');
      const item = quitItem('Quit', App);
      (item as any).click();

      expect(showMessageBoxStub).not.to.have.been.called;
      expect(quitStub).to.have.been.called;
      expect(App.preferences.getPreferences().enableShowDialogOnQuit).to.be
        .false;
    });
  });
});
