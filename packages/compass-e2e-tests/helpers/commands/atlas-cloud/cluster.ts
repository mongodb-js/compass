import ConnectionString from 'mongodb-connection-string-url';
import type { CompassBrowser } from '../../compass-browser';
import { getCloudUrlsFromContext } from '../../test-runner-context';
import { getProjectIdFromPageUrl, doCloudFetch } from './utils';

export async function getClusterConnectionStringsFromNames(
  browser: CompassBrowser,
  clusterNames: string[],
  dbuserUsername: string,
  dbuserPassword: string
): Promise<[string, string][]> {
  const { cloudUrl } = getCloudUrlsFromContext();
  const projectId = await getProjectIdFromPageUrl(browser, cloudUrl);
  const clusters = await doCloudFetch<
    { name: string; state: string; srvAddress: string }[]
  >(browser, `/nds/clusters/${projectId}`);
  return clusters
    .filter((cluster) => {
      return clusterNames.includes(cluster.name) && cluster.state === 'IDLE';
    })
    .map((cluster) => {
      const str = new ConnectionString(`mongodb+srv://${cluster.srvAddress}`);
      str.username = dbuserUsername;
      str.password = dbuserPassword;
      return [cluster.name, str.toString()];
    });
}

export async function configureDefaultProjectDbAccess(
  browser: CompassBrowser,
  dbuserUsername: string,
  dbuserPassword: string
) {
  const { cloudUrl } = getCloudUrlsFromContext();

  await browser.navigateTo(cloudUrl);
  await browser.waitUntil(async () => {
    return (await browser.getUrl()).startsWith(`${cloudUrl}/v2/`);
  });

  const projectId = await getProjectIdFromPageUrl(browser, cloudUrl);

  const { currentIpv4Address } = await doCloudFetch(browser, '/v2/params');

  await doCloudFetch(
    browser,
    `/nds/${projectId}/ipWhitelist/addPermissions`,
    { method: 'PUT' },
    {
      json: [
        {
          expirationInterval: { text: 'permanent' },
          value: currentIpv4Address,
          comment: 'Test runner machine current IP',
          isEditable: true,
          deleteAfterHours: 2,
        },
      ],
    }
  );

  await doCloudFetch(
    browser,
    `/nds/${projectId}/users`,
    { method: 'POST' },
    {
      json: {
        user: dbuserUsername,
        db: 'admin',
        password: dbuserPassword,
        roles: [{ role: 'atlasAdmin', db: 'admin', collection: null }],
        scopes: [],
        isEditable: true,
        ldapAuthType: 'NONE',
        x509Type: 'NONE',
        awsIAMType: 'NONE',
        oidcAuthType: 'NONE',
        hasUserToDNMapping: false,
        expirationInterval: { text: 'permanent' },
        deleteAfterHours: 2,
      },
    }
  );
}

const clusterTypeToTemplate = {
  Free: 'm0',
  Flex: 'flex',
  Dedicated: 'replicaSetM10',
  GeoSharded: 'geoSharded3Zone',
} as const;

