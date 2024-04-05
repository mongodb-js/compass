import {
  useActiveConnections,
  ConnectionsManager,
  ConnectionsManagerProvider,
} from '../provider';
import { renderHook } from '@testing-library/react-hooks';
import { createElement } from 'react';
import { ConnectionStorageContext } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionStorageEvents,
  type ConnectionInfo,
  type ConnectionStorage,
  ConnectionStorageBus,
} from '@mongodb-js/connection-storage/renderer';
import { expect } from 'chai';
import Sinon from 'sinon';
import { waitFor } from '@testing-library/dom';
import { ConnectionsManagerEvents } from '../connections-manager';

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
  let renderHookWithContext: typeof renderHook;
  let connectionsManager: ConnectionsManager;
  let mockConnectionStorage: typeof ConnectionStorage;

  beforeEach(function () {
    connectionsManager = new ConnectionsManager({} as any);
    mockConnectionStorage = {
      events: new ConnectionStorageBus(),
      loadAll: Sinon.stub().resolves([]),
    } as any;

    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(ConnectionStorageContext.Provider, {
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

  it('should return empty list of connections', function () {
    const { result } = renderHookWithContext(() => useActiveConnections());
    expect(result.current).to.have.length(0);
  });

  it('should return active connections', async function () {
    mockConnectionStorage = {
      events: new ConnectionStorageBus(),
      loadAll: Sinon.stub().resolves(mockConnections),
    } as any;
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    const { result } = renderHookWithContext(() => useActiveConnections());

    await waitFor(() => {
      expect(result.current).to.have.length(1);
      expect(result.current[0]).to.have.property('id', 'turtle');
    });
  });

  it('should listen to connections manager updates', async function () {
    mockConnectionStorage = {
      events: new ConnectionStorageBus(),
      loadAll: Sinon.stub().resolves(mockConnections),
    } as any;
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    const { result } = renderHookWithContext(() => useActiveConnections());

    await waitFor(() => {
      expect(result.current).to.have.length(1);
    });

    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
    connectionsManager.emit(
      ConnectionsManagerEvents.ConnectionAttemptSuccessful,
      'orange',
      {} as any
    );

    await waitFor(() => {
      expect(result.current).to.have.length(2);
    });
  });

  it('should listen to connections storage updates', async function () {
    const loadAllStub = Sinon.stub().resolves(mockConnections);
    mockConnectionStorage = {
      loadAll: loadAllStub,
      events: new ConnectionStorageBus(),
    } as any;
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    const { result } = renderHookWithContext(() => useActiveConnections());

    loadAllStub.resolves([
      {
        ...mockConnections[0],
        savedConnectionType: 'recent',
      },
      mockConnections[1],
    ]);
    mockConnectionStorage.events.emit(
      ConnectionStorageEvents.ConnectionsChanged
    );

    await waitFor(() => {
      expect(result.current).to.have.length(1);
      expect(result.current[0]).to.have.property(
        'savedConnectionType',
        'recent'
      );
    });
  });
});
