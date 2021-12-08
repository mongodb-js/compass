import EventEmitter from 'events';
import { BrowserWindow, ipcMain, Menu } from 'electron';
import { expect } from 'chai';
import type { CompassApplication } from './application';
import type { CompassMenu as _CompassMenu } from './menu';

function serializable(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

describe('CompassMenu', function () {
  const App = new EventEmitter() as unknown as typeof CompassApplication;
  let CompassMenu: typeof _CompassMenu;

  beforeEach(function () {
    delete require.cache[require.resolve('./menu')];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    CompassMenu = require('./menu').CompassMenu;
  });

  afterEach(function () {
    App.removeAllListeners();
    ipcMain.removeAllListeners();
  });

  it('should create an instance of Compass menu handler with initial state where no window is loaded', function () {
    CompassMenu.init(App);
    expect(CompassMenu['windowState']).to.have.property('size', 0);
    expect(CompassMenu).to.have.property('lastFocusedWindow', null);
    expect(CompassMenu).to.have.property('currentWindowMenuLoaded', null);
  });

  it('should create and set window menu state when new window is created', function () {
    const bw = new BrowserWindow({ show: false });
    CompassMenu.init(App);
    App.emit('new-window', bw);
    expect(CompassMenu['windowState']).to.have.property('size', 1);
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: false,
      isReadOnly: false,
    });
  });

  it('should remove window from state when window is closed', function () {
    const bw = new BrowserWindow({ show: false });
    CompassMenu.init(App);
    App.emit('new-window', bw);
    bw.destroy();
    expect(CompassMenu['windowState']).to.have.property('size', 0);
    expect(CompassMenu).to.have.property('lastFocusedWindow', null);
    expect(CompassMenu).to.have.property('currentWindowMenuLoaded', null);
  });

  it('should swich window state when windows change focus', function () {
    const bw1 = new BrowserWindow({ show: false });
    const bw2 = new BrowserWindow({ show: false });
    CompassMenu.init(App);
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
    CompassMenu.init(App);
    App.emit('new-window', bw);
    ipcMain.emit(
      'window:show-collection-submenu',
      { sender: bw.webContents },
      { isReadOnly: false }
    );
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: true,
      isReadOnly: false,
    });
    ipcMain.emit('window:hide-collection-submenu', { sender: bw.webContents });
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: false,
      isReadOnly: false,
    });
    ipcMain.emit(
      'window:show-collection-submenu',
      { sender: bw.webContents },
      { isReadOnly: true }
    );
    expect(CompassMenu['windowState'].get(bw.id)).to.deep.eq({
      showCollection: true,
      isReadOnly: true,
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

    it('should generate a view menu template', function () {
      expect(
        serializable(
          // Contains functions, so we can't easily deep equal it without
          // converting to serializable format
          CompassMenu.getTemplate(0).find((item) => item.label === '&View')
        )
      ).to.deep.eq({
        label: '&View',
        submenu: [
          {
            accelerator: 'CmdOrCtrl+Shift+R',
            label: '&Reload',
          },
          {
            accelerator: 'CmdOrCtrl+R',
            label: '&Reload Data',
          },
          {
            type: 'separator',
          },
          {
            accelerator: 'CmdOrCtrl+0',
            label: 'Actual Size',
          },
          {
            accelerator: 'CmdOrCtrl+=',
            label: 'Zoom In',
          },
          {
            accelerator: 'CmdOrCtrl+-',
            label: 'Zoom Out',
          },
          {
            type: 'separator',
          },
          {
            accelerator: 'Alt+CmdOrCtrl+I',
            label: '&Toggle DevTools',
          },
        ],
      });
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
  });
});
