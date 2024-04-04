import { Banner, Button, Label } from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import React, { useCallback, useState } from 'react';
import { ConnectionsList } from './connections-list';

type NdsCluster = {
  uniqueId: string;
  name: string;
  srvAddress: string;
};

type SignInStatus = 'initial' | 'in-progress' | 'success' | 'error';

type AtlasClusterConnectionsListReturnValue = (
  | { signInStatus: 'initial'; signInError: null; groupId: null }
  | {
      signInStatus: 'in-progress';
      signInError: string | null;
      groupId: string | null;
    }
  | { signInStatus: 'success'; signInError: null; groupId: string }
  | { signInStatus: 'error'; signInError: string; groupId: null }
) & {
  connections: ConnectionInfo[];
  signIn(this: void): Promise<void>;
};

export function useAtlasClusterConnectionsList(): AtlasClusterConnectionsListReturnValue {
  const [signInStatus, setSignInStatus] = useState<SignInStatus>('initial');
  const [signInError, setSignInError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [groupId, setGroupId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);

  const signIn = useCallback(async () => {
    try {
      setSignInStatus('in-progress');
      const { groupId } = await fetch('/authenticate', { method: 'POST' }).then(
        (res) => {
          return res.json() as Promise<{ groupId: string }>;
        }
      );
      setGroupId(groupId);
      const clusters = await fetch(
        `/cloud-mongodb-com/nds/clusters/${groupId}`
      ).then((res) => {
        return res.json() as Promise<NdsCluster[]>;
      });
      setConnections(
        clusters.map((cluster: NdsCluster): ConnectionInfo => {
          return {
            id: cluster.uniqueId,
            connectionOptions: {
              connectionString: `mongodb+srv://<username>:<password>@${cluster.srvAddress}`,
            },
            atlasMetadata: {
              orgId: '',
              projectId: groupId,
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
      groupId: null,
      connections,
    };
  }

  if (signInStatus === 'in-progress') {
    return { signIn, signInStatus, signInError, groupId, connections };
  }

  if (signInStatus === 'error' && signInError) {
    return { signIn, signInStatus, signInError, groupId: null, connections };
  }

  if (signInStatus === 'success' && groupId) {
    return { signIn, signInStatus, signInError: null, groupId, connections };
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
  if (signInStatus === 'initial' || signInStatus === 'in-progress') {
    return (
      <Button
        variant="primary"
        type="button"
        isLoading={signInStatus === 'in-progress'}
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

  return (
    <div>
      <Label htmlFor="atlas-connection-list">Atlas clusters</Label>
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
