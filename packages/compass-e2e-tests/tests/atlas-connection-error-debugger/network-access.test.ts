import { expect } from 'chai';
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

describe.only('Atlas connection error debugger: network access', function () {
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
    const projectId = await createTestProject(session, 'network-access');

    // The test runner IP is deliberately not added to the access list: a new
    // project starts with an empty one and we need it to stay that way
    expect(await session.getProjectAccessList({ env, projectId })).to.be.empty;

    connectionString = await session.createAtlasCluster({
      env,
      projectId,
      clusterName: 'network-access',
      clusterType: 'Free',
    });
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

  it('reports ip access not allowed', async function () {
    await expectDebuggerToReport(
      compass.browser,
      connectionString,
      'Client IP Not Allowed'
    );
  });
});
