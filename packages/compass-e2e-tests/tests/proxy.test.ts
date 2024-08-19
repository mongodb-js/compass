import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
} from '../helpers/compass';
import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';
import type { Server as HTTPServer } from 'http';
import { createServer as createHTTPServer } from 'http';
import type { AddressInfo, Server } from 'net';
import { once } from 'events';

async function listen(srv: Server): Promise<void> {
  srv.listen(0);
  await once(srv, 'listening');
}
async function close(srv?: Server): Promise<void> {
  if (!srv) return;
  srv.close();
  await once(srv, 'close');
}
function port(srv: Server): number {
  return (srv.address() as AddressInfo).port;
}

describe('Proxy support', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  let httpProxyServer1: HTTPServer;
  let httpProxyServer2: HTTPServer;

  before(function () {
    skipForWeb(this, 'proxy support not available on compass-web');
  });

  beforeEach(async function () {
    httpProxyServer1 = createHTTPServer((req, res) =>
      res.end(`hello, ${req.url} (proxy1)`)
    );
    httpProxyServer2 = createHTTPServer((req, res) =>
      res.end(`hello, ${req.url} (proxy2)`)
    );
    await Promise.all([listen(httpProxyServer1), listen(httpProxyServer2)]);
  });

  afterEach(async function () {
    await Promise.all([close(httpProxyServer1), close(httpProxyServer2)]);

    if (compass) {
      await screenshotIfFailed(compass, this.currentTest);
      await browser.setFeature('proxy', '');
      await cleanup(compass);
    }
  });

  it('uses a proxy set up at application start', async function () {
    compass = await init(this.test?.fullTitle(), {
      extraSpawnArgs: [`--proxy=http://localhost:${port(httpProxyServer1)}`],
    });
    browser = compass.browser;

    const result = await browser.execute(async function () {
      const response = await fetch('http://compass.mongodb.com/');
      return await response.text();
    });
    expect(result).to.equal('hello, http://compass.mongodb.com/ (proxy1)');
  });

  it('can change the proxy option dynamically', async function () {
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;

    await browser.setFeature(
      'proxy',
      `http://localhost:${port(httpProxyServer2)}`
    );
    const result = await browser.execute(async function () {
      const response = await fetch('http://compass.mongodb.com/');
      return await response.text();
    });
    expect(result).to.equal('hello, http://compass.mongodb.com/ (proxy2)');
  });
});
