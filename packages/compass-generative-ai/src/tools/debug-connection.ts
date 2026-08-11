import type {
  AtlasAdminApiService,
  AtlasClusterState,
} from '@mongodb-js/atlas-admin-api/provider';
import {
  type AtlasService,
  buildNetworkAccessListUrl,
  buildClusterOverviewUrl,
} from '@mongodb-js/atlas-service/provider';

export type ClusterState =
  | 'ready'
  | 'paused'
  | 'provisioning'
  | 'deleted'
  | 'notFound';
export type IpAccessAllowed = boolean | 'unknown';

export type AtlasConnectionDebugResult = {
  clusterState: ClusterState;
  ipAccessAllowed: IpAccessAllowed;
  advice?: string;
};

function mapClusterStateToDebugResultState({
  state,
  paused,
}: {
  state: AtlasClusterState;
  paused: boolean;
}): ClusterState {
  if (paused) {
    return 'paused';
  }
  switch (state) {
    case 'IDLE':
      return 'ready';
    case 'CREATING':
    case 'UPDATING':
    case 'REPAIRING':
      return 'provisioning';
    case 'DELETING':
      return 'deleted';
  }
}

// function isUserIPIncluded(
//   ipAccessList?: Array<{ ipAddress?: string }>,
//   userIp?: string
// ): boolean | 'unknown' {
//   if (!userIp || !ipAccessList) {
//     return 'unknown';
//   }
//   const userIP = userIp.trim();
//   return ipAccessList.some(
//     ({ ipAddress }) => ipAddress && ipAddress === userIp
//   );
// }

async function getClusterInfo(
  connectionString: string,
  atlasAdminApi: AtlasAdminApiService,
  atlasService: AtlasService
): Promise<{
  clusterState: ClusterState;
  ipAccessAllowed: IpAccessAllowed;
  clusterInfo?: {
    projectId: string;
    clusterName: string;
  };
}> {
  const result = await atlasAdminApi.getProjectIdAndClusterName(
    connectionString
  );
  if (!result) {
    return {
      clusterState: 'notFound',
      ipAccessAllowed: 'unknown',
    };
  }

  const { projectId, clusterName } = result;
  const clusterDetails = await atlasAdminApi.getClusterState(
    projectId,
    clusterName
  );
  // const ipAccessList = await atlasAdminApi.getProjectIPAccessList(projectId);
  // console.log({ clusterDetails, ipAccessList });
  // TODO: we can't authenticate for this endpoint yet
  // const userIp = await atlasService.authenticatedFetch(
  //   atlasService.privateApiEndpoint('/ipinfo')
  // ).catch(() => undefined)?.then((res) => res?.json()).then((data) => data?.ip);
  // console.log({ userIp, ipAccessList });

  return await Promise.resolve({
    clusterState: mapClusterStateToDebugResultState({
      state: clusterDetails.state,
      paused: clusterDetails.paused,
    }),
    ipAccessAllowed: true,
    // ipAccessAllowed: isUserIPIncluded(ipAccessList, userIp),
    clusterInfo: {
      projectId,
      clusterName,
    },
  });
}

function getAdvice(
  clusterState: ClusterState,
  ipAccessAllowed: IpAccessAllowed,
  clusterInfo?: { projectId: string; clusterName: string }
): string {
  if (clusterState === 'notFound') {
    return 'The cluster does not exist or you do not have access to it.';
  }
  const advice = [];

  const clusterOverviewUrl =
    clusterInfo &&
    buildClusterOverviewUrl({
      projectId: clusterInfo.projectId,
      clusterName: clusterInfo.clusterName,
    });
  const networkAccessListUrl =
    clusterInfo &&
    buildNetworkAccessListUrl({ projectId: clusterInfo.projectId });

  if (clusterState === 'paused') {
    advice.push('The cluster is currently paused.');
    if (clusterOverviewUrl) {
      advice.push(`You can resume it in the Atlas UI: ${clusterOverviewUrl}`);
    }
  }
  if (clusterState === 'provisioning') {
    advice.push(
      'The cluster is being provisioned. Wait until it is ready before attempting to connect.'
    );
    if (clusterOverviewUrl) {
      advice.push(`See the status in the Atlas UI: ${clusterOverviewUrl}`);
    }
  }
  if (clusterState === 'deleted') {
    advice.push('The cluster has been deleted.');
  }

  if (ipAccessAllowed === false && clusterInfo) {
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
  atlasService: AtlasService
): Promise<AtlasConnectionDebugResult> {
  const { clusterState, ipAccessAllowed, clusterInfo } = await getClusterInfo(
    connectionString,
    atlasAdminApi,
    atlasService
  );
  return {
    clusterState,
    ipAccessAllowed: ipAccessAllowed ?? 'unknown',
    advice: getAdvice(clusterState, ipAccessAllowed, clusterInfo),
  };
}
