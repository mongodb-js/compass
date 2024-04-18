import React from 'react';
import { expect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import ActiveConnectionNavigation from './active-connection-navigation';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  TEST_CONNECTION_INFO,
} from '@mongodb-js/compass-connections/provider';
import { createSidebarStore } from '../../../stores';
import { Provider } from 'react-redux';
import AppRegistry from 'hadron-app-registry';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

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
  const globalAppRegistry = new AppRegistry();

  beforeEach(() => {
    connectionsManager = new ConnectionsManager({} as any);
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        instancesManager: {
          listMongoDBInstances() {
            return new Map();
          },
        } as any,
        connectionsManager,
        logger: createNoopLoggerAndTelemetry(),
        initialConnectionInfo: TEST_CONNECTION_INFO,
      },
      { on() {}, cleanup() {}, addCleanup() {} } as any
    ));

    render(
      <ConnectionsManagerProvider value={connectionsManager}>
        <Provider store={store}>
          <ActiveConnectionNavigation
            activeConnections={mockConnections}
            activeWorkspace={{ type: 'connection' }}
          />
        </Provider>
      </ConnectionsManagerProvider>
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
