import React from 'react';
import { expect } from 'chai';
import { stub } from 'sinon';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultipleConnectionSidebar } from './sidebar';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ToastArea } from '@mongodb-js/compass-components';
import {
  ConnectionStorageProvider,
  type ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionStorageBus } from '@mongodb-js/connection-storage/renderer';
import type { DataService } from 'mongodb-data-service';
import {
  ConnectionsManagerProvider,
  ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import { createSidebarStore } from '../../stores';
import { Provider } from 'react-redux';
import AppRegistry from 'hadron-app-registry';
import { createInstance } from '../../../test/helpers';

type PromiseFunction = (
  resolve: (dataService: DataService) => void,
  reject: (error: { message: string }) => void
) => void;

function slowConnection(response: PromiseFunction): Promise<DataService> {
  return new Promise<DataService>((resolve, reject) => {
    setTimeout(() => response(resolve, reject), 20);
  });
}

function andFail(message: string): PromiseFunction {
  return (resolve, reject) => reject({ message });
}

function andSucceed(): PromiseFunction {
  return (resolve) => resolve({} as DataService);
}

const savedConnection: ConnectionInfo = {
  id: '12345',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    name: 'localhost',
    color: 'color2',
  },
  savedConnectionType: 'favorite',
};

type ItselfAndStub<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? ReturnType<typeof stub> : T[K];
};

describe('Multiple Connections Sidebar Component', function () {
  const connectionStorage: ItselfAndStub<
    Pick<
      typeof ConnectionStorage,
      'events' | 'loadAll' | 'load' | 'save' | 'delete'
    >
  > = {
    events: new ConnectionStorageBus(),
    loadAll: stub(),
    load: stub(),
    save: stub(),
    delete: stub(),
  };
  const instance = createInstance();
  const globalAppRegistry = new AppRegistry();
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;

  const connectFn = stub();

  function doRender() {
    const storage = connectionStorage as any;
    const connectionManager = new ConnectionsManager({
      logger: { debug: stub() } as any,
      __TEST_CONNECT_FN: connectFn,
    });
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        dataService: {
          getConnectionOptions() {
            return {};
          },
          currentOp() {},
          top() {},
        },
        instance,
        logger: { log: { warn() {} }, mongoLogId() {} },
      } as any,
      { on() {}, cleanup() {}, addCleanup() {} } as any
    ));

    return render(
      <ToastArea>
        <ConnectionStorageProvider value={storage}>
          <ConnectionsManagerProvider value={connectionManager}>
            <Provider store={store}>
              <MultipleConnectionSidebar
                activeWorkspace={{ type: 'connection' }}
              />
            </Provider>
          </ConnectionsManagerProvider>
        </ConnectionStorageProvider>
      </ToastArea>
    );
  }

  beforeEach(function () {
    connectionStorage.loadAll.returns([savedConnection]);

    doRender();
  });

  afterEach(function () {
    connectionStorage.loadAll.reset();
    connectionStorage.load.reset();
    connectionStorage.save.reset();
    connectionStorage.delete.reset();

    deactivate();
    cleanup();
  });

  describe('opening a new connection', function () {
    let parentSavedConnection: HTMLElement;

    describe('when successfully connected', function () {
      it('calls the connection function and renders the progress toast', async function () {
        connectFn.returns(slowConnection(andSucceed()));
        parentSavedConnection = screen.getByTestId('saved-connection-12345');

        userEvent.hover(parentSavedConnection);

        const connectButton = within(parentSavedConnection).getByLabelText(
          'Connect'
        );

        userEvent.click(connectButton);
        const connectingToast = screen.getByText('Connecting to localhost');
        expect(connectingToast).to.exist;
        expect(connectFn).to.have.been.called;

        await waitFor(() => {
          expect(screen.queryByText('Connecting to localhost')).to.not.exist;
        });
      });
    });

    describe('when failing to connect', function () {
      it('calls the connection function and renders the error toast', async function () {
        connectionStorage.loadAll.returns([savedConnection]);
        connectFn.returns(slowConnection(andFail('Expected failure')));
        parentSavedConnection = screen.getByTestId('saved-connection-12345');

        userEvent.hover(parentSavedConnection);

        const connectButton = within(parentSavedConnection).getByLabelText(
          'Connect'
        );

        userEvent.click(connectButton);
        const connectingToast = screen.getByText('Connecting to localhost');
        expect(connectingToast).to.exist;
        expect(connectFn).to.have.been.called;

        await waitFor(() => {
          expect(screen.queryByText('Expected failure')).to.exist;
        });
      });
    });
  });
});
