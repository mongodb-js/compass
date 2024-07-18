import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  useConnectionsWithStatus,
} from '../provider';
import { renderHook } from '@testing-library/react-hooks';
import { createElement } from 'react';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
  type ConnectionInfo,
  type ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { expect } from 'chai';
import Sinon from 'sinon';
import { waitFor } from '@testing-library/dom';
import { ConnectionStatus } from '../connections-manager';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';

const mockConnections: ConnectionInfo[] = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    favorite: {
      name: 'turtles',
    },
    savedConnectionType: 'favorite',
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

function createConnectionsManager(connectFn?: any) {
  return new ConnectionsManager({
    logger: createNoopLogger().log.unbound,
    __TEST_CONNECT_FN: connectFn,
  });
}

describe('useConnectionsWithStatus', function () {
  let renderHookWithContext: typeof renderHook;
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: ConnectionStorage;

  beforeEach(function () {
    connectionsManager = createConnectionsManager();
    mockConnectionStorage = new InMemoryConnectionStorage(mockConnections);

    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(ConnectionStorageProvider, {
          value: mockConnectionStorage,
          children: [
            createElement(ConnectionsManagerProvider, {
              value: connectionsManager,
              children: children,
            }),
          ],
        });
      return renderHook(callback, { wrapper, ...options });
    };
  });

  it('should return all connections with disconnected state', async function () {
    const { result } = renderHookWithContext(() => useConnectionsWithStatus());
    await waitFor(() => expect(result.current).to.have.length(2));
    expect(result.current[0].connectionStatus).to.equal(
      ConnectionStatus.Disconnected
    );
    expect(result.current[1].connectionStatus).to.equal(
      ConnectionStatus.Disconnected
    );
  });

  it('should update the list when a connection switches it status', async function () {
    let connectBehaviour:
      | 'mimick-connecting'
      | 'mimick-failed'
      | 'mimick-connected' = 'mimick-connecting';
    const testConnectFn = Sinon.stub().callsFake(async () => {
      // mimicking the connecting state here
      if (connectBehaviour === 'mimick-connecting') {
        await new Promise((resolve) => {
          setTimeout(() => resolve({}), 1500);
        });
      } else if (connectBehaviour === 'mimick-failed') {
        return Promise.reject(new Error('DataService kaput'));
      } else if (connectBehaviour === 'mimick-connected') {
        return Promise.resolve({ disconnect() {} });
      }
    });
    connectionsManager = createConnectionsManager(testConnectFn);

    const { result } = renderHookWithContext(() => useConnectionsWithStatus());
    await waitFor(() => expect(result.current).to.have.length(2));
    // Starts with disconnected
    expect(result.current[0].connectionStatus).to.equal(
      ConnectionStatus.Disconnected
    );
    expect(result.current[1].connectionStatus).to.equal(
      ConnectionStatus.Disconnected
    );

    // Now switching to connecting state
    void connectionsManager.connect(mockConnections[0]).catch(() => {
      // ignore this silently
    });
    await waitFor(() => {
      const turtleConnection = result.current.find(({ connectionInfo }) => {
        return connectionInfo.id === 'turtle';
      });
      return expect(turtleConnection?.connectionStatus).to.equal(
        ConnectionStatus.Connecting
      );
    });

    // Now cancelling the connection
    void connectionsManager.cancelAllConnectionAttempts();
    await waitFor(() => {
      const turtleConnection = result.current.find(({ connectionInfo }) => {
        return connectionInfo.id === 'turtle';
      });
      return expect(turtleConnection?.connectionStatus).to.equal(
        ConnectionStatus.Disconnected
      );
    });

    // Now connecting again but to fail
    connectBehaviour = 'mimick-failed';
    void connectionsManager.connect(mockConnections[0]).catch(() => {
      // ignore this silently
    });
    await waitFor(() => {
      const turtleConnection = result.current.find(({ connectionInfo }) => {
        return connectionInfo.id === 'turtle';
      });
      return expect(turtleConnection?.connectionStatus).to.equal(
        ConnectionStatus.Failed
      );
    });

    // Now connecting again but to succeed
    connectBehaviour = 'mimick-connected';
    void connectionsManager.connect(mockConnections[0]).catch(() => {
      // ignore this silently
    });
    await waitFor(() => {
      const turtleConnection = result.current.find(({ connectionInfo }) => {
        return connectionInfo.id === 'turtle';
      });
      return expect(turtleConnection?.connectionStatus).to.equal(
        ConnectionStatus.Connected
      );
    });

    // Now close the connection
    void connectionsManager.closeConnection('turtle').catch(() => {
      // ignore this silently
    });
    await waitFor(() => {
      const turtleConnection = result.current.find(({ connectionInfo }) => {
        return connectionInfo.id === 'turtle';
      });
      return expect(turtleConnection?.connectionStatus).to.equal(
        ConnectionStatus.Disconnected
      );
    });
  });
});
