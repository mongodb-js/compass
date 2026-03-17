import type { ApplicationMenuProvider, CompassAppMenu } from './';
import type {
  IpcEvents,
  MenuItemConstructorOptions,
  UUIDString,
} from './types';
import { transformAppMenu } from './types';
import { uuid } from './util';
import createDebug from 'debug';
const debug = createDebug('compass-electron-menu:ipc-provider-renderer');
export interface HadronIpcRenderer {
  on<K extends keyof IpcEvents>(
    event: K,
    listener: (event: unknown, payload: IpcEvents[K]) => void
  ): void;
  call<K extends keyof IpcEvents>(
    event: K,
    payload: IpcEvents[K]
  ): Promise<void>;
}

function translateCallsToHandlerIds(
  menu: CompassAppMenu
): [CompassAppMenu<UUIDString>, Map<string, () => void>] {
  const handlerIds = new Map<string, () => void>();
  const transformedMenu = transformAppMenu(menu, (item) => {
    if (!item.click) return { ...item, click: undefined };
    const id = uuid();
    handlerIds.set(id, item.click);
    return { ...item, click: id };
  });
  return [transformedMenu, handlerIds];
}

export class ApplicationMenu implements ApplicationMenuProvider {
  handlers = new Map<string, () => void>();
  ipcRenderer: HadronIpcRenderer | undefined;

  constructor(ipcRenderer: HadronIpcRenderer | undefined) {
    this.ipcRenderer = ipcRenderer;
    this.ipcRenderer?.on(
      'application-menu:invoke-handler',
      (event, { id }: { id: string }) => {
        const handler = this.handlers.get(id);
        if (!handler) debug('No handler found for menu item id', id);
        handler?.();
      }
    );
  }

  showApplicationMenu = (menu: CompassAppMenu): (() => void) => {
    const id = uuid();
    const [translatedMenu, handlers] = translateCallsToHandlerIds(menu);
    for (const [handlerId, handler] of handlers.entries()) {
      this.handlers.set(handlerId, handler);
    }
    void this.ipcRenderer?.call('application-menu:modify-application-menu', {
      id,
      menu: translatedMenu,
    });
    return () => {
      void this.ipcRenderer?.call('application-menu:modify-application-menu', {
        id,
        menu: undefined,
      });
      for (const handlerId of handlers.keys()) {
        this.handlers.delete(handlerId);
      }
    };
  };

  handleMenuRole = (
    role: MenuItemConstructorOptions['role'],
    handler: () => void
  ): (() => void) => {
    const id = uuid();
    this.handlers.set(id, handler);
    void this.ipcRenderer?.call('application-menu:modify-application-menu', {
      id,
      role,
    });
    return () => {
      void this.ipcRenderer?.call('application-menu:modify-application-menu', {
        id,
      });
      this.handlers.delete(id);
    };
  };
}
