import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { CompassConnectionProvider } from './connection-provider';
import chai, { expect } from 'chai';
import Sinon from 'sinon';
import type { ConnectionStorage } from './connection-storage';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

type StorageContext = {
  storage: typeof ConnectionStorage;
  saveStub: Sinon.SinonStub;
  deleteStub: Sinon.SinonStub;
};

function mockStorageWithConnections(
  connections: Partial<ConnectionInfo>[]
): StorageContext {
  const saveStub = Sinon.stub();
  const deleteStub = Sinon.stub();

  return {
    storage: {
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
    } as any,
    saveStub,
    deleteStub,
  };
}

function mockStorage(): StorageContext {
  return mockStorageWithConnections([]);
}

describe('CompassConnectionProvider', function () {
  describe('#listConnections', function () {
    it('should return only favourite connections as disconnected', async function () {
      const provider = new CompassConnectionProvider(
        mockStorageWithConnections([
          {
            id: '1',
            savedConnectionType: 'recent',
            favorite: { name: 'not webscale' },
          },
          {
            id: '2',
            savedConnectionType: 'favorite',
            favorite: { name: 'webscale' },
          },
        ]).storage
      );

      const connections = await provider.listConnections();
      expect(connections.length).to.equal(1);
      expect(connections[0].id).to.equal('2');
    });

    it('should return favourite connections sorted by name alphabetically', async function () {
      const provider = new CompassConnectionProvider(
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
        ]).storage
      );

      const connections = await provider.listConnections();
      expect(connections.length).to.equal(2);
      expect(connections[0].id).to.equal('1');
      expect(connections[1].id).to.equal('2');
    });
  });

  describe('#listConnectionHistory', function () {
    it('should return non favourite connections as disconnected', async function () {
      const provider = new CompassConnectionProvider(
        mockStorageWithConnections([
          {
            id: '1',
            savedConnectionType: 'recent',
            favorite: { name: 'not webscale' },
          },
          {
            id: '2',
            savedConnectionType: 'favorite',
            favorite: { name: 'webscale' },
          },
        ]).storage
      );

      const connections = await provider.listConnectionHistory();
      expect(connections.length).to.equal(1);
      expect(connections[0].id).to.equal('1');
      expect(connections[0].favorite?.name).to.equal('not webscale');
    });

    it('should return non favourite connections sorted by name alphabetically', async function () {
      const provider = new CompassConnectionProvider(
        mockStorageWithConnections([
          { id: '2', savedConnectionType: 'recent', favorite: { name: 'Bb' } },
          { id: '1', savedConnectionType: 'recent', favorite: { name: 'Aa' } },
        ]).storage
      );

      const connections = await provider.listConnectionHistory();
      expect(connections.length).to.equal(2);
      expect(connections[0].id).to.equal('1');
      expect(connections[1].id).to.equal('2');
    });
  });

  describe('#saveConnection', function () {
    it('should save a new connection if it has a valid connection string', async function () {
      const { storage, saveStub } = mockStorage();
      const provider = new CompassConnectionProvider(storage);
      const connectionToSave = {
        id: '1',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
      };

      await provider.saveConnection(connectionToSave);

      expect(saveStub).to.have.been.calledOnceWith({
        connectionInfo: connectionToSave,
      });
    });

    it('should merge the connection info is one was already saved with the same id', async function () {
      const { storage, saveStub } = mockStorageWithConnections([
        { id: '1', savedConnectionType: 'favorite' },
      ]);

      const provider = new CompassConnectionProvider(storage);
      const connectionToSave = {
        id: '1',
        connectionOptions: { connectionString: 'mongodb://localhost:27017' },
      };

      await provider.saveConnection(connectionToSave);

      expect(saveStub).to.have.been.calledOnceWith({
        connectionInfo: {
          id: '1',
          savedConnectionType: 'favorite',
          connectionOptions: { connectionString: 'mongodb://localhost:27017' },
        },
      });
    });

    it('should not save a new connection if it has an invalid connection string', async function () {
      const { storage, saveStub } = mockStorage();
      const provider = new CompassConnectionProvider(storage);

      await expect(
        provider.saveConnection({
          id: '1',
          connectionOptions: { connectionString: 'mongo://table.row:8080' },
        })
      ).to.be.rejected;

      expect(saveStub).to.not.have.been.calledOnce;
    });
  });

  describe('#deleteConnection', function () {
    it('should delete a saved connection from the underlying storage', async function () {
      const { storage, deleteStub } = mockStorage();
      const provider = new CompassConnectionProvider(storage);
      const connectionToDelete = {
        id: '1',
        connectionOptions: { connectionString: '' },
      };

      await provider.deleteConnection(connectionToDelete);

      expect(deleteStub).to.have.been.calledOnceWith(connectionToDelete);
    });
  });
});
