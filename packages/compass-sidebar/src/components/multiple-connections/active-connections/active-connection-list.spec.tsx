import React from 'react';
import { expect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ActiveConnectionList } from './active-connection-list';
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

describe('<ActiveConnectionList />', function () {
  let connectionRepository: ConnectionRepository;
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: typeof ConnectionStorage;

  beforeEach(() => {
    connectionsManager = new ConnectionsManager({} as any);
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
    mockConnectionStorage = {
      loadAll: Sinon.stub().resolves(mockConnections),
    } as any;
    connectionRepository = new ConnectionRepository(mockConnectionStorage);

    render(
      <ConnectionStorageContext.Provider value={mockConnectionStorage}>
        <ConnectionRepositoryContext.Provider value={connectionRepository}>
          <ConnectionsManagerProvider value={connectionsManager}>
            <ActiveConnectionList />
          </ConnectionsManagerProvider>
        </ConnectionRepositoryContext.Provider>
      </ConnectionStorageContext.Provider>
    );
  });

  it('Should render all active connections - using their correct titles', async function () {
    await waitFor(() => {
      expect(screen.queryByText('(2)')).to.be.visible;
      expect(screen.queryByText('turtle')).to.be.visible;
      expect(screen.queryByText('peaches')).to.be.visible;
    });
  });
});
