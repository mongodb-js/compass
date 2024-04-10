import React from 'react';
import { expect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import ActiveConnectionNavigation from './active-connection-navigation';
import {
  ConnectionStorageProvider,
} from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
} from '@mongodb-js/compass-connections/provider';
import Sinon from 'sinon';
import { createSidebarStore } from '../../../stores';
import { Provider } from 'react-redux';
import AppRegistry from 'hadron-app-registry';
import { createInstance } from '../../../../test/helpers';
import {
  NoopConnectionStorage,
  type ConnectionStorage,
} from '@mongodb-js/connection-storage/renderer';

const mockConnections: ConnectionInfo[] = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    savedConnectionType: 'recent',
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    favorite: {
      name: 'peaches',
    },
    savedConnectionType: 'favorite',
  },
];

describe('<ActiveConnectionNavigation />', function () {
  let connectionsManager: ConnectionsManager;
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;
  const instance = createInstance();
  const globalAppRegistry = new AppRegistry();
  let mockConnectionStorage: ConnectionStorage;

  beforeEach(() => {
    connectionsManager = new ConnectionsManager({} as any);
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
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
    mockConnectionStorage = new NoopConnectionStorage();
    mockConnectionStorage.loadAll = Sinon.stub().resolves(mockConnections);

    render(
      <ConnectionStorageProvider value={mockConnectionStorage}>
        <ConnectionsManagerProvider value={connectionsManager}>
          <Provider store={store}>
            <ActiveConnectionNavigation
              activeWorkspace={{ type: 'connection' }}
            />
          </Provider>
        </ConnectionsManagerProvider>
      </ConnectionStorageProvider>
    );
  });

  afterEach(() => {
    deactivate();
  });

  it('Should render the number of connections', async function () {
    await waitFor(() => {
      expect(screen.queryByText('(2)')).to.be.visible;
    });
  });
});
