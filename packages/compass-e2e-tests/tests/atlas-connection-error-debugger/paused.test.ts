import type { CompassBrowser } from '../../helpers/compass-browser.ts';
import { cleanup, screenshotIfFailed } from '../../helpers/compass.ts';
import type { Compass } from '../../helpers/compass.ts';
import {
  getAtlasCloudEnvironmentFromContext,
  isTestingDesktopWithAtlasCloud,
} from '../../helpers/test-runner-context.ts';
import {
  createAtlasCloudSession,
  createTestProject,
} from '../../helpers/test-with-atlas-cloud.ts';
import {
  expectDebuggerToReport,
  initCompassWithDebugger,
  PROVISIONING_TIMEOUT,
} from './shared.ts';

// Only M10+ clusters can be paused, which makes this test slow and expensive
// to set up, so in CI it runs in a separate daily task
describe('Atlas connection error debugger: paused cluster', function () {
  let compass: Compass;
  let session: CompassBrowser | undefined;
  let connectionString: string;

  before(async function () {
    if (!isTestingDesktopWithAtlasCloud()) {
      return this.skip();
    }
    this.timeout(PROVISIONING_TIMEOUT);

    const env = getAtlasCloudEnvironmentFromContext();
    session = await createAtlasCloudSession();
    const projectId = await createTestProject(session, 'paused');

    connectionString = await session.createAtlasCluster({
      env,
      projectId,
      clusterName: 'paused',
      clusterType: 'Dedicated',
    });
    await session.pauseAtlasCluster({ env, projectId, clusterName: 'paused' });
  });

  after(async function () {
    await session?.deleteSession().catch(() => {});
  });

  beforeEach(async function () {
    compass = await initCompassWithDebugger(this.test?.fullTitle());
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    if (compass) {
      await cleanup(compass);
    }
  });

  it('reports that the cluster is paused', async function () {
    await expectDebuggerToReport(compass.browser, connectionString, 'PAUSED');
  });
});
