import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
} from '../helpers/compass';
import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import type { CompassBrowser } from '../helpers/compass-browser';
import type { Server as HTTPServer, IncomingMessage } from 'http';
import { createServer as createHTTPServer } from 'http';
import type { AddressInfo, Server, Socket } from 'net';
import { once } from 'events';
import { setupProxyServer } from '../helpers/proxy';
import * as Selectors from '../helpers/selectors';

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

  context('when connecting to a cluster', function () {
    let connectRequests: IncomingMessage[];
    let connections: Socket[];

    beforeEach(async function () {
      compass = await init(this.test?.fullTitle());
      browser = compass.browser;

      await browser.setFeature('proxy', '');
      await browser.setFeature('enableProxySupport', true);
      httpProxyServer1.removeAllListeners('request');
      ({ connectRequests, connections } = setupProxyServer(httpProxyServer1));
    });

    afterEach(async function () {
      await browser?.setFeature('proxy', '');
      for (const conn of connections) {
        if (!conn.destroyed) conn.destroy();
      }
    });

    it('can proxy MongoDB traffic through a proxy', async function () {
      await browser.openSettingsModal('proxy');
      await browser.clickParent(Selectors.ProxyCustomButton);
      await browser.setValueVisible(
        Selectors.ProxyUrl,
        `http://localhost:${(httpProxyServer1.address() as AddressInfo).port}`
      );
      await browser.clickVisible(Selectors.SaveSettingsButton);

      const hostport = '127.0.0.1:27091';
      const connectionName = this.test?.fullTitle() ?? '';
      await browser.connectWithConnectionForm({
        hosts: [hostport],
        connectionName,
        proxyMethod: 'app-proxy',
      });

      expect(connectRequests.map((c) => c.url)).to.include(hostport);
    });
  });
});
