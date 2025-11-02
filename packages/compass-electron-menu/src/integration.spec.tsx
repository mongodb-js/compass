import React from 'react';
import { render } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import {
  ApplicationMenuContextProvider,
  useApplicationMenu,
} from './application-menu';
import type { CompassAppMenu, ModifyApplicationMenuParams } from './types';
import type { HadronIpcRenderer } from './ipc-provider-renderer';
import { ApplicationMenu } from './ipc-provider-renderer';
import type { HadronIpcMain } from './ipc-provider-main';
import { RendererDefinedMenuState } from './ipc-provider-main';
import { EventEmitter } from 'events';

function serializable<T>(obj: T): T {
  try {
    return JSON.parse(
      JSON.stringify(obj, (_, value) => {
        if (typeof value === 'function') {
          return '[Function]';
        }
        return value;
      })
    );
  } catch {
    return obj;
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve));

const TestComponent: React.FC<{
  menu?: CompassAppMenu;
  roles?: Record<string, () => void>;
}> = ({ menu, roles }) => {
  useApplicationMenu({ menu, roles });
  return null;
};

describe('application menu integration test', function () {
  let ipcRenderer: HadronIpcRenderer & EventEmitter;
  let ipcMain: HadronIpcMain & EventEmitter;

  beforeEach(function () {
    ipcRenderer = new (class extends EventEmitter implements HadronIpcRenderer {
      // eslint-disable-next-line @typescript-eslint/require-await
      async call(event: string, payload: unknown) {
        queueMicrotask(() => ipcMain.emit(event, null, payload));
      }
    })();
    ipcMain = new (class extends EventEmitter implements HadronIpcMain {
      broadcastFocused(event: string, payload: unknown): void {
        queueMicrotask(() => ipcRenderer.emit(event, null, payload));
      }
    })();
  });

  it('lets the react hook establish an application menu', async function () {
    const provider = new ApplicationMenu(ipcRenderer);
    const state = new RendererDefinedMenuState(ipcMain);

    ipcMain.on(
      RendererDefinedMenuState.modifyApplicationMenuIpcEvent,
      (_, event: ModifyApplicationMenuParams) =>
        state.modifyApplicationMenuHandler(event)
    );

    const clicks = { a: 0, b: 0, c: 0 };
    const clickA = () => clicks.a++;
    const clickB = () => clicks.b++;
    const clickC = () => clicks.c++;
    const menuA: CompassAppMenu = {
      label: '&Actions',
      submenu: [{ label: 'Action', click: clickA }],
    };
    const menuB: CompassAppMenu = {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          role: 'undo',
        },
        {
          label: 'Redo',
          role: 'redo',
        },
      ],
    };

    const { rerender } = render(
      <ApplicationMenuContextProvider provider={provider}>
        {null}
      </ApplicationMenuContextProvider>
    );

    const getMenuForProps = async (
      props?: React.ComponentProps<typeof TestComponent>
    ) => {
      rerender(
        <ApplicationMenuContextProvider provider={provider}>
          <TestComponent {...props} />
        </ApplicationMenuContextProvider>
      );

      await tick();
      return state.translateRoles([menuB, ...state.menus()]);
    };

    let menu: CompassAppMenu[] = await getMenuForProps();
    expect(serializable(menu)).to.deep.equal([
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', role: 'undo' },
          { label: 'Redo', role: 'redo' },
        ],
      },
    ]);

    menu = await getMenuForProps({ menu: menuA });
    expect(serializable(menu)).to.deep.equal([
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', role: 'undo' },
          { label: 'Redo', role: 'redo' },
        ],
      },
      {
        label: '&Actions',
        submenu: [{ label: 'Action', click: '[Function]' }],
      },
    ]);

    expect(clicks).to.deep.equal({ a: 0, b: 0, c: 0 });
    menu.find((m) => m.label === '&Actions')?.submenu?.[0].click?.();
    await tick();
    expect(clicks).to.deep.equal({ a: 1, b: 0, c: 0 });

    menu = await getMenuForProps({ roles: { undo: clickB, redo: clickC } });
    expect(serializable(menu)).to.deep.equal([
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', click: '[Function]' },
          { label: 'Redo', click: '[Function]' },
        ],
      },
    ]);

    expect(clicks).to.deep.equal({ a: 1, b: 0, c: 0 });
    menu
      .find((m) => m.label === 'Edit')
      ?.submenu?.find((i) => i.label === 'Undo')
      ?.click?.();
    await tick();
    expect(clicks).to.deep.equal({ a: 1, b: 1, c: 0 });
    menu
      .find((m) => m.label === 'Edit')
      ?.submenu?.find((i) => i.label === 'Redo')
      ?.click?.();
    await tick();
    expect(clicks).to.deep.equal({ a: 1, b: 1, c: 1 });

    menu = await getMenuForProps();
    expect(serializable(menu)).to.deep.equal([
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', role: 'undo' },
          { label: 'Redo', role: 'redo' },
        ],
      },
    ]);
  });
});
