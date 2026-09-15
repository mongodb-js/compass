import { ConnectionString } from 'mongodb-connection-string-url';
import Debug from 'debug';
import type { CompassBrowser } from '../../compass-browser.ts';
import { getCloudUrlsForEnvironment } from '../../test-runner-context.ts';
import type { AtlasEnvironment } from '../../test-runner-context.ts';
import {
  getProjectIdFromPageUrl,
  doCloudFetch,
  isAtlasCloudPage,
} from './utils.ts';

const debug = Debug('compass-e2e-tests:atlas-cloud');

type AtlasProject = { env: AtlasEnvironment; projectId: string };

type AtlasClusterListItem = {
  name: string;
  state: string;
  srvAddress: string;
  isPaused?: boolean;
};

async function navigateToProject(
  browser: CompassBrowser,
  { env, projectId }: AtlasProject
) {
  const { cloudUrl } = getCloudUrlsForEnvironment(env);
  await browser.navigateTo(`${cloudUrl}/v2/${projectId}#/clusters`);
  await browser.waitUntil(() => isAtlasCloudPage(browser, cloudUrl, projectId));
}

export async function getClusterConnectionStringsFromNames(
  browser: CompassBrowser,
  clusterNames: string[],
  dbuserUsername: string,
  dbuserPassword: string,
  env: AtlasEnvironment,
  projectId?: string
): Promise<[string, string][]> {
  const { cloudUrl } = getCloudUrlsForEnvironment(env);
  const clusters = await doCloudFetch<
    { name: string; state: string; srvAddress: string }[]
  >(
    browser,
    `/nds/clusters/${
      projectId ?? (await getProjectIdFromPageUrl(browser, cloudUrl))
    }`
  );
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

export async function getProjectAccessList(
  browser: CompassBrowser,
  project: AtlasProject
): Promise<{ value: string; comment: string }[]> {
  await navigateToProject(browser, project);
  return await doCloudFetch(browser, `/nds/${project.projectId}/ipWhitelist`);
}

export async function configureProjectDbAccess(
  browser: CompassBrowser,
  {
    env,
    projectId,
    dbuserUsername,
    dbuserPassword,
  }: AtlasProject & { dbuserUsername: string; dbuserPassword: string }
) {
  await navigateToProject(browser, { env, projectId });

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

export type ClusterTypes = keyof typeof clusterTypeToTemplate;

/**
 * Creates a cluster and waits for it to be ready. Returns the srv connection
 * string without credentials.
 */
export async function createAtlasCluster(
  browser: CompassBrowser,
  {
    env,
    projectId,
    clusterName,
    clusterType = 'Free',
  }: AtlasProject & { clusterName: string; clusterType?: ClusterTypes }
): Promise<string> {
  const { cloudUrl } = getCloudUrlsForEnvironment(env);

  await navigateToProject(browser, { env, projectId });

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

  const cluster = await waitForCluster(
    browser,
    projectId,
    clusterName,
    (cluster) => cluster.state === 'IDLE',
    'ready'
  );

  if (!cluster.srvAddress) {
    throw new Error(
      'Cluster is ready, but srv connection string is not available'
    );
  }

  return `mongodb+srv://${cluster.srvAddress}`;
}

async function waitForCluster(
  browser: CompassBrowser,
  projectId: string,
  clusterName: string,
  predicate: (cluster: AtlasClusterListItem) => boolean,
  waitingFor: string
): Promise<AtlasClusterListItem> {
  return await browser.waitUntil(
    async () => {
      const clusters = await doCloudFetch<AtlasClusterListItem[]>(
        browser,
        `/nds/clusters/${projectId}`
      );
      const cluster = clusters.find((cluster) => cluster.name === clusterName);
      // Keeps CI output flowing: Evergreen kills tasks idle for 10 minutes and
      // dedicated clusters take about that long to provision
      debug(
        'Waiting for cluster %s to be %s (state: %s, isPaused: %s)',
        clusterName,
        waitingFor,
        cluster?.state,
        cluster?.isPaused
      );
      return cluster && predicate(cluster) ? cluster : undefined;
    },
    {
      timeout: 1000 * 60 * 30, // cluster provisioning is a very slow process sometimes
      interval: 30 * 1000, // no need to check very often
    }
  );
}

/**
 * Pauses a cluster (M10+ only) and waits until the pause has been applied
 */
export async function pauseAtlasCluster(
  browser: CompassBrowser,
  { env, projectId, clusterName }: AtlasProject & { clusterName: string }
) {
  await navigateToProject(browser, { env, projectId });

  // Same as the Atlas UI: there is no dedicated pause route, isPaused is part
  // of the cluster description
  const clusterDescription = await doCloudFetch(
    browser,
    `/nds/clusters/${projectId}/${clusterName}`
  );
  await doCloudFetch(
    browser,
    `/nds/clusters/${projectId}/${clusterName}`,
    { method: 'PATCH' },
    { json: { ...clusterDescription, isPaused: true } }
  );

  // isPaused flips immediately, the cluster leaves IDLE while the plan is
  // being applied and comes back to IDLE when the pause is done
  await browser
    .waitUntil(
      async () => {
        const clusters = await doCloudFetch<AtlasClusterListItem[]>(
          browser,
          `/nds/clusters/${projectId}`
        );
        return clusters.some(
          (cluster) => cluster.name === clusterName && cluster.state !== 'IDLE'
        );
      },
      { timeout: 1000 * 60 * 2, interval: 5 * 1000 }
    )
    // ponytail: if the planner picked the change up between polls we never see
    // the non-IDLE state; fall through and rely on the paused + IDLE check
    .catch(() => {});

  await waitForCluster(
    browser,
    projectId,
    clusterName,
    (cluster) => cluster.isPaused === true && cluster.state === 'IDLE',
    'paused'
  );
}
