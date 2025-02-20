import { useConnectionsWithStatus } from './use-connections-with-status';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { expect } from 'chai';
import Sinon from 'sinon';
import { renderHookWithConnections } from '@mongodb-js/testing-library-compass';

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

describe('useConnectionsWithStatus', function () {
  it('should return all connections with initial state', function () {
    const { result } = renderHookWithConnections(useConnectionsWithStatus, {
      connections: mockConnections,
    });
    expect(result.current).to.have.lengthOf(2);
    expect(result.current[0]).to.have.property('connectionStatus', 'initial');
    expect(result.current[1]).to.have.property('connectionStatus', 'initial');
  });

  it('should update the list when a connection switches it status', async function () {
    const connectFnStub = Sinon.stub()
      .onFirstCall()
      .callsFake(() => {
        return new Promise(() => {
          // do not resolve, we will cancel this one
        });
      })
      .onSecondCall()
      .rejects(new Error('Failed to connect'))
      .onThirdCall()
      .callsFake(() => {
        return {};
      });

    const { result, connectionsStore } = renderHookWithConnections(
      useConnectionsWithStatus,
      {
        connectFn: connectFnStub,
        connections: mockConnections,
      }
    );

    function getConnectionById(id) {
      return result.current.find((conn) => {
        return conn.connectionInfo.id === id;
      });
    }

    // Starts with initial
    expect(result.current[0]).to.have.property('connectionStatus', 'initial');

    // Now switching to connecting state
    const connectPromise = connectionsStore.actions.connect(mockConnections[0]);
    expect(getConnectionById(mockConnections[0].id)).to.have.property(
      'connectionStatus',
      'connecting'
    );

    // Now cancelling the connection
    connectionsStore.actions.disconnect(mockConnections[0].id);
    // Wait for connection process to fully resolve
    await connectPromise;
    expect(getConnectionById(mockConnections[0].id)).to.have.property(
      'connectionStatus',
      'disconnected'
    );

    // Now connecting again but to fail
    await connectionsStore.actions.connect(mockConnections[0]);
    expect(getConnectionById(mockConnections[0].id)).to.have.property(
      'connectionStatus',
      'failed'
    );

    // Now connecting again but to succeed
    await connectionsStore.actions.connect(mockConnections[0]);
    expect(getConnectionById(mockConnections[0].id)).to.have.property(
      'connectionStatus',
      'connected'
    );

    // Now close the connection
    connectionsStore.actions.disconnect(mockConnections[0].id);
    expect(getConnectionById(mockConnections[0].id)).to.have.property(
      'connectionStatus',
      'disconnected'
    );
  });
});
