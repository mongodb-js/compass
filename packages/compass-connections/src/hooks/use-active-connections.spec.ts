import { useActiveConnections } from './use-active-connections';
import { cleanup, renderHookWithConnections } from '../test';
import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';

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

describe('useActiveConnections', function () {
  afterEach(cleanup);

  it('should return empty list of connections', function () {
    const { result } = renderHookWithConnections(useActiveConnections, {
      connections: mockConnections,
    });
    expect(result.current).to.have.length(0);
  });

  it('should return active connections', async function () {
    const { result, connectionsStore } = renderHookWithConnections(
      useActiveConnections,
      { connections: mockConnections }
    );

    await connectionsStore.actions.connect(mockConnections[0]);

    expect(result.current).to.have.length(1);
    expect(result.current[0]).to.have.property('id', 'turtle');
  });

  it('should listen to connections status updates', async function () {
    const { result, connectionsStore } = renderHookWithConnections(
      useActiveConnections,
      { connections: mockConnections }
    );

    await connectionsStore.actions.connect(mockConnections[0]);

    expect(result.current).to.have.length(1);

    await connectionsStore.actions.connect(mockConnections[1]);

    expect(result.current).to.have.length(2);
  });

  it('should listen to connections state updates', async function () {
    const { result, connectionsStore } = renderHookWithConnections(
      useActiveConnections,
      { connections: mockConnections }
    );

    await connectionsStore.actions.connect(mockConnections[0]);

    expect(result.current[0]).to.have.property(
      'savedConnectionType',
      'favorite'
    );

    connectionsStore.actions.toggleFavoritedConnectionStatus(
      mockConnections[0].id
    );

    expect(result.current[0]).to.have.property('savedConnectionType', 'recent');
  });
});
