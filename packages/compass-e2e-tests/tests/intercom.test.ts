import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { expect } from 'chai';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';

const INTEGRATIONS_PATH = '/api/v2/integrations';

async function startIntegrationsServer(
  integrations: unknown
): Promise<Server> {
  const server = createServer((req, res) => {
    if (req.url === INTEGRATIONS_PATH) {
      res.writeHead(200, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      });
      res.end(JSON.stringify(integrations));
      return;
    }
    res.writeHead(204);
    res.end();
  }).listen(0);
  await once(server, 'listening');
  return server;
}

describe('Intercom integration', function () {
  let compass: Compass | undefined;
  let server: Server | undefined;

  before(function () {
    skipForWeb(this, 'not available in compass-web yet');
  });

  afterEach(async function () {
    if (compass) {
      await screenshotIfFailed(compass, this.currentTest);
    }
    await cleanup(compass);
    compass = undefined;

    delete process.env.HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE;
    server?.close();
    server = undefined;
  });

  function skipWithoutIntercomAppId(
    context: Mocha.Context,
    isIntercomAvailable: boolean
  ) {
    // Intercom is not configured for local builds, but always is in CI
    if (!isIntercomAvailable && !(process.env.ci || process.env.CI)) {
      context.skip();
    }
  }

  it('loads the Intercom script when the integrations endpoint enables it', async function () {
    server = await startIntegrationsServer({ intercom: true });
    process.env.HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE = `http://localhost:${
      (server.address() as AddressInfo).port
    }`;

    compass = await init(this.test?.fullTitle());

    skipWithoutIntercomAppId(
      this,
      await compass.browser.execute(
        () => !!process.env.HADRON_METRICS_INTERCOM_APP_ID
      )
    );

    await compass.browser.waitUntil(
      () =>
        compass!.browser.execute(
          // eslint-disable-next-line no-restricted-globals
          () => 'Intercom' in window && typeof window.Intercom === 'function'
        ),
      {
        timeoutMsg:
          'Expected Intercom SDK to load and be available in the global scope',
      }
    );
  });

  it('does not load the Intercom script when the integrations endpoint disables it', async function () {
    server = await startIntegrationsServer({ intercom: false });
    process.env.HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE = `http://localhost:${
      (server.address() as AddressInfo).port
    }`;

    compass = await init(this.test?.fullTitle());

    skipWithoutIntercomAppId(
      this,
      await compass.browser.execute(
        () => !!process.env.HADRON_METRICS_INTERCOM_APP_ID
      )
    );

    await compass.browser.pause(2000);

    expect(
      await compass.browser.execute(
        // eslint-disable-next-line no-restricted-globals
        () => 'Intercom' in window
      )
    ).to.equal(false);
  });

  it('gets a boolean from the real integrations endpoint', async function () {
    compass = await init(this.test?.fullTitle());

    const result = await compass.browser.execute(async (path) => {
      const response = await fetch(
        `${process.env.HADRON_AUTO_UPDATE_ENDPOINT}${path}`
      );
      return { ok: response.ok, body: await response.json() };
    }, INTEGRATIONS_PATH);

    expect(result.ok).to.equal(true);
    expect(result.body.intercom).to.be.a('boolean');
  });
});
