import type { Compass } from '../../helpers/compass';
import { cleanup, init, screenshotIfFailed } from '../../helpers/compass';
import type { CompassBrowser } from '../../helpers/compass-browser';
import {
  context,
  assertTestingAtlasCloud,
  isTestingAtlasCloud,
} from '../../helpers/test-runner-context';

describe('Error states', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    if (!isTestingAtlasCloud()) {
      this.skip();
    }
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  it('should show error state if fetching connection info failed initially', async function () {
    compass = await init(this.test?.fullTitle(), {
      async onBeforeNavigate(browser) {
        assertTestingAtlasCloud(context);
        const mock = await browser.mock(
          `/explorer/v1/groups/${context.atlasCloudProjectId}/clusters/connectionInfo`
        );
        mock.respondOnce('Failed to fetch', { statusCode: 500 });
      },
    });

    await compass.browser
      .$('*=An error occured while querying your MongoDB deployment')
      .waitForDisplayed();
  });
});
