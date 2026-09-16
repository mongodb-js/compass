import { cleanup, screenshotIfFailed } from '../../helpers/compass.ts';
import type { Compass } from '../../helpers/compass.ts';
import {
  getAtlasCloudEnvironmentFromContext,
  isTestingDesktopWithAtlasCloud,
} from '../../helpers/test-runner-context.ts';
import {
  createAtlasCloudTestUser,
  createTestProject,
  deleteAtlasCloudTestUser,
} from '../../helpers/test-with-atlas-cloud.ts';
import type { AtlasCloudTestUser } from '../../helpers/test-with-atlas-cloud.ts';
import {
  expectDebuggerToReport,
  initCompassWithDebugger,
  PROVISIONING_TIMEOUT,
} from './shared.ts';

// Only M10+ clusters can be paused, which makes this test slow and expensive
// to set up, so in CI it runs in a separate daily task
describe('Atlas connection error debugger: paused cluster', function () {
  let compass: Compass;
  let user: AtlasCloudTestUser | undefined;
  let connectionString: string;

  before(async function () {
    if (!isTestingDesktopWithAtlasCloud()) {
      return this.skip();
    }
    this.timeout(PROVISIONING_TIMEOUT);

    const env = getAtlasCloudEnvironmentFromContext();
    user = await createAtlasCloudTestUser();
    const projectId = await createTestProject(user, 'paused');

    connectionString = await user.session.createAtlasCluster({
      env,
      projectId,
      clusterName: 'paused',
      clusterType: 'Dedicated',
    });
    await user.session.pauseAtlasCluster({
      env,
      projectId,
      clusterName: 'paused',
    });
  });

  after(async function () {
    if (user) {
      await deleteAtlasCloudTestUser(user);
    }
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
    await expectDebuggerToReport(
      compass.browser,
      user!,
      connectionString,
      'PAUSED'
    );
  });
});
