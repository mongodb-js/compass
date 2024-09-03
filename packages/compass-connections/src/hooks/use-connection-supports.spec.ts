import { useConnectionSupports } from './use-connection-supports';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { expect } from 'chai';
import { renderHookWithConnections } from '../test';

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
      clusterId: 'clusterId',
      clusterType: 'host',
      instanceSize: 'M10',
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
      clusterId: 'clusterId',
      clusterType: 'replicaSet',
      instanceSize: 'M0',
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
      clusterId: 'clusterId',
      clusterType: 'serverless',
      instanceSize: 'SERVERLESS_V2',
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
      clusterId: 'clusterId',
      clusterType: 'replicaSet',
      instanceSize: 'M10',
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
      clusterId: 'clusterId',
      clusterType: 'cluster',
      instanceSize: 'M10',
    },
  },
];

describe('useConnectionSupports', function () {
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
      () => useConnectionSupports('serverless-cluster', 'rollingIndexCreation'),
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
      () => useConnectionSupports('dedicated-sharded', 'rollingIndexCreation'),
      {
        connections: mockConnections,
      }
    );
    expect(result.current).to.equal(true);
  });
});
