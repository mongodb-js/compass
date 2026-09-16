import { expect } from 'chai';
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

describe.only('Atlas connection error debugger: network access', function () {
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
    const projectId = await createTestProject(user, 'network-access');

    // The test runner IP is deliberately not added to the access list: a new
    // project starts with an empty one and we need it to stay that way
    expect(
      await user.session.getProjectAccessList({ env, projectId })
    ).to.be.empty;

    connectionString = await user.session.createAtlasCluster({
      env,
      projectId,
      clusterName: 'network-access',
      clusterType: 'Free',
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

  it('reports ip access not allowed', async function () {
    await expectDebuggerToReport(
      compass.browser,
      user!,
      connectionString,
      'Client IP Not Allowed'
    );
  });
});
