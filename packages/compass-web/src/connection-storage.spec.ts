import { expect } from 'chai';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { AtlasCloudConnectionStorage } from './connection-storage';

function getAtlasServiceMock(connections: ConnectionInfo[] = []) {
  return {
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
        {
          id: 'foo2',
          connectionOptions: {
            connectionString: 'mongodb://user:password@localhost:12345/',
          },
          atlasMetadata: { clusterName: 'Cluster1', clusterState: 'IDLE' },
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
          return connections.length > 0 ? connections : payload;
        },
      });
    },
  } as any;
}

describe('AtlasCloudConnectionStorage', function () {
  describe('#loadAll', function () {
    it('should load connection descriptions filtering out the ones that are in the unsupported state', async function () {
      const connectionStorage = new AtlasCloudConnectionStorage({
        atlasService: getAtlasServiceMock(),
        enableCompression: true,
        projectId: '123',
        logger: createNoopLogger(),
      });

      const connectionsPromise = connectionStorage.loadAll();

      expect(connectionsPromise).to.eq(
        connectionStorage.loadAll(),
        'Expected loadAll to return the same instance of the loading promise while connections are loading'
      );

      const connections = await connectionsPromise;

      // We expect all other clusters to be filtered out for one reason or
      // another
      expect(connections).to.have.lengthOf(2);
      expect(connections[0]).to.have.nested.property(
        'atlasMetadata.clusterName',
        'Cluster0'
      );
      expect(connections[1]).to.have.nested.property(
        'atlasMetadata.clusterName',
        'Cluster1'
      );
    });
    it('appends zlib compressor to the connection string if compression is enabled', async function () {
      const connectionStorage = new AtlasCloudConnectionStorage({
        atlasService: getAtlasServiceMock([
          {
            id: 'foo',
            connectionOptions: {
              connectionString: 'mongodb://user:password@localhost:12345/',
            },
            atlasMetadata: {
              clusterName: 'Cluster0',
              clusterState: 'IDLE',
            } as any,
          },
        ]),
        enableCompression: true,
        projectId: '123',
        logger: createNoopLogger(),
      });
      const connections = await connectionStorage.loadAll();
      expect(connections[0].connectionOptions.connectionString).to.equal(
        'mongodb://user:password@localhost:12345/?compressors=zlib'
      );
    });
    it('ensures there is no compressor in the connection string if compression is disabled', async function () {
      const connectionStorage = new AtlasCloudConnectionStorage({
        atlasService: getAtlasServiceMock([
          {
            id: 'foo',
            connectionOptions: {
              connectionString:
                'mongodb://user:password@localhost:12345/?compressors=snappy',
            },
            atlasMetadata: {
              clusterName: 'Cluster0',
              clusterState: 'IDLE',
            } as any,
          },
        ]),
        enableCompression: false,
        projectId: '123',
        logger: createNoopLogger(),
      });
      const connections = await connectionStorage.loadAll();
      expect(connections[0].connectionOptions.connectionString).to.deep.equal(
        'mongodb://user:password@localhost:12345/'
      );
    });
  });
});
