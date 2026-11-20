import React, { useRef } from 'react';
import ConnectionString from 'mongodb-connection-string-url';
import type {
  ConnectionStorage,
  ConnectionInfo,
  AtlasClusterMetadata,
} from '@mongodb-js/connection-storage/provider';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { createServiceProvider } from '@mongodb-js/compass-app-registry';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import {
  mongoLogId,
  useLogger,
  type Logger,
} from '@mongodb-js/compass-logging/provider';

type ElectableSpecs = {
  instanceSize?: string;
};

type RegionConfig = {
  priority: number;
  electableSpecs: ElectableSpecs;
};

type ReplicationSpec = {
  regionConfigs: RegionConfig[];
};

type ClusterType = 'REPLICASET' | 'SHARDED' | 'GEOSHARDED';

type ClusterDescription = {
  '@provider': string;
  uniqueId: string;
  groupId: string;
  name: string;
  clusterType: ClusterType;
  srvAddress: string;
  state: string;
  deploymentItemName: string;
  replicationSpecList?: ReplicationSpec[];
  isPaused?: boolean;
  geoSharding?: {
    selfManagedSharding?: boolean;
  };
};

export type ClusterDescriptionWithDataProcessingRegion = ClusterDescription & {
  dataProcessingRegion: { regionalUrl: string };
};

export const sandboxConnectionStorage: { current: ConnectionStorage | null } = {
  current: null,
};

const VISIBLE_CLUSTER_STATES: AtlasClusterMetadata['clusterState'][] = [
  'IDLE',
  'REPAIRING',
  'UPDATING',
  'PAUSED',
  'CREATING',
  'DELETING',
  'DELETED',
];

const READ_PREFERENCE_PARAMS = [
  'readPreference',
  'readPreferenceTags',
  'maxStalenessSeconds',
];

type SearchParamEntries = [key: string, value: string][];

function getReadPreferenceParams(connectionString: string): SearchParamEntries {
  const { searchParams } = new ConnectionString(connectionString);
  return READ_PREFERENCE_PARAMS.flatMap((key) =>
    searchParams.getAll(key).map((value): [string, string] => [key, value])
  );
}

function applyReadPreferenceParams(
  connectionInfo: ConnectionInfo,
  params: SearchParamEntries
): ConnectionInfo {
  const connectionString = new ConnectionString(
    connectionInfo.connectionOptions.connectionString
  );
  for (const key of READ_PREFERENCE_PARAMS) {
    connectionString.searchParams.delete(key);
  }
  for (const [key, value] of params) {
    connectionString.searchParams.append(key, value);
  }
  return {
    ...connectionInfo,
    connectionOptions: {
      ...connectionInfo.connectionOptions,
      connectionString: connectionString.toString(),
    },
  };
}

/**
 * @internal exported for testing purposes
 */
export class AtlasCloudConnectionStorage
  extends InMemoryConnectionStorage
  implements ConnectionStorage
{
  private loadAllPromise: Promise<ConnectionInfo[]> | undefined;
  private atlasService: AtlasService;
  private orgId: string;
  private projectId: string;
  private logger: Logger;
  // Data Explorer only lets users edit the read preference, and only for the
  // current session. We keep just those params instead of the whole edited
  // connection info so that every refresh still picks up any other changes
  // Atlas makes to the cluster's connection info.
  private readPreferenceOverrides = new Map<string, SearchParamEntries>();
  constructor(
    atlasService: AtlasService,
    orgId: string,
    projectId: string,
    logger: Logger
  ) {
    super();
    this.atlasService = atlasService;
    this.orgId = orgId;
    this.projectId = projectId;
    this.logger = logger;
  }
  async load({ id }: { id: string }): Promise<ConnectionInfo | undefined> {
    return (await this.loadAll()).find((info) => {
      return info.id === id;
    });
  }

  private async _loadAndNormalizeClusterDescriptionInfo(): Promise<
    ConnectionInfo[]
  > {
    let connectionInfoList: ConnectionInfo[] = [];

    try {
      const res = await this.atlasService.authenticatedFetch(
        this.atlasService.cloudEndpoint(
          `/explorer/v1/groups/${this.projectId}/clusters/connectionInfo`
        )
      );

      connectionInfoList = await res.json();
    } catch (err) {
      this.logger.log.error(
        mongoLogId(1_001_000_357),
        'LoadAndNormalizeClusterDescriptionInfo',
        'Failed to load connection list',
        { error: (err as Error).message }
      );
      throw err;
    }

    return connectionInfoList
      .map((connectionInfo: ConnectionInfo): ConnectionInfo | null => {
        if (
          !connectionInfo.atlasMetadata ||
          !VISIBLE_CLUSTER_STATES.includes(
            connectionInfo.atlasMetadata.clusterState
          )
        ) {
          this.logger.log.warn(
            mongoLogId(1_001_000_358),
            'LoadAndNormalizeClusterDescriptionInfo',
            'Skipping connection info due to unsupported cluster state or missing metadata',
            { connectionInfo }
          );
          return null;
        }

        return connectionInfo;
      })
      .filter((connectionInfo): connectionInfo is ConnectionInfo => {
        return !!connectionInfo;
      })
      .map((connectionInfo) => {
        const overrides = this.readPreferenceOverrides.get(connectionInfo.id);
        return overrides
          ? applyReadPreferenceParams(connectionInfo, overrides)
          : connectionInfo;
      });
  }

  save({ connectionInfo }: { connectionInfo: ConnectionInfo }): Promise<void> {
    this.readPreferenceOverrides.set(
      connectionInfo.id,
      getReadPreferenceParams(connectionInfo.connectionOptions.connectionString)
    );
    return Promise.resolve();
  }

  loadAll(): Promise<ConnectionInfo[]> {
    this.loadAllPromise ??=
      this._loadAndNormalizeClusterDescriptionInfo().finally(() => {
        delete this.loadAllPromise;
      });
    return this.loadAllPromise;
  }
}

const SandboxConnectionStorageContext =
  React.createContext<ConnectionStorage | null>(null);

/**
 * Only used in the sandbox to provide connection info when connecting to the
 * non-Atlas deployment
 * @internal
 */
export const SandboxConnectionStorageProvider = ({
  value,
  children,
}: {
  value: ConnectionStorage | null;
  children: React.ReactNode;
}) => {
  return (
    <SandboxConnectionStorageContext.Provider value={value}>
      {children}
    </SandboxConnectionStorageContext.Provider>
  );
};

export const AtlasCloudConnectionStorageProvider = createServiceProvider(
  function AtlasCloudConnectionStorageProvider({
    orgId,
    projectId,
    children,
  }: {
    orgId: string;
    projectId: string;
    children: React.ReactChild;
  }) {
    const logger = useLogger('ATLAS-CLOUD-CONNECTION-STORAGE');
    const atlasService = atlasServiceLocator();
    const storage = useRef(
      new AtlasCloudConnectionStorage(atlasService, orgId, projectId, logger)
    );
    return (
      <ConnectionStorageProvider
        value={sandboxConnectionStorage.current ?? storage.current}
      >
        {children}
      </ConnectionStorageProvider>
    );
  }
);
