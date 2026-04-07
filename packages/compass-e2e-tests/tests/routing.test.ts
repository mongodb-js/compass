import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import { cleanup, init, screenshotIfFailed } from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';
import { createNumbersCollection } from '../helpers/mongo-clients';
import {
  getDefaultConnectionNames,
  isTestingDesktop,
} from '../helpers/test-runner-context';

describe('routing', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    if (isTestingDesktop()) {
      this.skip();
    }
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await createNumbersCollection();
    await browser.connectToDefaults();
  });

  after(async function () {
    await cleanup(compass);
  });

  afterEach(async function () {
    await browser.closeWorkspaceTabs();
    await browser.disconnectAll();
    await screenshotIfFailed(compass, this.currentTest);
  });

  async function getCurrentUrl() {
    return new URL(await browser.getUrl());
  }

  describe('when navigating inside compass-web', function () {
    it('changes url according to the current active tab', async function () {
      expect((await getCurrentUrl()).hash).to.match(/^#\/explorer\/?$/);

      await browser.navigateToDatabaseCollectionsTab(
        getDefaultConnectionNames(0),
        'test'
      );
      expect((await getCurrentUrl()).hash).to.match(/^#\/explorer\/.+?\/test$/);

      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers'
      );
      expect((await getCurrentUrl()).hash).to.match(
        /^#\/explorer\/.+?\/test\/numbers\/find$/
      );

      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Aggregations'
      );
      expect((await getCurrentUrl()).hash).to.match(
        /^#\/explorer\/.+?\/test\/numbers\/aggregation$/
      );

      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Schema'
      );
      expect((await getCurrentUrl()).hash).to.match(
        /^#\/explorer\/.+?\/test\/numbers\/schema$/
      );

      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Indexes'
      );
      expect((await getCurrentUrl()).hash).to.match(
        /^#\/explorer\/.+?\/test\/numbers\/indexes$/
      );

      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'test',
        'numbers',
        'Validation'
      );
      expect((await getCurrentUrl()).hash).to.match(
        /^#\/explorer\/.+?\/test\/numbers\/validation$/
      );

      await browser.closeWorkspaceTabs();

      expect((await getCurrentUrl()).hash).to.match(/^#\/explorer\/?$/);
    });
  });
});
