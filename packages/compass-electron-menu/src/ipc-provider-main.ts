import type { IpcEvents, ModifyApplicationMenuParams } from './types';
import {
  transformAppMenu,
  type CompassAppMenu,
  type MenuItemConstructorOptions,
  type UUIDString,
} from './types';

export interface HadronIpcMain {
  broadcastFocused<K extends keyof IpcEvents>(
    channel: K,
    payload: IpcEvents[K]
  ): void;
}

export class RendererDefinedMenuState {
  private roleListeners: [MenuItemConstructorOptions['role'], string][] = [];
  private additionalMenus: { id: string; menu: CompassAppMenu<UUIDString> }[] =
    [];

  private ipcMain: HadronIpcMain;

  constructor(ipcMain: HadronIpcMain | undefined) {
    if (!ipcMain) {
      throw new Error('ipcMain is required for RendererDefinedMenuState');
    }
    this.ipcMain = ipcMain;
  }

  menus(): CompassAppMenu[] {
    return this.additionalMenus.map(
      ({ menu }): CompassAppMenu =>
        transformAppMenu(menu, (item) => {
          const id = item.click;
          if (!id) return { ...item, click: undefined };
          return {
            ...item,
            click: () =>
              this.ipcMain.broadcastFocused('application-menu:invoke-handler', {
                id,
              }),
          };
        })
    );
  }

  translateRoles(menus: CompassAppMenu[]): CompassAppMenu[] {
    return menus.map((menu): CompassAppMenu => {
      return transformAppMenu(menu, (item) => {
        if (!item.role) return item;

        const listener = this.roleListeners.find(
          ([role]) => role === item.role
        );
        if (!listener) return item;
        const id = listener[1];
        return {
          ...item,
          role: undefined,
          click: () =>
            this.ipcMain.broadcastFocused('application-menu:invoke-handler', {
              id,
            }),
        };
      });
    });
  }

  modifyApplicationMenuHandler = ({
    id,
    menu,
    role,
  }: ModifyApplicationMenuParams): this => {
    if (menu) {
      this.additionalMenus.push({ id, menu });
    } else {
      this.additionalMenus = this.additionalMenus.filter((m) => m.id !== id);
    }
    if (role) {
      this.roleListeners.push([role, id]);
    } else {
      this.roleListeners = this.roleListeners.filter(
        ([, listenerId]) => listenerId !== id
      );
    }
    return this;
  };

  static readonly modifyApplicationMenuIpcEvent =
    'application-menu:modify-application-menu' as const satisfies keyof IpcEvents;
}
