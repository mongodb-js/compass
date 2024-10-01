import { connectionSupports } from './connection-supports';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { expect } from 'chai';

const mockConnections: ConnectionInfo[] = [
  {
    id: 'no-atlasMetadata',
    connectionOptions: {
      connectionString: 'mongodb://foo',
    },
  },
  {
    id: 'host-cluster',
    connectionOptions: {
      connectionString: 'mongodb://foo',
    },
    atlasMetadata: {
      orgId: 'orgId',
      projectId: 'projectId',
      clusterName: 'clusterName',
      regionalBaseUrl: 'https://example.com',
      metricsId: 'metricsId',
      metricsType: 'host',
      instanceSize: 'M10',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
    },
  },
  {
    id: 'free-cluster',
    connectionOptions: {
      connectionString: 'mongodb://foo',
    },
    atlasMetadata: {
      orgId: 'orgId',
      projectId: 'projectId',
      clusterName: 'clusterName',
      regionalBaseUrl: 'https://example.com',
      metricsId: 'metricsId',
      metricsType: 'replicaSet',
      instanceSize: 'M0',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
    },
  },
  {
    id: 'serverless-cluster',
    connectionOptions: {
      connectionString: 'mongodb://foo',
    },
    atlasMetadata: {
      orgId: 'orgId',
      projectId: 'projectId',
      clusterName: 'clusterName',
      regionalBaseUrl: 'https://example.com',
      metricsId: 'metricsId',
      metricsType: 'serverless',
      instanceSize: 'SERVERLESS_V2',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
    },
  },
  {
    id: 'dedicated-replicaSet',
    connectionOptions: {
      connectionString: 'mongodb://foo',
    },
    atlasMetadata: {
      orgId: 'orgId',
      projectId: 'projectId',
      clusterName: 'clusterName',
      regionalBaseUrl: 'https://example.com',
      metricsId: 'metricsId',
      metricsType: 'replicaSet',
      instanceSize: 'M10',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
    },
  },
  {
    id: 'dedicated-sharded',
    connectionOptions: {
      connectionString: 'mongodb://foo',
    },
    atlasMetadata: {
      orgId: 'orgId',
      projectId: 'projectId',
      clusterName: 'clusterName',
      regionalBaseUrl: 'https://example.com',
      metricsId: 'metricsId',
      metricsType: 'cluster',
      instanceSize: 'M10',
      clusterType: 'SHARDED',
      clusterUniqueId: 'clusterUniqueId',
    },
  },
  {
    id: 'dedicated-geo-sharded',
    connectionOptions: {
      connectionString: 'mongodb://foo',
    },
    atlasMetadata: {
      orgId: 'orgId',
      projectId: 'projectId',
      clusterName: 'clusterName',
      regionalBaseUrl: 'https://example.com',
      metricsId: 'metricsId',
      metricsType: 'cluster',
      instanceSize: 'M30',
      clusterType: 'GEOSHARDED',
      clusterUniqueId: 'clusterUniqueId',
    },
  },
];

function connectionInfoById(connectionId: string): ConnectionInfo {
  const connectionInfo = mockConnections.find(({ id }) => id === connectionId);
  if (!connectionInfo) {
    throw new Error(`No connection for id "${connectionId}"`);
  }
  return connectionInfo;
}

describe('connectionSupports', function () {
  context('rollingIndexCreation', function () {
    it('should return false if the connection has no atlasMetadata', function () {
      expect(
        connectionSupports(
          connectionInfoById('no-atlasMetadata'),
          'rollingIndexCreation'
        )
      ).to.be.false;
    });

    it('should return false for host cluster type', function () {
      expect(
        connectionSupports(
          connectionInfoById('host-cluster'),
          'rollingIndexCreation'
        )
      ).to.be.false;
    });

    it('should return false for serverless cluster type', function () {
      expect(
        connectionSupports(
          connectionInfoById('serverless-cluster'),
          'rollingIndexCreation'
        )
      ).to.be.false;
    });

    it('should return false for free/shared tier clusters', function () {
      expect(
        connectionSupports(
          connectionInfoById('free-cluster'),
          'rollingIndexCreation'
        )
      ).to.be.false;
    });

    it('should return true for dedicated replicaSet clusters', function () {
      expect(
        connectionSupports(
          connectionInfoById('dedicated-replicaSet'),
          'rollingIndexCreation'
        )
      ).to.be.true;
    });

    it('should return true for dedicated sharded clusters', function () {
      expect(
        connectionSupports(
          connectionInfoById('dedicated-sharded'),
          'rollingIndexCreation'
        )
      ).to.be.true;
    });
  });
  context('globalWrites', function () {
    it('should return false if the connection has no atlasMetadata', function () {
      expect(
        connectionSupports(
          connectionInfoById('no-atlasMetadata'),
          'globalWrites'
        )
      ).to.be.false;
    });

    it('should return true if the cluster type is geosharded', function () {
      expect(
        connectionSupports(
          connectionInfoById('dedicated-geo-sharded'),
          'globalWrites'
        )
      ).to.be.true;
    });
  });
});
