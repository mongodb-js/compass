import { useConnectionRepository } from './use-connection-repository';
import { expect } from 'chai';
import { spy, restore } from 'sinon';
import {
  type ConnectionStorage,
  InMemoryConnectionStorage,
  ConnectionStorageProvider,
} from '@mongodb-js/connection-storage/provider';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { serializeConnections } from '../../../connection-storage/dist/import-export-connection';

describe('useConnectionRepository', function () {
  let renderHookWithContext: typeof renderHook;
  let mockStorage: ConnectionStorage;

  beforeEach(function () {
    mockStorage = new InMemoryConnectionStorage([]);
    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(ConnectionStorageProvider, {
          value: mockStorage,
          children,
        });
      return renderHook(callback, { wrapper, ...options });
    };
  });

  afterEach(function () {
    restore();
  });

  describe('favoriteConnections', function () {
    it('should return favourite connections sorted by name alphabetically', async function () {
      mockStorage = new InMemoryConnectionStorage([
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

    it('should not change if only non favourite connections change', async function () {
      mockStorage = new InMemoryConnectionStorage([
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

      const initialFavoriteConnections = await waitFor(() => {
        const favoriteConnections = result.current.favoriteConnections;
        expect(favoriteConnections.length).to.equal(2);
        return favoriteConnections;
      });

      await mockStorage.importConnections?.({
        content: await serializeConnections([
          {
            id: '3',
            savedConnectionType: 'recent',
            favorite: { name: 'Cc' },
          },
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
        ]),
      });

      await waitFor(() => {
        const favoriteConnections = result.current.favoriteConnections;
        const nonFavoriteConnections = result.current.nonFavoriteConnections;

        expect(favoriteConnections).to.equal(initialFavoriteConnections);
        expect(nonFavoriteConnections.length).to.equal(1);
        expect(nonFavoriteConnections[0].id).to.equal('3');
      });
    });
  });

  describe('nonFavoriteConnections', function () {
    it('should return non favourite connections sorted by name alphabetically', async function () {
      mockStorage = new InMemoryConnectionStorage([
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

    it('should not change if only favourite connections change', async function () {
      mockStorage = new InMemoryConnectionStorage([
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

      const initialNonFavoriteConnections = await waitFor(() => {
        const nonFavoriteConnections = result.current.nonFavoriteConnections;
        expect(nonFavoriteConnections.length).to.equal(2);
        return nonFavoriteConnections;
      });

      await mockStorage.importConnections?.({
        content: await serializeConnections([
          {
            id: '3',
            savedConnectionType: 'favorite',
            favorite: { name: 'Cc' },
          },
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
        ]),
      });

      await waitFor(() => {
        const favoriteConnections = result.current.favoriteConnections;
        const nonFavoriteConnections = result.current.nonFavoriteConnections;

        expect(nonFavoriteConnections).to.equal(initialNonFavoriteConnections);
        expect(favoriteConnections.length).to.equal(1);
        expect(favoriteConnections[0].id).to.equal('3');
      });
    });
  });

  describe('#saveConnection', function () {
    it('should save a new connection if it has a valid connection string', async function () {
      mockStorage = new InMemoryConnectionStorage([]);
      const saveSpy = spy(mockStorage, 'save');
      const { result } = renderHookWithContext(() => useConnectionRepository());

      const connectionToSave = {
        id: '1',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
      };

      await result.current.saveConnection(connectionToSave);

      expect(saveSpy).to.have.been.calledOnceWith({
        connectionInfo: connectionToSave,
      });
    });

    it('should merge the connection info is one was already saved with the same id', async function () {
      mockStorage = new InMemoryConnectionStorage([
        { id: '1', savedConnectionType: 'favorite' },
      ]);
      const saveSpy = spy(mockStorage, 'save');

      const { result } = renderHookWithContext(() => useConnectionRepository());
      const connectionToSave = {
        id: '1',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
      };

      await result.current.saveConnection(connectionToSave);

      expect(saveSpy).to.have.been.calledOnceWith({
        connectionInfo: {
          id: '1',
          savedConnectionType: 'favorite',
          connectionOptions: { connectionString: 'mongodb://localhost:27017' },
        },
      });
    });

    it('should merge oidc connection info if exists', async function () {
      mockStorage = new InMemoryConnectionStorage([
        {
          id: '1',
          savedConnectionType: 'favorite',
          connectionOptions: {
            connectionString:
              'mongodb://127.0.0.1:34455/?authMechanism=MONGODB-OIDC',
          },
        },
      ]);
      const saveSpy = spy(mockStorage, 'save');

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

      expect(saveSpy).to.have.been.calledOnceWith({
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
      mockStorage = new InMemoryConnectionStorage([]);
      const saveSpy = spy(mockStorage, 'save');
      const { result } = renderHookWithContext(() => useConnectionRepository());

      try {
        await result.current.saveConnection({
          id: '1',
          connectionOptions: { connectionString: 'mongo://table.row:8080' },
        });

        expect.fail('Expected saveConnection to throw an exception.');
        expect(saveSpy).to.not.have.been.calledOnce;
      } catch (ex) {
        expect(ex).to.have.property(
          'message',
          'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
        );
      }
    });
  });

  describe('#deleteConnection', function () {
    it('should delete a saved connection from the underlying storage', async function () {
      mockStorage = new InMemoryConnectionStorage([]);
      const deleteSpy = spy(mockStorage, 'delete');
      const { result } = renderHookWithContext(() => useConnectionRepository());
      const connectionToDelete = {
        id: '1',
        connectionOptions: { connectionString: '' },
      };

      await result.current.deleteConnection(connectionToDelete);

      expect(deleteSpy).to.have.been.calledOnceWith(connectionToDelete);
    });
  });
});
