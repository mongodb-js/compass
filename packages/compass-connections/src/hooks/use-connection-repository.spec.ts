import { useConnectionRepository } from './use-connection-repository';
import { expect } from 'chai';
import Sinon from 'sinon';
import { cleanup } from '@testing-library/react';
import {
  createDefaultConnectionInfo,
  renderHookWithConnections,
} from '@mongodb-js/testing-library-compass';

const favoriteMockConnections = [
  {
    ...createDefaultConnectionInfo(),
    id: '12',
    savedConnectionType: 'favorite',
    favorite: { name: 'Bb' },
  },
  {
    ...createDefaultConnectionInfo(),
    id: '11',
    savedConnectionType: 'favorite',
    favorite: { name: 'Aa' },
  },
];

const nonFavoriteMockConnections = [
  {
    ...createDefaultConnectionInfo(),
    id: '23',
    savedConnectionType: 'recent',
    favorite: { name: 'Cc' },
  },
  {
    ...createDefaultConnectionInfo(),
    id: '22',
    savedConnectionType: 'recent',
    favorite: { name: 'Bb' },
  },
  {
    ...createDefaultConnectionInfo(),
    id: '21',
    savedConnectionType: 'recent',
    favorite: { name: 'Aa' },
  },
];

describe('useConnectionRepository', function () {
  afterEach(() => {
    cleanup();
    Sinon.restore();
  });

  describe('favoriteConnections', function () {
    it('should return favourite connections sorted by name alphabetically', function () {
      const { result } = renderHookWithConnections(useConnectionRepository, {
        connections: favoriteMockConnections,
      });

      const connections = result.current.favoriteConnections;

      expect(connections.length).to.equal(2);
      expect(connections[0].id).to.equal('11');
      expect(connections[1].id).to.equal('12');
    });

    it('should not change if only non favourite connections change', async function () {
      const { result, connectionsStore } = renderHookWithConnections(
        useConnectionRepository,
        { connections: favoriteMockConnections }
      );

      const initialFavoriteConnections = result.current.favoriteConnections;
      expect(initialFavoriteConnections.length).to.equal(2);

      await Promise.all(
        nonFavoriteMockConnections.map((info) => {
          return connectionsStore.actions.saveEditedConnection(info);
        })
      );

      expect(result.current.favoriteConnections).to.eq(
        initialFavoriteConnections
      );
    });
  });

  describe('nonFavoriteConnections', function () {
    it('should return non favourite connections sorted by name alphabetically', function () {
      const { result } = renderHookWithConnections(useConnectionRepository, {
        connections: nonFavoriteMockConnections,
      });

      const connections = result.current.nonFavoriteConnections;

      expect(connections.length).to.equal(3);
      expect(connections[0].id).to.equal('21');
      expect(connections[1].id).to.equal('22');
      expect(connections[2].id).to.equal('23');
    });

    it('should not change if only favourite connections change', async function () {
      const { result, connectionsStore } = renderHookWithConnections(
        useConnectionRepository,
        { connections: nonFavoriteMockConnections }
      );

      const initialNonFavoriteConnections =
        result.current.nonFavoriteConnections;

      await Promise.all(
        favoriteMockConnections.map((info) => {
          return connectionsStore.actions.saveEditedConnection(info);
        })
      );

      expect(result.current.nonFavoriteConnections).to.equal(
        initialNonFavoriteConnections
      );
    });
  });

  describe('store.saveEditedConnection', function () {
    it('should save a new connection if it has a valid connection string', async function () {
      const connectionInfo = createDefaultConnectionInfo();
      const { result, connectionsStore, connectionStorage } =
        renderHookWithConnections(useConnectionRepository, {
          // We don't allow to save connections that are not in state with
          // actions, so put one in the store
          connections: [connectionInfo],
        });

      const saveSpy = Sinon.spy(connectionStorage, 'save');

      // Update connection string on existing connection
      const connectionToSave = {
        ...connectionInfo,
        connectionOptions: { connectionString: 'mongodb://example.com:1337' },
      };
      await connectionsStore.actions.saveEditedConnection(connectionToSave);

      expect(saveSpy).to.have.been.calledOnceWith({
        connectionInfo: connectionToSave,
      });

      expect(result.current.nonFavoriteConnections[0]).to.have.nested.property(
        'connectionOptions.connectionString',
        'mongodb://example.com:1337'
      );
    });

    it('should not save a new connection if it has an invalid connection string', async function () {
      const connectionInfo = createDefaultConnectionInfo();
      const { result, connectionsStore, connectionStorage } =
        renderHookWithConnections(useConnectionRepository, {
          // We don't allow to save connections that are not in state with
          // actions, so put one in the store
          connections: [connectionInfo],
        });

      const saveSpy = Sinon.spy(connectionStorage, 'save');

      // Update connection string on existing connection
      const connectionToSave = {
        ...connectionInfo,
        connectionOptions: { connectionString: 'foobar' },
      };
      await connectionsStore.actions.saveEditedConnection(connectionToSave);

      expect(saveSpy).not.to.have.been.called;

      expect(result.current.nonFavoriteConnections[0]).to.have.nested.property(
        'connectionOptions.connectionString',
        'mongodb://localhost:27017'
      );
    });
  });

  describe('store.removeConnection', function () {
    it('should delete a saved connection from the underlying storage', function () {
      const connectionInfo = createDefaultConnectionInfo();
      const { result, connectionsStore, connectionStorage } =
        renderHookWithConnections(useConnectionRepository, {
          // We don't allow to save connections that are not in state with
          // actions, so put one in the store
          connections: [connectionInfo],
        });

      const deleteSpy = Sinon.spy(connectionStorage, 'delete');

      expect(result.current.nonFavoriteConnections).to.have.lengthOf(1);

      connectionsStore.actions.removeConnection(connectionInfo.id);

      expect(deleteSpy).to.have.been.calledOnceWith({ id: connectionInfo.id });

      expect(result.current.nonFavoriteConnections).to.have.lengthOf(0);
    });
  });
});
