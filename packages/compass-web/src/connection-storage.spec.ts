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
});
