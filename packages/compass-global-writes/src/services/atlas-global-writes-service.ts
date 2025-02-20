import toNS from 'mongodb-ns';
import keyBy from 'lodash/keyBy';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { CreateShardKeyData } from '../store/reducer';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

const TIMESTAMP_REGEX = /\[\d{1,2}:\d{2}:\d{2}\.\d{3}\]/;

export type ShardZoneMapping = {
  isoCode: string;
  typeOneIsoCode: string;
  zoneId: string;
  country: string;
  readableName: string;
};
export type ManagedNamespace = {
  db: string;
  collection: string;
  customShardKey: string;
  isCustomShardKeyHashed: boolean;
  isShardKeyUnique: boolean;
  numInitialChunks: number | null;
  presplitHashedZones: boolean;
};

type GeoShardingData = {
  customZoneMapping: Record<string, ShardZoneMapping>;
  managedNamespaces: ManagedNamespace[];
  selfManagedSharding: boolean;
};

type ReplicationItem = {
  id: string;
  regionConfigs: {
    regionView: {
      location: string;
    };
  }[];
  zoneId: string;
  zoneName: string;
};
export type ClusterDetailsApiResponse = {
  geoSharding: GeoShardingData;
  replicationSpecList: ReplicationItem[];
};

export type AutomationAgentProcess = {
  statusType: string;
  workingOnShort: string;
  errorText: string;
};

export type AutomationAgentDeploymentStatusApiResponse = {
  automationStatus: {
    processes: AutomationAgentProcess[];
  };
};

export type AtlasShardKey = {
  _id: string;
  unique: boolean;
  key: Record<string, unknown>;
};

function assertDataIsClusterDetailsApiResponse(
  data: any
): asserts data is ClusterDetailsApiResponse {
  if (!Array.isArray(data?.geoSharding?.managedNamespaces)) {
    throw new Error(
      'Invalid cluster details API response geoSharding.managedNamespaces'
    );
  }
  if (typeof data?.geoSharding?.customZoneMapping !== 'object') {
    throw new Error(
      'Invalid cluster details API response geoSharding.customZoneMapping'
    );
  }
  if (!Array.isArray(data?.replicationSpecList)) {
    throw new Error('Invalid cluster details API response replicationSpecList');
  }
}

function assertDataIsAutomationAgentDeploymentStatusApiResponse(
  data: any
): asserts data is AutomationAgentDeploymentStatusApiResponse {
  if (!Array.isArray(data?.automationStatus?.processes)) {
    throw new Error(
      'Invalid automation agent deployment status API response automationStatus.processes'
    );
  }
}

function assertDataIsShardZonesApiResponse(
  data: any
): asserts data is Record<string, ShardZoneMapping> {
  if (typeof data !== 'object') {
    throw new Error('Invalid shard zones API response');
  }
}

export class AtlasGlobalWritesService {
  constructor(
    private atlasService: AtlasService,
    private connectionInfo: ConnectionInfoRef
  ) {}

  private getAtlasMetadata() {
    if (!this.connectionInfo.current?.atlasMetadata) {
      throw new Error('Atlas metadata is not available');
    }
    return this.connectionInfo.current.atlasMetadata;
  }

  private async getClusterDetails(): Promise<ClusterDetailsApiResponse> {
    const { projectId, clusterName } = this.getAtlasMetadata();
    const uri = this.atlasService.cloudEndpoint(
      `nds/clusters/${projectId}/${clusterName}`
    );
    const response = await this.atlasService.authenticatedFetch(uri);
    const clusterDetails = await response.json();
    assertDataIsClusterDetailsApiResponse(clusterDetails);
    return clusterDetails;
  }

  async getManagedNamespace(namespace: string) {
    const clusterDetails = await this.getClusterDetails();
    const { database, collection } = toNS(namespace);
    return clusterDetails.geoSharding.managedNamespaces.find(
      (managedNamespace) => {
        return (
          managedNamespace.db === database &&
          managedNamespace.collection === collection
        );
      }
    );
  }

