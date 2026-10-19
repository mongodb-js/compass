import { expect } from 'chai';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { AtlasCloudConnectionStorage } from './connection-storage';

describe('AtlasCloudConnectionStorage', function () {
  describe('#loadAll', function () {
    it('should load connection descriptions filtering out the ones that are in the unsupported state', async function () {
      const atlasService = {
        cloudEndpoint(path: string) {
          return path;
        },
        driverProxyEndpoint(path: string) {
          return path;
        },
        authenticatedFetch(path: string) {
          if (!path.endsWith('/clusters/connectionInfo')) {
            throw new Error('Unsupported URL');
          }
          const payload = [
            {
              id: 'foo',
              connectionOptions: {},
              atlasMetadata: { clusterName: 'Cluster0', clusterState: 'IDLE' },
            },
            // No metadata, will filter this out
            {
              id: 'bar',
              connectionOptions: {},
            },
            // Cluster state not supported
            {
              id: 'buz',
              connectionOptions: {},
              atlasMetadata: {
                clusterName: 'Cluster2',
                clusterState: 'WEIRD_ONE',
              },
            },
          ];
          return Promise.resolve({
            json() {
              return payload;
            },
          });
        },
      };
      const logger = createNoopLogger();
      const connectionStorage = new AtlasCloudConnectionStorage(
        atlasService as any,
        '123',
        'abc',
        logger
      );

      const connectionsPromise = connectionStorage.loadAll();

      expect(connectionsPromise).to.eq(
        connectionStorage.loadAll(),
        'Expected loadAll to return the same instance of the loading promise while connections are loading'
      );

      const connections = await connectionsPromise;

      // We expect all other clusters to be filtered out for one reason or
      // another
      expect(connections).to.have.lengthOf(1);
      expect(connections[0]).to.have.nested.property(
        'atlasMetadata.clusterName',
        'Cluster0'
      );
    });
  });

  describe('#save', function () {
    function createStorage(connectionString: { current: string }) {
      const atlasService = {
        cloudEndpoint(path: string) {
          return path;
        },
        authenticatedFetch() {
          return Promise.resolve({
            json() {
              return [
                {
                  id: 'foo',
                  connectionOptions: {
                    connectionString: connectionString.current,
                  },
                  atlasMetadata: {
                    clusterName: 'Cluster0',
                    clusterState: 'IDLE',
                  },
                },
              ];
            },
          });
        },
      };
      return new AtlasCloudConnectionStorage(
        atlasService as any,
        '123',
        'abc',
        createNoopLogger()
      );
    }

    async function loadConnectionString(
      storage: AtlasCloudConnectionStorage
    ): Promise<string | undefined> {
      return (await storage.load({ id: 'foo' }))?.connectionOptions
        .connectionString;
    }

    it('keeps the edited read preference when connections are reloaded', async function () {
      const connectionString = {
        current:
          'mongodb+srv://cluster0.mongodb.net/?tls=true&readPreference=secondaryPreferred',
      };
      const storage = createStorage(connectionString);

      await storage.save({
        connectionInfo: {
          id: 'foo',
          connectionOptions: {
            connectionString:
              'mongodb+srv://cluster0.mongodb.net/?tls=true&readPreference=secondary&readPreferenceTags=nodeType:ANALYTICS&readPreferenceTags=&maxStalenessSeconds=120',
          },
        },
      });

      // Changes Atlas makes to other options still come through
      connectionString.current =
        'mongodb+srv://cluster0.mongodb.net/?tls=true&appName=Cluster0&readPreference=secondaryPreferred';

      expect(await loadConnectionString(storage)).to.equal(
        'mongodb+srv://cluster0.mongodb.net/?tls=true&appName=Cluster0&readPreference=secondary&readPreferenceTags=nodeType%3AANALYTICS&readPreferenceTags=&maxStalenessSeconds=120'
      );
    });

    it('removes the Atlas read preference when the edit clears it', async function () {
      const storage = createStorage({
        current:
          'mongodb+srv://cluster0.mongodb.net/?tls=true&readPreference=secondaryPreferred',
      });

      await storage.save({
        connectionInfo: {
          id: 'foo',
          connectionOptions: {
            connectionString: 'mongodb+srv://cluster0.mongodb.net/?tls=true',
          },
        },
      });

      expect(await loadConnectionString(storage)).to.equal(
        'mongodb+srv://cluster0.mongodb.net/?tls=true'
      );
    });

    it('leaves connections that were not edited untouched', async function () {
      const connectionString =
        'mongodb+srv://cluster0.mongodb.net/?tls=true&readPreference=secondaryPreferred';
      const storage = createStorage({ current: connectionString });

      expect(await loadConnectionString(storage)).to.equal(connectionString);
    });
  });
});
