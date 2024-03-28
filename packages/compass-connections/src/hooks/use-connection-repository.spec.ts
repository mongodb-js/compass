import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useConnectionRepository } from './use-connection-repository';
import chai, { expect } from 'chai';
import { stub } from 'sinon';
import {
  type ConnectionStorage,
  ConnectionStorageBus,
} from '@mongodb-js/connection-storage/renderer';
import { ConnectionStorageContext } from '@mongodb-js/connection-storage/provider';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { createElement } from 'react';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('useConnectionRepository', function () {
  let renderHookWithContext: typeof renderHook;
  let mockStorage: typeof ConnectionStorage;
  let saveStub: ReturnType<typeof stub>;
  let deleteStub: ReturnType<typeof stub>;

  function mockStorageWithConnections(
    connections: Partial<ConnectionInfo>[]
  ): typeof ConnectionStorage {
    saveStub = stub();
    deleteStub = stub();

    mockStorage = {
      events: new ConnectionStorageBus(),
      loadAll(): Promise<ConnectionInfo[]> {
        return Promise.resolve(connections as ConnectionInfo[]);
      },
      async load({ id }: { id: string }): Promise<ConnectionInfo> {
        return Promise.resolve(
          connections.find((c) => c.id === id) as ConnectionInfo
        );
      },
      save: saveStub,
      delete: deleteStub,
    } as any;
  }

  beforeEach(function () {
    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(ConnectionStorageContext.Provider, {
          value: mockStorage,
          children,
        });
      return renderHook(callback, { wrapper, ...options });
    };
  });

  describe('favoriteConnections', function () {
    it('should return favourite connections sorted by name alphabetically', async function () {
      mockStorageWithConnections([
        {
          id: '2',
          savedConnectionType: 'favorite',
          favorite: { name: 'Bb' },
        },
        {
          id: '1',
          savedConnectionType: 'favorite',
          favorite: { name: 'Aa' },
        },
      ]);

      const { result } = renderHookWithContext(() => useConnectionRepository());
      await waitFor(() => {
        const connections = result.current.favoriteConnections;
        expect(connections.length).to.equal(2);
        expect(connections[0].id).to.equal('1');
        expect(connections[1].id).to.equal('2');
      });
    });
  });

  describe('nonFavoriteConnections', function () {
    it('should return non favourite connections sorted by name alphabetically', async function () {
      mockStorageWithConnections([
        {
          id: '2',
          savedConnectionType: 'recent',
          favorite: { name: 'Bb' },
        },
        {
          id: '1',
          savedConnectionType: 'recent',
          favorite: { name: 'Aa' },
        },
      ]);

      const { result } = renderHookWithContext(() => useConnectionRepository());
      await waitFor(() => {
        const connections = result.current.nonFavoriteConnections;
        expect(connections.length).to.equal(2);
        expect(connections[0].id).to.equal('1');
        expect(connections[1].id).to.equal('2');
      });
    });
  });

  describe('#saveConnection', function () {
    it('should save a new connection if it has a valid connection string', async function () {
      mockStorageWithConnections([]);
      const { result } = renderHookWithContext(() => useConnectionRepository());

      const connectionToSave = {
        id: '1',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
      };

      await result.current.saveConnection(connectionToSave);

      expect(saveStub).to.have.been.calledOnceWith({
        connectionInfo: connectionToSave,
      });
    });

    it('should merge the connection info is one was already saved with the same id', async function () {
      mockStorageWithConnections([
        { id: '1', savedConnectionType: 'favorite' },
      ]);

      const { result } = renderHookWithContext(() => useConnectionRepository());
      const connectionToSave = {
        id: '1',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
      };

      await result.current.saveConnection(connectionToSave);

      expect(saveStub).to.have.been.calledOnceWith({
        connectionInfo: {
          id: '1',
          savedConnectionType: 'favorite',
          connectionOptions: { connectionString: 'mongodb://localhost:27017' },
        },
      });
    });

    it('should merge oidc connection info if exists', async function () {
      mockStorageWithConnections([
        {
          id: '1',
          savedConnectionType: 'favorite',
          connectionOptions: {
            connectionString:
              'mongodb://127.0.0.1:34455/?authMechanism=MONGODB-OIDC',
          },
        },
      ]);

      const { result } = renderHookWithContext(() => useConnectionRepository());
      const connectionToSave = {
        id: '1',
        connectionOptions: {
          connectionString:
            'mongodb://127.0.0.1:34455/?authMechanism=MONGODB-OIDC',
          oidc: { serializedState: 'someNewState' },
        },
      };

      await result.current.saveConnection(connectionToSave);

      expect(saveStub).to.have.been.calledOnceWith({
        connectionInfo: {
          id: '1',
          savedConnectionType: 'favorite',
          connectionOptions: {
            connectionString:
              'mongodb://127.0.0.1:34455/?authMechanism=MONGODB-OIDC',
            oidc: { serializedState: 'someNewState' },
          },
        },
      });
    });

    it('should not save a new connection if it has an invalid connection string', async function () {
      mockStorageWithConnections([]);
      const { result } = renderHookWithContext(() => useConnectionRepository());

      await expect(
        result.current.saveConnection({
          id: '1',
          connectionOptions: { connectionString: 'mongo://table.row:8080' },
        })
      ).to.be.rejected;

      expect(saveStub).to.not.have.been.calledOnce;
    });
  });

  describe('#deleteConnection', function () {
    it('should delete a saved connection from the underlying storage', async function () {
      mockStorageWithConnections([]);
      const { result } = renderHookWithContext(() => useConnectionRepository());
      const connectionToDelete = {
        id: '1',
        connectionOptions: { connectionString: '' },
      };

      await result.current.deleteConnection(connectionToDelete);

      expect(deleteStub).to.have.been.calledOnceWith(connectionToDelete);
    });
  });
});
