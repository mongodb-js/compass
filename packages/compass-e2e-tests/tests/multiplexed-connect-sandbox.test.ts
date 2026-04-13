import { expect } from 'chai';
import type { Compass } from '../helpers/compass.ts';
import { cleanup, init, screenshotIfFailed } from '../helpers/compass.ts';
import {
  getDefaultConnectionNames,
  isTestingWeb,
} from '../helpers/test-runner-context.ts';
import type { CompassBrowser } from '../helpers/compass-browser.ts';
import { createNumbersCollection } from '../helpers/mongo-clients.ts';

describe('Multiplex WebSocket connection using sandbox', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(function () {
    if (!isTestingWeb()) {
      // This test is only relevant when running compass-web in a local sandbox
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
          const kMultiplexTransport = Symbol.for(
            '@compass-web-sandbox-multiplex-transport'
          );
          const getTransport = (globalThis as any)[kMultiplexTransport];
          return !!getTransport?.();
        });
      },
      { timeoutMsg: 'Expected MultiplexWebSocketTransport to be created' }
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
    await browser.navigateToCollectionTab(
      getDefaultConnectionNames(0),
      'test',
      'numbers',
      'Documents'
    );

    const actualWsUrl = await browser.execute(() => {
      const kMux = Symbol.for('@compass-web-sandbox-multiplex-transport');
      const getTransport = (globalThis as any)[kMux];
      return getTransport?.()?.url ?? null;
    });

    // Assert that it connects to the correct (current) ws proxy
    expect(actualWsUrl).to.equal('ws://localhost:1338');
  });
});
