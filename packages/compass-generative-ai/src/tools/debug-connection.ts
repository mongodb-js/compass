import ip from 'ipaddr.js';
import type {
  AtlasAdminApiService,
  AtlasClusterState,
  AtlasAccessListEntry,
} from '@mongodb-js/atlas-admin-api/provider';
import {
  buildNetworkAccessListUrl,
  buildClusterOverviewUrl,
} from '@mongodb-js/atlas-service/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';

export const debugConnectionDescription = `
  Use to debug a Compass connection failure to an Atlas cluster. 
  Atlas-side diagnostics (cluster state, IP access list) as well as targeted advice. 
  When advice is provided:
  1. Provide the advice as part of your response.
  2. If the url contains any links present the links in the advice as part of your response, with a 1-line explanation.
`;

export type IpAccessStatus = 'Client IP Allowed' | 'Could not confirm';

export type NetworkAccessDetails = {
  networkAccessList: AtlasAccessListEntry[];
  userIp?: string;
};

type Links = {
  clusterOverview?: string;
  networkAccessList?: string;
};

export type AtlasConnectionDebugResult = {
  clusterName: string;
  clusterState: string;
  ipAccessStatus: IpAccessStatus;
  advice?: string;
  networkAccessDetails?: NetworkAccessDetails;
  links?: Links;
};

function isIPAccessAllowed(ipAccessStatus: IpAccessStatus): boolean {
  return ipAccessStatus === 'Client IP Allowed';
}

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

export function isUserIpIncluded(
  ipAccessList: NetworkAccessDetails['networkAccessList'],
  userIp: string
): boolean | undefined {
  return ipAccessList.some(({ ipAddress, cidrBlock }) => {
    // it's either one or the other
    if (cidrBlock) return isAddressInCidrRange(cidrBlock, userIp);
    if (ipAddress) return isAddressEqual(ipAddress, userIp);
    return false;
  });
}

function isAddressInCidrRange(cidrNotation: string, address: string): boolean {
  try {
    const range: [ip.IPv4 | ip.IPv6, number] = ip.parseCIDR(
      cidrNotation.trim()
    );
    return ip.parse(address.trim()).match(range);
  } catch {
    return false;
  }
}

function isAddressEqual(address1: string, address2: string): boolean {
  try {
    const entry = ip.parse(address1.trim());
    return ip
      .parse(address2.trim())
      .match(entry, entry.kind() === 'ipv6' ? 128 : 32);
  } catch {
    return false;
  }
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
  | undefined
> {
  const result = await atlasAdminApi.getProjectIdAndClusterName(
    connectionString
  );
  if (!result) return;

  const { projectId, clusterName } = result;

  const clusterDetails = await atlasAdminApi.getClusterState(
    projectId,
    clusterName
  );

  return {
    projectId,
    clusterName,
    clusterState: mapClusterStateToDebugResultState({
      state: clusterDetails.state,
      paused: clusterDetails.paused,
    }),
  };
}

async function getNetworkAccessInfo({
  projectId,
  atlasAdminApi,
}: {
  projectId: string;
  atlasAdminApi: AtlasAdminApiService;
}): Promise<{
  ipAccessStatus: IpAccessStatus;
  networkAccessDetails: NetworkAccessDetails;
}> {
  const ipAccessList = await atlasAdminApi.getProjectIPAccessList(projectId);
  // TODO(COMPASS-10981): replace with Atlas Admin API once it's ready
  const userIp = '1.2.3.4';
  return {
    ipAccessStatus:
      ipAccessList && userIp && isUserIpIncluded(ipAccessList, userIp)
        ? 'Client IP Allowed'
        : 'Could not confirm',
    networkAccessDetails: {
      networkAccessList: ipAccessList,
      userIp,
    },
  };
}

function getLinks({
  projectId,
  clusterName,
  ipAccessStatus,
  atlasUiBaseUrl,
}: {
  projectId: string;
  clusterName: string;
  ipAccessStatus: IpAccessStatus;
  atlasUiBaseUrl: string;
}): Links {
  return {
    clusterOverview: buildClusterOverviewUrl(
      { projectId, clusterName },
      atlasUiBaseUrl
    ),
    ...(!isIPAccessAllowed(ipAccessStatus)
      ? {
          networkAccessList: buildNetworkAccessListUrl(
            { projectId },
            atlasUiBaseUrl
          ),
        }
      : undefined),
  };
}

function getAdvice({
  clusterState,
  ipAccessStatus,
  links,
}: {
  clusterState: string;
  ipAccessStatus: IpAccessStatus;
  projectId: string;
  clusterName: string;
  links?: Links;
}): string {
  const advice = [];

  if (clusterState === 'PAUSED') {
    advice.push('The cluster is currently paused.');
    if (links?.clusterOverview) {
      advice.push(
        `You can resume it in the Atlas UI: ${links.clusterOverview}.`
      );
    }
  }
  if (clusterState === 'CREATING') {
    advice.push(
      'The cluster is being provisioned. Wait until it is ready before attempting to connect.'
    );
    if (links?.clusterOverview) {
      advice.push(`See the status in the Atlas UI: ${links.clusterOverview}.`);
    }
  }

  if (clusterState === 'DELETING') {
    advice.push('The cluster is being deleted.');
    if (links?.clusterOverview) {
      advice.push(`See the status in the Atlas UI: ${links.clusterOverview}.`);
    }
  }

  if (!isIPAccessAllowed(ipAccessStatus)) {
    advice.push(
      'We could not verify whether your network access is allowed. See the networkAccessDetails.'
    );
    if (links?.networkAccessList) {
      advice.push(
        `Add your IP address in the Atlas UI: ${links.networkAccessList}.`
      );
    }
  }

  return advice.join(' ');
}

export async function debugConnection(
  connectionString: string,
  atlasAdminApi: AtlasAdminApiService,
  track: TrackFunction,
  atlasUiBaseUrl: string
): Promise<AtlasConnectionDebugResult> {
  try {
    const startTime = Date.now();
    const clusterInfo = await getClusterInfo(connectionString, atlasAdminApi);
    if (!clusterInfo) {
      track('Atlas Connection Troubleshooting Success', {
        duration: Date.now() - startTime,
        cluster_state: 'Unknown',
        ip_access_status: 'Could not confirm',
      });
      return {
        clusterName: 'Unknown',
        clusterState: 'Unknown',
        ipAccessStatus: 'Could not confirm',
        advice: 'The cluster does not exist or you do not have access to it.',
      };
    }
    const { projectId, clusterName, clusterState } = clusterInfo;
    const { ipAccessStatus, networkAccessDetails } = await getNetworkAccessInfo(
      {
        projectId,
        atlasAdminApi,
      }
    );
    const links = getLinks({
      projectId,
      clusterName,
      ipAccessStatus,
      atlasUiBaseUrl,
    });

    track('Atlas Connection Troubleshooting Success', {
      duration: Date.now() - startTime,
      cluster_state: clusterState,
      ip_access_status: ipAccessStatus,
    });
    return {
      clusterName,
      clusterState,
      ipAccessStatus,
      links,
      advice: getAdvice({
        clusterState,
        projectId,
        clusterName,
        ipAccessStatus,
        links,
      }),
      ...(!isIPAccessAllowed(ipAccessStatus) && networkAccessDetails
        ? { networkAccessDetails }
        : {}),
    };
  } catch (error) {
    track('Atlas Connection Troubleshooting Failed', {
      error_name: (error as Error).name,
      error_code: (error as any).code,
    });
    throw error;
  }
}
