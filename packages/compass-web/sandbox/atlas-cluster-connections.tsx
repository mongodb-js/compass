import {
  Banner,
  Button,
  Label,
  Link,
  VisuallyHidden,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import React, { useCallback, useState } from 'react';
import { ConnectionsList } from './connections-list';
import { ConnectionString } from 'mongodb-connection-string-url';

type NdsCluster = {
  uniqueId: string;
  name: string;
  srvAddress: string;
};

type SignInStatus = 'initial' | 'fetching' | 'updating' | 'success' | 'error';

type AtlasClusterConnectionsListReturnValue = (
  | { signInStatus: 'initial'; signInError: null; projectId: null }
  | {
      signInStatus: 'fetching' | 'updating';
      signInError: string | null;
      projectId: string | null;
    }
  | { signInStatus: 'success'; signInError: null; projectId: string }
  | { signInStatus: 'error'; signInError: string; projectId: null }
) & {
  connections: ConnectionInfo[];
  signIn(this: void): Promise<void>;
};

export function useAtlasClusterConnectionsList(): AtlasClusterConnectionsListReturnValue {
  const [signInStatus, setSignInStatus] = useState<SignInStatus>('initial');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);

  const signIn = useCallback(async () => {
    try {
      setSignInStatus((status) => {
        return status === 'initial' ? 'fetching' : 'updating';
      });
      const { projectId } = await fetch('/authenticate', {
        method: 'POST',
      }).then((res) => {
        return res.json() as Promise<{ projectId: string }>;
      });
      setProjectId(projectId);
      const clusters = await fetch(
        `/cloud-mongodb-com/nds/clusters/${projectId}`
      ).then((res) => {
        return res.json() as Promise<NdsCluster[]>;
      });
      setConnections(
        clusters.map((cluster: NdsCluster): ConnectionInfo => {
          const connectionString = new ConnectionString(
            `mongodb+srv://${cluster.srvAddress}`
          );
          connectionString.searchParams.set('tls', 'true');
          connectionString.searchParams.set('maxPoolSize', '3');
          connectionString.searchParams.set('authMechanism', 'MONGODB-X509');
          connectionString.searchParams.set('authSource', '$external');
          return {
            id: cluster.uniqueId,
            connectionOptions: {
              connectionString: connectionString.toString(),
              lookup() {
                return {
                  wsURL: 'ws://localhost:1337',
                  projectId: projectId,
                  clusterName: cluster.name,
                  srvAddress: cluster.srvAddress,
                };
              },
            },
            atlasMetadata: {
              orgId: '',
              projectId: projectId,
              clusterId: cluster.uniqueId,
              clusterName: cluster.name,
              clusterType: 'replicaSet',
              regionalBaseUrl: '',
            },
          };
        })
      );
      setSignInStatus('success');
    } catch (err) {
      setSignInError((err as Error).message);
      setSignInStatus('error');
    }
  }, []);

  // This is all pretty useless to check, but typescript will complain otherwise
  if (signInStatus === 'initial') {
    return {
      signIn,
      signInStatus,
      signInError: null,
      projectId: null,
      connections,
    };
  }

  if (signInStatus === 'fetching' || signInStatus === 'updating') {
    return { signIn, signInStatus, signInError, projectId, connections };
  }

  if (signInStatus === 'error' && signInError) {
    return { signIn, signInStatus, signInError, projectId: null, connections };
  }

  if (signInStatus === 'success' && projectId) {
    return { signIn, signInStatus, signInError: null, projectId, connections };
  }

  throw new Error('Weird state, ask for help in Compass dev channel');
}

export function AtlasClusterConnectionsList({
  connections,
  onConnectionClick,
  onConnectionDoubleClick,
  signInStatus,
  signInError,
  onSignInClick,
}: {
  connections: ConnectionInfo[];
  onConnectionClick(connectionInfo: ConnectionInfo): void;
  onConnectionDoubleClick(connectionInfo: ConnectionInfo): void;
  signInStatus: string;
  signInError: string | null;
  onSignInClick(): void;
}) {
  if (signInStatus === 'initial' || signInStatus === 'fetching') {
    return (
      <Button
        variant="primary"
        type="button"
        isLoading={signInStatus === 'fetching'}
        loadingText="Logging in..."
        onClick={onSignInClick}
      >
        Log in to Atlas
      </Button>
    );
  }

  if (signInStatus === 'error' && signInError) {
    return <Banner variant="danger">{signInError}</Banner>;
  }

  if (connections.length === 0) {
    return (
      <div>
        You do not have any clusters in this project.{' '}
        <Link target="_blank" href={`/create-cluster`}>
          Create cluster
        </Link>
      </div>
    );
  }

  return (
    <div>
      <VisuallyHidden>
        <Label htmlFor="atlas-connection-list">Atlas clusters</Label>
      </VisuallyHidden>
      <ConnectionsList
        id="atlas-connection-list"
        connections={connections}
        onConnectionClick={onConnectionClick}
        onConnectionDoubleClick={onConnectionDoubleClick}
        renderConnectionLabel={(connectionInfo) => {
          return connectionInfo.atlasMetadata?.clusterName;
        }}
      ></ConnectionsList>
    </div>
  );
}