  async manageNamespace(namespace: string, keyData: CreateShardKeyData) {
    const clusterDetails = await this.getClusterDetails();
    const { database, collection } = toNS(namespace);
    const requestData: GeoShardingData = {
      ...clusterDetails.geoSharding,
      managedNamespaces: [
        ...clusterDetails.geoSharding.managedNamespaces,
        {
          db: database,
          collection: collection,
          ...keyData,
        },
      ],
    };

    const { projectId, clusterName } = this.getAtlasMetadata();
    const uri = this.atlasService.cloudEndpoint(
      `nds/clusters/${projectId}/${clusterName}/geoSharding`
    );

    const response = await this.atlasService.authenticatedFetch(uri, {
      method: 'PATCH',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    assertDataIsClusterDetailsApiResponse(await response.json());

    const managedNamespace = requestData.managedNamespaces.find(
      (managedNamespace) =>
        managedNamespace.db === database &&
        managedNamespace.collection === collection
    );
    if (!managedNamespace) {
      throw new Error('Managed namespace not found');
    }
    return managedNamespace;
  }

  async getShardingError(namespace: string) {
    const { projectId } = this.getAtlasMetadata();
    const uri = this.atlasService.cloudEndpoint(
      `/automation/deploymentStatus/${projectId}`
    );
    const response = await this.atlasService.authenticatedFetch(uri);
    const data = await response.json();
    assertDataIsAutomationAgentDeploymentStatusApiResponse(data);
    const namespaceShardingError = data.automationStatus.processes.find(
      (process) =>
        process.statusType === 'ERROR' &&
        process.workingOnShort === 'ShardCollections' &&
        process.errorText.indexOf(namespace) !== -1
    );
    if (!namespaceShardingError) return undefined;
    const errorTextSplit =
      namespaceShardingError.errorText.split(TIMESTAMP_REGEX);
    return errorTextSplit[errorTextSplit.length - 1].trim();
  }

  async getShardingKeys(namespace: string) {
    const { database: db, collection } = toNS(namespace);
    const atlasMetadata = this.getAtlasMetadata();

    const req = await this.atlasService.automationAgentRequest(
      atlasMetadata,
      'getShardKey',
      {
        db,
        collection,
      }
    );

    if (!req) {
      throw new Error(
        'Unexpected response from the automation agent backend: expected to get the request metadata, got undefined'
      );
    }

    const res = await this.atlasService.automationAgentAwait<AtlasShardKey>(
      atlasMetadata,
      req.requestType,
      req._id
    );
    const data = res.response;

    if (data.length === 0) {
      return undefined;
    }
    const { key, unique } = data[0];

    return {
      fields: Object.keys(key).map(
        (field) =>
          ({
            name: field,
            type: key[field] === 'hashed' ? 'HASHED' : 'RANGE',
          } as const)
      ),
      isUnique: !!unique,
    };
  }

  async getShardingZones() {
    const { projectId } = this.getAtlasMetadata();
    const {
      replicationSpecList: replicationSpecs,
      geoSharding: { customZoneMapping },
    } = await this.getClusterDetails();

    const uri = this.atlasService.cloudEndpoint(
      `/nds/geoSharding/${projectId}/newFormLocationMapping`
    );
    const response = await this.atlasService.authenticatedFetch(uri, {
      method: 'POST',
      body: JSON.stringify({
        replicationSpecs,
        customZoneMapping,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    assertDataIsShardZonesApiResponse(data);
    return transformZoneData(Object.values(data), replicationSpecs);
  }

  async unmanageNamespace(namespace: string) {
    const clusterDetails = await this.getClusterDetails();
    const { database, collection } = toNS(namespace);

    const newManagedNamespaces =
      clusterDetails.geoSharding.managedNamespaces.filter(
        (managedNamespace) =>
          managedNamespace.db !== database ||
          managedNamespace.collection !== collection
      );
    const requestData: GeoShardingData = {
      ...clusterDetails.geoSharding,
      managedNamespaces: newManagedNamespaces,
    };

    const { projectId, clusterName } = this.getAtlasMetadata();
    const uri = this.atlasService.cloudEndpoint(
      `nds/clusters/${projectId}/${clusterName}/geoSharding`
    );

    await this.atlasService.authenticatedFetch(uri, {
      method: 'PATCH',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

function transformZoneData(
  zoneData: ShardZoneMapping[],
  replicationSpecs: ReplicationItem[]
) {
  const replicationSpecsMap = keyBy(replicationSpecs, 'zoneId');
  return zoneData.map((zone) => ({
    zoneId: zone.zoneId,
    country: zone.country,
    readableName: zone.readableName,
    isoCode: zone.isoCode,
    typeOneIsoCode: zone.typeOneIsoCode,
    zoneName: replicationSpecsMap[zone.zoneId].zoneName,
    zoneLocations: replicationSpecsMap[zone.zoneId].regionConfigs.map(
      (regionConfig) => regionConfig.regionView.location
    ),
  }));
}