export async function createAtlasClusterForDefaultProject(
  browser: CompassBrowser,
  dbuserUsername: string,
  dbuserPassword: string,
  clusterName: string,
  clusterType: keyof typeof clusterTypeToTemplate = 'Free'
): Promise<string> {
  const { cloudUrl } = getCloudUrlsFromContext();

  await browser.navigateTo(cloudUrl);
  await browser.waitUntil(async () => {
    return (await browser.getUrl()).startsWith(`${cloudUrl}/v2/`);
  });

  const projectId = await getProjectIdFromPageUrl(browser, cloudUrl);

  /**
   * Get a cluster description template for the cluster creation and start
   * creating a cluster
   */
  const clusterTemplateUrl = new URL(
    `/nds/clusters/${projectId}/template/${clusterTypeToTemplate[clusterType]}`,
    cloudUrl
  );
  clusterTemplateUrl.searchParams.append('clusterName', clusterName);
  clusterTemplateUrl.searchParams.append('cloudProvider', 'AWS');
  clusterTemplateUrl.searchParams.append('regionKey', 'US_EAST_1');

  const clusterDescription = await doCloudFetch(
    browser,
    clusterTemplateUrl.toString()
  );

  // Geosharded is a bit of a special case: the template is useful to generate
  // most of the template, but we don't need as much resources as the template
  // provides
  if (clusterType === 'GeoSharded') {
    clusterDescription.replicationSpecList = [
      {
        ...clusterDescription.replicationSpecList[0],
        regionConfigs: [
          {
            ...clusterDescription.replicationSpecList[0].regionConfigs[0],
            // Copied from the backend response when creating a bare bones
            // geoshareded cluster
            analyticsAutoScaling: {
              autoIndex: { enabled: false },
              compute: {
                enabled: false,
                maxInstanceSize: null,
                minInstanceSize: null,
                scaleDownEnabled: false,
              },
              diskGB: { enabled: false },
            },
            analyticsSpecs: {
              diskIOPS: 3000,
              diskThroughput: 125,
              encryptEBSVolume: true,
              instanceSize: 'M10',
              nodeCount: 0,
              preferredCpuArchitecture: 'arm64',
              volumeType: 'gp3',
            },
            autoScaling: {
              autoIndex: { enabled: false },
              compute: {
                enabled: false,
                maxInstanceSize: null,
                minInstanceSize: null,
                scaleDownEnabled: false,
              },
              diskGB: { enabled: false },
            },
            cloudProvider: 'AWS',
            customerProvidedAnalyticsSpecs: {
              cloudProvider: 'AWS',
              diskIOPS: 3000,
              instanceSize: 'M10',
              nodeCount: 0,
              volumeType: 'STANDARD',
            },
            customerProvidedElectableSpecs: {
              cloudProvider: 'AWS',
              diskIOPS: 3000,
              instanceSize: 'M10',
              nodeCount: 3,
              volumeType: 'STANDARD',
            },
            customerProvidedReadOnlySpecs: {
              cloudProvider: 'AWS',
              diskIOPS: 3000,
              instanceSize: 'M10',
              nodeCount: 0,
              volumeType: 'STANDARD',
            },
            electableSpecs: {
              diskIOPS: 3000,
              diskThroughput: 125,
              encryptEBSVolume: true,
              instanceSize: 'M10',
              nodeCount: 3,
              preferredCpuArchitecture: 'arm64',
              volumeType: 'gp3',
            },
            priority: 7,
            readOnlySpecs: {
              diskIOPS: 3000,
              diskThroughput: 125,
              encryptEBSVolume: true,
              instanceSize: 'M10',
              nodeCount: 0,
              preferredCpuArchitecture: 'arm64',
              volumeType: 'gp3',
            },
          },
        ],
      },
    ];
  }

  // Delete test cluster after 2 hours: this is more than twice as long as our
  // test suite is running, so gives ample time before auto teardown starts
  clusterDescription.deleteAfterDate = new Date(
    Date.now() + 1000 * 60 * 60 * 2
  ).toISOString();

  await doCloudFetch(
    browser,
    `/nds/clusters/${projectId}`,
    { method: 'POST' },
    { json: clusterDescription }
  );

  // Now wait for cluster to be ready
  const cluster = await browser.waitUntil(
    async () => {
      const clusters = await doCloudFetch<
        { name: string; state: string; srvAddress: string }[]
      >(browser, `/nds/clusters/${projectId}`);
      return clusters.find((cluster) => {
        return cluster.name === clusterName && cluster.state === 'IDLE';
      });
    },
    {
      timeout: 1000 * 60 * 30, // cluster creation is a very slow process sometimes
      interval: 30 * 1000, // no need to check very often
    }
  );

  if (!cluster?.srvAddress) {
    throw new Error(
      'Cluster is ready, but srv connection string is not available'
    );
  }

  const str = new ConnectionString(`mongodb+srv://${cluster.srvAddress}`);
  str.username = dbuserUsername;
  str.password = dbuserPassword;

  return str.toString();
}

export async function deleteAtlasClusterForDefaultProject(
  browser: CompassBrowser,
  cloudUrl: string,
  clusterName: string
) {
  const projectId = await getProjectIdFromPageUrl(browser, cloudUrl);
  await doCloudFetch(browser, `/nds/clusters/${projectId}/${clusterName}`, {
    method: 'DELETE',
  });
}
