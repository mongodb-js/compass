import type {
  AtlasAdminApiService,
  AtlasClusterState,
} from '@mongodb-js/atlas-admin-api/provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';

export type AtlasConnectionDebugResult = {
  clusterState: 'ready' | 'paused' | 'provisioning' | 'deleted' | 'notFound';
  ipAccessAllowed: boolean | 'unknown';
};

function mapClusterStateToDebugResultState({
  state,
  paused,
}: {
  state: AtlasClusterState;
  paused: boolean;
}): AtlasConnectionDebugResult['clusterState'] {
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

export async function debugConnection(
  connectionString: string,
  atlasAdminApi: AtlasAdminApiService,
  _atlasService: AtlasService
): Promise<AtlasConnectionDebugResult> {
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
  });
}
