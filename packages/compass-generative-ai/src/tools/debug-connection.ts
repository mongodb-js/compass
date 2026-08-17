import type {
  AtlasAdminApiService,
  AtlasClusterState,
  AtlasAccessListEntry,
} from '@mongodb-js/atlas-admin-api/provider';
import {
  type AtlasService,
  buildNetworkAccessListUrl,
  buildClusterOverviewUrl,
} from '@mongodb-js/atlas-service/provider';

export type IpAccessAllowed = 'Client IP Allowed' | 'Could not confirm';

export type NetworkAccessDetails = {
  networkAccessList: AtlasAccessListEntry[];
  userIp?: string;
};

export type AtlasConnectionDebugResult = {
  clusterName: string;
  clusterState: string;
  ipAccessAllowed: IpAccessAllowed;
  advice?: string;
};

function mapClusterStateToDebugResultState({
  state,
  paused,
}: {
  state: AtlasClusterState;
  paused: boolean;
}): string {
  if (paused) {
    return 'PAUSED';
  }
  if (state === 'IDLE') {
    return 'READY';
  }
  return state;
}

function isUserIPIncluded(
  ipAccessList: Array<{ ipAddress?: string }>,
  userIp: string
): boolean | undefined {
  return ipAccessList.some(
    ({ ipAddress }) => ipAddress && ipAddress === userIp
  );
}

async function getClusterInfo(
  connectionString: string,
  atlasAdminApi: AtlasAdminApiService
): Promise<
  | {
      projectId: string;
      clusterName: string;
      clusterState: string;
    }
  | {
      clusterNotFound: true;
    }
> {
  const result = await atlasAdminApi.getProjectIdAndClusterName(
    connectionString
  );
  if (!result) {
    return {
      clusterNotFound: true,
    };
  }

  const { projectId, clusterName } = result;

  const clusterDetails = await atlasAdminApi.getClusterState(
    projectId,
    clusterName
  );

  return await Promise.resolve({
    projectId,
    clusterName,
    clusterState: mapClusterStateToDebugResultState({
      state: clusterDetails.state,
      paused: clusterDetails.paused,
    }),
  });
}

async function getNetworkAccessInfo({
  projectId,
  atlasAdminApi,
}: {
  projectId: string;
  atlasAdminApi: AtlasAdminApiService;
}): Promise<{
  ipAccessAllowed: IpAccessAllowed;
  networkAccessDetails: NetworkAccessDetails;
}> {
  const ipAccessList = await atlasAdminApi.getProjectIPAccessList(projectId);
  // TODO(COMPASS-10981): replace with Atlas Admin API once it's ready
  const userIp = await fetch('https://api.ipify.org?format=json')
    .then((res) => res.json())
    .then((data) => data?.ip)
    .catch(() => undefined);
  console.log({ userIp, ipAccessList });
  return {
    ipAccessAllowed:
      ipAccessList && userIp && isUserIPIncluded(ipAccessList, userIp)
        ? 'Client IP Allowed'
        : 'Could not confirm',
    networkAccessDetails: {
      networkAccessList: ipAccessList,
      userIp,
    },
  };
}

function getAdvice({
  clusterState,
  ipAccessAllowed,
  projectId,
  clusterName,
}: {
  clusterState: string;
  ipAccessAllowed: IpAccessAllowed;
  projectId: string;
  clusterName: string;
}): string {
  if (clusterState === 'notFound') {
    return 'The cluster does not exist or you do not have access to it.';
  }
  const advice = [];

  const clusterOverviewUrl = buildClusterOverviewUrl({
    projectId,
    clusterName,
  });
  const networkAccessListUrl = buildNetworkAccessListUrl({ projectId });

  if (clusterState === 'PAUSED') {
    advice.push('The cluster is currently paused.');
    if (clusterOverviewUrl) {
      advice.push(`You can resume it in the Atlas UI: ${clusterOverviewUrl}`);
    }
  }
  if (clusterState === 'CREATING') {
    advice.push(
      'The cluster is being provisioned. Wait until it is ready before attempting to connect.'
    );
    if (clusterOverviewUrl) {
      advice.push(`See the status in the Atlas UI: ${clusterOverviewUrl}`);
    }
  }

  if (ipAccessAllowed !== 'Client IP Allowed') {
    advice.push('Your IP address is not allowed to access the cluster.');
    if (networkAccessListUrl) {
      advice.push(
        'Add your IP address in the Atlas UI: ' + networkAccessListUrl
      );
    }
  }

  return advice.join(' ');
}

export async function debugConnection(
  connectionString: string,
  atlasAdminApi: AtlasAdminApiService,
  _atlasService: AtlasService
): Promise<AtlasConnectionDebugResult> {
  console.log('Debugging connection for', connectionString);
  const clusterInfo = await getClusterInfo(connectionString, atlasAdminApi);
  if ('clusterNotFound' in clusterInfo) {
    return {
      clusterName: 'Unknown',
      clusterState: 'Unknown',
      ipAccessAllowed: 'Could not confirm',
      advice: 'The cluster does not exist or you do not have access to it.',
    };
  }
  const { projectId, clusterName, clusterState } = clusterInfo;
  console.log({ projectId, clusterName, clusterState });
  const { ipAccessAllowed, networkAccessDetails } = await getNetworkAccessInfo({
    projectId,
    atlasAdminApi,
  });
  console.log({ ipAccessAllowed, networkAccessDetails });
  return {
    clusterName,
    clusterState,
    ipAccessAllowed,
    advice: getAdvice({
      clusterState,
      projectId,
      clusterName,
      ipAccessAllowed,
    }),
    ...(!ipAccessAllowed ? { networkAccessDetails } : {}),
  };
}
