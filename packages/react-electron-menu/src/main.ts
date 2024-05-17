import type { MenuItemConstructorOptions, WebContents } from 'electron';
import { app, ipcMain, Menu, BrowserWindow } from 'electron';

type BrowserWindowId = string;

const MENU_MAP: Record<BrowserWindowId, Record<string, Menu>> = {};

function traverseTemplate(
  template: MenuItemConstructorOptions[],
  fn: (item: MenuItemConstructorOptions) => MenuItemConstructorOptions
) {
  return template.map((item) => {
    item = fn(item);
    if (Array.isArray(item.submenu)) {
      item.submenu = traverseTemplate(item.submenu, fn);
    }
    return item;
  });
}

function buildMenuFromTemplate(
  webContents: WebContents,
  template: MenuItemConstructorOptions | MenuItemConstructorOptions[]
) {
  template = Array.isArray(template) ? template : [template];

  return Menu.buildFromTemplate(
    traverseTemplate(template, (item) => {
      return {
        ...item,
        click(menuItem, _browserWindow, event) {
          webContents.send('react-electron-menu-on-click', menuItem.id, event);
        },
      };
    })
  );
}

export function initialize() {
  ipcMain.on(
    'react-electron-menu-update',
    (event, { id: menuId, type, template }) => {
      const id = String(event.sender.id);
      const menu = buildMenuFromTemplate(event.sender, template);

      // Only context menu can have multiple definitions per window
      menuId = type === 'context' ? menuId : type;

      MENU_MAP[id] ??= {};
      MENU_MAP[id][menuId] = menu;

      if (type === 'dock' && process.platform === 'darwin') {
        app.dock.setMenu(menu);
        return;
      }

      if (type === 'context') {
        // TODO: should do nothing here, but show menu on context click event
        return;
      }

      Menu.setApplicationMenu(menu);
    }
  );

  ipcMain.on(
    'react-electron-menu-contextmenu-click',
    (event, { id: menuId }) => {
      const id = String(event.sender.id);
      const menu = MENU_MAP[id][menuId];

      if (!menu) {
        return;
      }

      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) {
        return;
      }

      menu.popup({ window });
    }
  );

  ipcMain.on('react-electron-menu-unmount', () => {
    // TODO: cleanup
  });

  app.on('browser-window-focus', (_event, window) => {
    const menu = MENU_MAP[String(window.webContents.id)]?.menu;
    Menu.setApplicationMenu(menu ?? null);
  });
}
