import type { Compass } from '../../helpers/compass.ts';
import { cleanup, init, screenshotIfFailed } from '../../helpers/compass.ts';
import {
  context,
  assertTestingWebAtlasCloud,
  isTestingWebAtlasCloud,
} from '../../helpers/test-runner-context.ts';
import { disableBrowserCache } from '../../helpers/commands/atlas-cloud/utils.ts';

describe('Error states', function () {
  let compass: Compass;

  before(function () {
    if (!isTestingWebAtlasCloud()) {
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
        assertTestingWebAtlasCloud(context);
        const mock = await browser.mock(
          `/explorer/v1/groups/${context.atlasCloudProjectId}/clusters/connectionInfo`
        );
        mock.respondOnce('Failed to fetch', { statusCode: 500 });
      },
    });

    await compass.browser
      .$('*=An error occurred while querying your MongoDB deployment')
      .waitForDisplayed();
  });

  it('should show error state if fetching preferences failed initially', async function () {
    compass = await init(this.test?.fullTitle(), {
      skipSharedConfigOnStart: true,
      async onBeforeNavigate(browser) {
        assertTestingWebAtlasCloud(context);
        // Preferences API has a cache-control header that allows caching for 30sec currently,
        // so ensuring that the cache is cleared.
        await disableBrowserCache(browser);
        const mock = await browser.mock(
          `/explorer/v1/groups/${context.atlasCloudProjectId}/preferences`
        );
        mock.respond('Failed to fetch preferences', { statusCode: 500 });
      },
    });

    await compass.browser
      .$('*=Error Occurred')
      .waitForDisplayed({ timeout: 30000 });
  });
});
