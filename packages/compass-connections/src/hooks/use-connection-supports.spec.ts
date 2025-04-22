import { useConnectionSupports } from './use-connection-supports';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { expect } from 'chai';
import { renderHookWithConnections } from '@mongodb-js/testing-library-compass';

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
      regionalBaseUrl: null,
      metricsId: 'metricsId',
      metricsType: 'replicaSet',
      instanceSize: 'M10',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
      clusterState: 'IDLE',
      supports: {
        globalWrites: false,
        rollingIndexes: false,
      },
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
      regionalBaseUrl: null,
      metricsId: 'metricsId',
      metricsType: 'replicaSet',
      instanceSize: 'M0',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
      clusterState: 'IDLE',
      supports: {
        globalWrites: false,
        rollingIndexes: false,
      },
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
      regionalBaseUrl: null,
      metricsId: 'metricsId',
      metricsType: 'serverless',
      instanceSize: 'SERVERLESS_V2',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
      clusterState: 'IDLE',
      supports: {
        globalWrites: false,
        rollingIndexes: false,
      },
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
      regionalBaseUrl: null,
      metricsId: 'metricsId',
      metricsType: 'replicaSet',
      instanceSize: 'M10',
      clusterType: 'REPLICASET',
      clusterUniqueId: 'clusterUniqueId',
      clusterState: 'IDLE',
      supports: {
        globalWrites: false,
        rollingIndexes: true,
      },
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
      regionalBaseUrl: null,
      metricsId: 'metricsId',
      metricsType: 'cluster',
      instanceSize: 'M10',
      clusterType: 'SHARDED',
      clusterUniqueId: 'clusterUniqueId',
      clusterState: 'IDLE',
      supports: {
        globalWrites: false,
        rollingIndexes: true,
      },
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
      regionalBaseUrl: null,
      metricsId: 'metricsId',
      metricsType: 'cluster',
      instanceSize: 'M30',
      clusterType: 'GEOSHARDED',
      clusterUniqueId: 'clusterUniqueId',
      clusterState: 'IDLE',
      supports: {
        globalWrites: true,
        rollingIndexes: true,
      },
    },
  },
];

describe('useConnectionSupports', function () {
  context('rollingIndexCreation', function () {
    it('should return false if the connection does not exist', function () {
      const { result } = renderHookWithConnections(
        () => useConnectionSupports('does-not-exist', 'rollingIndexCreation'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(false);
    });

    it('should return false if the connection has no atlasMetadata', function () {
      const { result } = renderHookWithConnections(
        () => useConnectionSupports('no-atlasMetadata', 'rollingIndexCreation'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(false);
    });

    it('should return false for host cluster type', function () {
      const { result } = renderHookWithConnections(
        () => useConnectionSupports('host-cluster', 'rollingIndexCreation'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(false);
    });

    it('should return false for serverless cluster type', function () {
      const { result } = renderHookWithConnections(
        () =>
          useConnectionSupports('serverless-cluster', 'rollingIndexCreation'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(false);
    });

    it('should return false for free/shared tier clusters', function () {
      const { result } = renderHookWithConnections(
        () => useConnectionSupports('free-cluster', 'rollingIndexCreation'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(false);
    });

    it('should return true for dedicated replicaSet clusters', function () {
      const { result } = renderHookWithConnections(
        () =>
          useConnectionSupports('dedicated-replicaSet', 'rollingIndexCreation'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(true);
    });

    it('should return true for dedicated sharded clusters', function () {
      const { result } = renderHookWithConnections(
        () =>
          useConnectionSupports('dedicated-sharded', 'rollingIndexCreation'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(true);
    });
  });
  context('globalWrites', function () {
    it('should return false if the connection does not exist', function () {
      const { result } = renderHookWithConnections(
        () => useConnectionSupports('does-not-exist', 'globalWrites'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(false);
    });
    it('should return false if the connection has no atlasMetadata', function () {
      const { result } = renderHookWithConnections(
        () => useConnectionSupports('no-atlasMetadata', 'globalWrites'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(false);
    });

    it('should return true if the cluster type is geosharded', function () {
      const { result } = renderHookWithConnections(
        () => useConnectionSupports('dedicated-geo-sharded', 'globalWrites'),
        {
          connections: mockConnections,
        }
      );
      expect(result.current).to.equal(true);
    });
  });
});
