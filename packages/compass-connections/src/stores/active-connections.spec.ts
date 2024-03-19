import { ConnectionRepository } from '@mongodb-js/connection-storage/main';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  useActiveConnections,
} from '../../provider';
import { renderHook } from '@testing-library/react-hooks';
import { createElement } from 'react';
import { ConnectionRepositoryContext } from '@mongodb-js/connection-storage/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
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
  let connectionRepository: ConnectionRepository;
  let connectionsManager: ConnectionsManager;

  before(function () {
    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(ConnectionRepositoryContext.Provider, {
          value: connectionRepository,
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

  beforeEach(function () {
    connectionsManager = new ConnectionsManager({} as any);
    const storage = { loadAll: Sinon.stub().resolves([]) };
    connectionRepository = new ConnectionRepository(storage as any);
  });

  it('should return empty list of connections', function () {
    const { result } = renderHookWithContext(() => useActiveConnections());
    expect(result.current).to.have.length(0);
  });

  it('should return active connections', async function () {
    const storage = { loadAll: Sinon.stub().resolves(mockConnections) };
    connectionRepository = new ConnectionRepository(storage as any);
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    const { result } = renderHookWithContext(() => useActiveConnections());

    await waitFor(() => {
      expect(result.current).to.have.length(1);
      expect(result.current[0]).to.have.property('id', 'turtle');
    });
  });

  it('should listen to connections manager updates', async function () {
    const storage = { loadAll: Sinon.stub().resolves(mockConnections) };
    connectionRepository = new ConnectionRepository(storage as any);
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    const { result } = renderHookWithContext(() => useActiveConnections());

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
});
