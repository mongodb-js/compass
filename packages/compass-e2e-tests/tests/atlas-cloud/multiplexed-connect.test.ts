import { expect } from 'chai';
import type { Compass } from '../../helpers/compass.ts';
import { cleanup, init, screenshotIfFailed } from '../../helpers/compass.ts';
import {
  context,
  getDefaultConnectionNames,
  getCloudUrlsFromContext,
  isTestingWebAtlasCloud,
} from '../../helpers/test-runner-context.ts';
import type { CompassBrowser } from '../../helpers/compass-browser.ts';
import { createNumbersCollection } from '../../helpers/mongo-clients.ts';

describe('Multiplex WebSocket connection', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    if (!isTestingWebAtlasCloud()) {
      this.skip();
    }
  });

  beforeEach(async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    await browser.setFeature('enableMultiplexWebSocketOnWeb', true);

    await browser.waitUntil(
      () => {
        return browser.execute(() => {
          const kMultiplexLink = Symbol.for(
            '@compass-web-sandbox-multiplex-link'
          );
          const getLink = (globalThis as any)[kMultiplexLink];
          return !!getLink?.();
        });
      },
      { timeoutMsg: 'Expected MultiplexWebLink to be created' }
    );

    await browser.setupDefaultConnections();
    await createNumbersCollection();
    await browser.connectToDefaults();
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
    await cleanup(compass);
  });

  it('establishes a WebSocket connection to the correct CCS endpoint', async function () {
    const { cloudUrl } = getCloudUrlsFromContext();
    const expectedWsUrl = `${cloudUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')}/ccs/${context.atlasCloudProjectId}`;

    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
      'test',
      'numbers',
      'Documents'
    );

    const actualWsUrl = await browser.execute(() => {
      const kMux = Symbol.for('@compass-web-sandbox-multiplex-link');
      const getLink = (globalThis as any)[kMux];
      return getLink?.()?.url ?? null;
    });

    expect(actualWsUrl).to.equal(expectedWsUrl);
  });
});
