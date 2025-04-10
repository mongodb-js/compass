import { expect } from 'chai';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import {
  buildConnectionInfoFromClusterDescription,
  AtlasCloudConnectionStorage,
} from './connection-storage';
import type { ClusterDescriptionWithDataProcessingRegion } from './connection-storage';

const deployment = {
  replicaSets: [
    {
      _id: 'replicaSet-xxx',
      state: {
        clusterId: '123abc',
      },
    },
  ],
  sharding: [
    {
      name: 'sharded-xxx',
      state: {
        clusterId: '123abc',
      },
    },
  ],
};

type Test = [string, ClusterDescriptionWithDataProcessingRegion, string];

describe('buildConnectionInfoFromClusterDescription', function () {
  const tests: Test[] = [
    [
      'replicaSet',
      {
        '@provider': 'AWS',
        uniqueId: '123abc',
        groupId: 'abc',
        name: 'Cluster0-replicaSet',
        clusterType: 'REPLICASET',
        srvAddress: 'replicaSet.mongodb.com',
        state: 'IDLE',
        deploymentItemName: 'replicaSet-xxx',
        dataProcessingRegion: {
          regionalUrl: 'https://example.com',
        },
        replicationSpecList: [
          {
            regionConfigs: [
              {
                priority: 1,
                electableSpecs: {
                  instanceSize: 'M0', // free tier
                },
              },
            ],
          },
        ],
      },
      'mongodb+srv://replicaSet.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&serverMonitoringMode=poll&maxIdleTimeMS=30000&minPoolSize=0&maxPoolSize=5',
    ],
    [
      'sharded',
      {
        '@provider': 'AWS',
        uniqueId: '123abc',
        groupId: 'abc',
        name: 'Cluster0-sharded',
        clusterType: 'SHARDED',
        srvAddress: 'sharded.mongodb.com',
        state: 'IDLE',
        deploymentItemName: 'sharded-xxx',
        dataProcessingRegion: {
          regionalUrl: 'https://example.com',
        },
        geoSharding: {
          selfManagedSharding: true,
        },
        replicationSpecList: [
          {
            regionConfigs: [
              {
                priority: 1,
                electableSpecs: {
                  instanceSize: 'M10', // dedicated
                },
              },
              {
                priority: 2,
                electableSpecs: {
                  instanceSize: 'M12', // dedicated
                },
              },
            ],
          },
        ],
      },
      'mongodb+srv://sharded.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&serverMonitoringMode=poll&maxIdleTimeMS=30000&minPoolSize=0&maxPoolSize=5&srvMaxHosts=1',
    ],
    [
      'serverless',
      {
        '@provider': 'SERVERLESS',
        uniqueId: '123abc',
        groupId: 'abc',
        name: 'Cluster0-serverless',
        clusterType: 'REPLICASET',
        srvAddress: 'serverless.mongodb.com',
        state: 'IDLE',
        deploymentItemName: 'serverless-xxx',
        dataProcessingRegion: {
          regionalUrl: 'https://example.com',
        },
        replicationSpecList: [
          {
            regionConfigs: [
              {
                priority: 1,
                electableSpecs: {
                  instanceSize: 'SERVERLESS_V2',
                },
              },
            ],
          },
        ],
      },
      'mongodb+srv://serverless.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&serverMonitoringMode=poll&maxIdleTimeMS=30000&minPoolSize=0&maxPoolSize=5',
    ],
    [
      'flex',
      {
        '@provider': 'FLEX',
        uniqueId: '123abc',
        groupId: 'abc',
        name: 'Cluster0-flex',
        clusterType: 'REPLICASET',
        srvAddress: 'flex.mongodb.com',
        state: 'IDLE',
        deploymentItemName: 'flex-xxx',
        dataProcessingRegion: {
          regionalUrl: 'https://example.com',
        },
        replicationSpecList: [
          {
            regionConfigs: [
              {
                priority: 1,
                electableSpecs: {
                  instanceSize: 'FLEX',
                },
              },
            ],
          },
        ],
      },
      'mongodb+srv://flex.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&serverMonitoringMode=poll&maxIdleTimeMS=30000&minPoolSize=0&maxPoolSize=5',
    ],
  ];

  for (const [type, clusterDescription, connectionString] of tests) {
    it(`should build connection info for ${type} cluster`, function () {
      const connectionInfo = buildConnectionInfoFromClusterDescription(
        'ws://test',
        '123',
        'abc',
        clusterDescription,
        deployment
      );

      expect(connectionInfo).to.have.property('id', clusterDescription.name);

      expect(connectionInfo).to.have.nested.property(
        'connectionOptions.connectionString',
        connectionString
      );

      expect(connectionInfo.connectionOptions.lookup?.()).to.deep.eq({
        wsURL: 'ws://test',
        projectId: 'abc',
        clusterName: `Cluster0-${type}`,
        srvAddress: `${type}.mongodb.com`,
      });

      // just assume the last regionConfig in our test data is the highest
      // priority one
      const expectedInstanceSize =
        clusterDescription.replicationSpecList?.[0].regionConfigs.slice().pop()
          ?.electableSpecs.instanceSize;

      // We test these separately in another test
      if (connectionInfo.atlasMetadata?.supports) {
        delete (connectionInfo.atlasMetadata as { supports?: any }).supports;
      }

      expect(connectionInfo)
        .to.have.property('atlasMetadata')
        .deep.eq({
          orgId: '123',
          projectId: 'abc',
          metricsId:
            type === 'serverless' || type === 'flex'
              ? `Cluster0-${type}`
              : '123abc',
          clusterName: `Cluster0-${type}`,
          clusterUniqueId: '123abc',
          metricsType: type === 'sharded' ? 'cluster' : type,
          instanceSize: expectedInstanceSize,
          regionalBaseUrl: null,
          clusterType: clusterDescription.clusterType,
          clusterState: 'IDLE',
        });
    });
  }

  it('should throw if deployment item is missing', function () {
    try {
      buildConnectionInfoFromClusterDescription(
        'ws://test',
        '123',
        'abc',
        {
          '@provider': 'mock',
          uniqueId: 'abc',
          groupId: 'abc',
          name: 'Cluster0',
          clusterType: 'REPLICASET',
          srvAddress: 'test',
          state: 'test',
          deploymentItemName: 'test',
          dataProcessingRegion: { regionalUrl: 'test' },
        },
        deployment
      );
      expect.fail('Expected method to throw');
    } catch (err) {
      expect(err).to.have.property(
        'message',
        "Can't build metrics info when deployment item is not found"
      );
    }
  });
});

