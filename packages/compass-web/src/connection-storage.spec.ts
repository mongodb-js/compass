import { expect } from 'chai';
import { buildConnectionInfoFromClusterDescription } from './connection-storage';

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

describe('buildConnectionInfoFromClusterDescription', function () {
  const tests = [
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
      },
      'mongodb+srv://serverless.mongodb.com/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&maxPoolSize=3',
    ],
  ] as const;

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

      expect(connectionInfo)
        .to.have.property('atlasMetadata')
        .deep.eq({
          orgId: '123',
          projectId: 'abc',
          clusterId: type === 'serverless' ? `Cluster0-serverless` : '123abc',
          clusterName: `Cluster0-${type}`,
          clusterType: type === 'sharded' ? 'cluster' : type,
          regionalBaseUrl: 'https://example.com',
        });
    });
  }
});
