// @ts-check
const express = require('express');
const proxyMiddleware = require('express-http-proxy');
const { once } = require('events');
const { app: electronApp, BrowserWindow, session, shell } = require('electron');

const proxyWebServer = express();

const PROXY_PORT = process.env.COMPASS_WEB_HTTP_PROXY_PORT
  ? Number(process.env.COMPASS_WEB_HTTP_PROXY_PORT)
  : 8080;

const WEBPACK_DEV_SERVER_PORT = process.env
  .COMPASS_WEB_HTTP_WEBPACK_DEV_SERVER_PORT
  ? Number(process.env.COMPASS_WEB_HTTP_WEBPACK_DEV_SERVER_PORT)
  : 8081;

const CLOUD_CONFIG_VARIANTS = {
  dev: {
    cloudHost: 'cloud-dev.mongodb.com',
    accountPortalHost: 'account-dev.mongodb.com',
  },
  qa: {
    cloudHost: 'cloud-qa.mongodb.com',
    accountPortalHost: 'account-qa.mongodb.com',
  },
  prod: {
    cloudHost: 'cloud.mongodb.com',
    accountPortalHost: 'account.mongodb.com',
  },
};

const CLOUD_CONFIG = process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG ?? 'dev';

const CLOUD_HOST = CLOUD_CONFIG_VARIANTS[CLOUD_CONFIG].cloudHost;

const CLOUD_ACCOUNT_HOST =
  CLOUD_CONFIG_VARIANTS[CLOUD_CONFIG].accountPortalHost;

class AtlasCloudAuthenticator {
  /** @type {Promise<{ groupId: string; }> | null} */
  static #authenticatePromise = null;

  /**
   * @returns {Promise<string[]>}
   */
  static async getCloudSessionCookies() {
    const cloudHostCookies = await session.defaultSession.cookies.get({
      domain: CLOUD_HOST,
    });
    return cloudHostCookies.map((cookie) => {
      return `${cookie.name}=${cookie.value}`;
    });
  }

  /**
   * @returns {Promise<{ groupId: string; }>}
   */
  static async authenticate() {
    this.#authenticatePromise ??= (async () => {
      await electronApp.whenReady();
      const bw = new BrowserWindow({
        height: 800,
        width: 400,
        resizable: false,
        fullscreenable: false,
      });
      const abortController = new AbortController();
      const authInfoPromise = Promise.race([
        new Promise((resolve, reject) => {
          /**
           * @param {{ redirectURL: string }} details
           */
          async function waitForAuthentication({ redirectURL }) {
            try {
              if (!redirectURL.startsWith(`https://${CLOUD_HOST}/v2/`)) {
                return;
              }
              const groupId = new URL(redirectURL).pathname.replace('/v2/', '');
              resolve({ groupId });
            } catch (err) {
              reject(err);
            }
          }
          bw.webContents.session.webRequest.onBeforeRedirect(
            { urls: ['*://*/*'] },
            waitForAuthentication
          );
        }).finally(() => {
          queueMicrotask(() => {
            abortController.abort();
            electronApp.dock.hide();
            bw.close();
          });
        }),
        once(bw, 'close', { signal: abortController.signal }).then(() => {
          throw new Error('Window closed before finished signing in');
        }),
      ]);
      electronApp.dock.show();
      void bw.loadURL(`https://${CLOUD_ACCOUNT_HOST}/account/login`);
      return authInfoPromise;
    })();
    return this.#authenticatePromise;
  }
}

// Proxy endpoint that triggers the sign in flow through configured cloud
// environment
proxyWebServer.use('/authenticate', async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 400;
    res.end();
    return;
  }

  try {
    const { groupId } = await AtlasCloudAuthenticator.authenticate();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ groupId }));
  } catch (err) {
    res.statusCode = 500;
    res.send(err.stack);
    res.end();
  }
});

// Prefixed proxy to the cloud backend
proxyWebServer.use(
  '/cloud-mongodb-com',
  proxyMiddleware(`https://${CLOUD_HOST}`, {
    async proxyReqOptDecorator(req) {
      req.headers ??= {};
      req.headers['host'] = CLOUD_HOST;
      req.headers['origin'] = `https://${CLOUD_HOST}`;
      req.headers['cookie'] =
        await AtlasCloudAuthenticator.getCloudSessionCookies();
      return req;
    },
  })
);

// Everything else is proxied directly to webpack-dev-server
proxyWebServer.use(
  proxyMiddleware(`http://localhost:${WEBPACK_DEV_SERVER_PORT}`)
);

proxyWebServer.listen(PROXY_PORT, 'localhost');

electronApp.dock.hide();

electronApp.on('window-all-closed', () => {
  // We want proxy to keep running even when all the windows are closed
});

electronApp.whenReady().then(() => {
  if (process.env.OPEN_BROWSER !== 'false') {
    shell.openExternal(`http://localhost:${PROXY_PORT}`);
  }
});