describe('AtlasCloudConnectionStorage', function () {
  const testClusters: Record<
    string,
    Partial<ClusterDescriptionWithDataProcessingRegion>
  > = {
    Cluster0: {
      '@provider': 'AWS',
      groupId: 'abc',
      name: 'Cluster0',
      clusterType: 'REPLICASET',
      srvAddress: 'test',
      state: 'test',
      deploymentItemName: 'replicaSet-xxx',
      dataProcessingRegion: { regionalUrl: 'test' },
    },
    NoDeploymentItem: {
      '@provider': 'AWS',
      groupId: 'abc',
      name: 'NoDeploymentItem',
      clusterType: 'REPLICASET',
      srvAddress: 'test',
      state: 'test',
      deploymentItemName: 'not-found',
      dataProcessingRegion: { regionalUrl: 'test' },
    },
    NoSrvAddress: {
      '@provider': 'AWS',
      name: 'NoSrvAddress',
    },
    Paused: {
      '@provider': 'AWS',
      name: 'Paused',
      isPaused: true,
    },
    WillThrowOnFetch: {
      '@provider': 'AWS',
      name: 'WillThrowOnFetch',
    },
  };

  describe('#loadAll', function () {
    it('should load connection descriptions filtering out the ones that failed to fetch', async function () {
      const atlasService = {
        cloudEndpoint(path: string) {
          return path;
        },
        driverProxyEndpoint(path: string) {
          return path;
        },
        authenticatedFetch(path: string) {
          let payload: any;
          if (path === '/deployment/abc') {
            payload = deployment;
          }
          if (path === '/nds/clusters/abc') {
            payload = Array.from(Object.values(testClusters));
          }
          const { groups } =
            /^\/nds\/clusters\/abc\/(?<clusterName>.+?)\/.+?$/.exec(path) ?? {
              groups: undefined,
            };
          if (groups?.clusterName) {
            if (groups?.clusterName === 'WillThrowOnFetch') {
              return Promise.reject(
                new Error('Failed to fetch cluster description')
              );
            }
            payload = testClusters[groups.clusterName];
          }
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
      expect(connections[0]).to.have.property('id', 'Cluster0');
    });
  });
});
