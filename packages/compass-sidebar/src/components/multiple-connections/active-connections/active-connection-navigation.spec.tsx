import React from 'react';
import { expect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import ActiveConnectionNavigation from './active-connection-navigation';
import {
  ConnectionRepositoryContext,
  ConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
} from '@mongodb-js/compass-connections/provider';
import { ConnectionRepository } from '@mongodb-js/connection-storage/main';
import type { ConnectionStorage } from '@mongodb-js/connection-storage/renderer';
import Sinon from 'sinon';
import { createInstance } from '../../../../test/helpers';
import AppRegistry from 'hadron-app-registry';
import { createSidebarStore } from '../../../stores';
import { Provider } from 'react-redux';

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
  let connectionRepository: ConnectionRepository;
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: typeof ConnectionStorage;
  const instance = createInstance();
  const globalAppRegistry = new AppRegistry();
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;

  beforeEach(() => {
    connectionsManager = new ConnectionsManager({} as any);
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
    mockConnectionStorage = {
      loadAll: Sinon.stub().resolves(mockConnections),
    } as any;
    connectionRepository = new ConnectionRepository(mockConnectionStorage);
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

    render(
      <ConnectionStorageContext.Provider value={mockConnectionStorage}>
        <ConnectionRepositoryContext.Provider value={connectionRepository}>
          <ConnectionsManagerProvider value={connectionsManager}>
            <Provider store={store}>
              <ActiveConnectionNavigation activeWorkspace={{ type: 'connection' }} />
            </Provider>
          </ConnectionsManagerProvider>
        </ConnectionRepositoryContext.Provider>
      </ConnectionStorageContext.Provider>
    );
  });

  beforeEach(() => {
    deactivate();
  });

  it('Should render the number of connections', async function () {
    await waitFor(() => {
      expect(screen.queryByText('(2)')).to.be.visible;
    });
  });
});
