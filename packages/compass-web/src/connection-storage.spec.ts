import { expect } from 'chai';
import { buildConnectionInfoFromClusterDescription } from './connection-storage';
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
      'mongodb+srv://replicaSet.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&maxPoolSize=3',
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
      'mongodb+srv://sharded.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&maxPoolSize=3&srvMaxHosts=3',
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
      'mongodb+srv://serverless.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&maxPoolSize=3',
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

      expect(connectionInfo.connectionOptions.lookup()).to.deep.eq({
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

      expect(connectionInfo)
        .to.have.property('atlasMetadata')
        .deep.eq({
          orgId: '123',
          projectId: 'abc',
          metricsId: type === 'serverless' ? `Cluster0-serverless` : '123abc',
          clusterName: `Cluster0-${type}`,
          metricsType: type === 'sharded' ? 'cluster' : type,
          instanceSize: expectedInstanceSize,
          regionalBaseUrl: 'https://example.com',
        });
    });
  }
});
