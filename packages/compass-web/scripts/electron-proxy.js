'use strict';
// @ts-check
const express = require('express');
const proxyMiddleware = require('express-http-proxy');
const { once } = require('events');
const { app: electronApp, BrowserWindow, session, shell } = require('electron');

const proxyWebServer = express();

const PROXY_PORT = process.env.COMPASS_WEB_HTTP_PROXY_PORT
  ? Number(process.env.COMPASS_WEB_HTTP_PROXY_PORT)
  : 7777;

const WEBPACK_DEV_SERVER_PORT = process.env
  .COMPASS_WEB_HTTP_WEBPACK_DEV_SERVER_PORT
  ? Number(process.env.COMPASS_WEB_HTTP_WEBPACK_DEV_SERVER_PORT)
  : 4242;

const CLOUD_CONFIG_VARIANTS = {
  local: {
    protocol: 'http:',
    cloudHost: 'localhost:8080',
    accountPortalHost: 'localhost:8080',
  },
  dev: {
    protocol: 'https:',
    cloudHost: 'cloud-dev.mongodb.com',
    accountPortalHost: 'account-dev.mongodb.com',
  },
  qa: {
    protocol: 'https:',
    cloudHost: 'cloud-qa.mongodb.com',
    accountPortalHost: 'account-qa.mongodb.com',
  },
  prod: {
    protocol: 'https:',
    cloudHost: 'cloud.mongodb.com',
    accountPortalHost: 'account.mongodb.com',
  },
};

const CLOUD_CONFIG = process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG ?? 'dev';

const CLOUD_HOST = CLOUD_CONFIG_VARIANTS[CLOUD_CONFIG].cloudHost;

const CLOUD_ORIGIN = `${CLOUD_CONFIG_VARIANTS[CLOUD_CONFIG].protocol}//${CLOUD_HOST}`;

const TEST_DB_USER = `compass-web-test-user-x509`;

function isSignedOutRedirect(location) {
  if (location) {
    const redirectLocation = new URL(location, CLOUD_ORIGIN);
    if (
      redirectLocation.pathname.startsWith('/account/login') &&
      redirectLocation.searchParams.has('signedOut')
    ) {
      return true;
    }
  }
  return false;
}

/**
 *
 * @param {Response} res
 * @returns
 */
async function handleRes(res) {
  if (isSignedOutRedirect(res.headers.get('location'))) {
    res = new global.Response('Forbidden', {
      status: 403,
      statusText: 'Forbidden',
    });
  }
  const body = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    const err = Object.assign(new Error(`${res.statusText} [${res.status}]`), {
      name: 'NetworkError',
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers),
      body,
    });
    throw err;
  }
  return body;
}

class AtlasCloudAuthenticator {
  /** @type {Promise<{ projectId: string; }> | null} */
  #authenticatePromise = null;

  /**
   * @returns {Promise<string[]>}
   */
  async #getCloudSessionCookies() {
    const cloudHostCookies = await session.defaultSession.cookies.get({
      domain: CLOUD_CONFIG_VARIANTS === 'local' ? 'localhost' : 'mongodb.com',
    });
    return cloudHostCookies.map((cookie) => {
      return `${cookie.name}=${cookie.value}`;
    });
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  #getProjectIdFromUrl(url) {
    return new URL(url, 'http://localhost').pathname.replace('/v2/', '');
  }

  /**
   * @param {string} url
   * @returns {boolean}
   */
  #isAuthenticatedUrl(url) {
    return new URL(url, 'http://localhost').pathname.startsWith('/v2/');
  }

  async getCloudHeaders() {
    // Order is important, fetching project id can update the cookies
    const projectId = await this.fetchProjectId();
    const cookie = (await this.#getCloudSessionCookies()).join('; ');
    const { csrfToken, csrfTime } = await fetch(
      `${CLOUD_ORIGIN}/v2/${projectId}/params`,
      { headers: { cookie } }
    ).then(handleRes);
    return {
      cookie,
      host: CLOUD_HOST,
      origin: CLOUD_ORIGIN,
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...(csrfTime && { 'X-CSRF-Time': csrfTime }),
    };
  }

  /**
   * @returns {Promise<string | null>}
   */
  async fetchProjectId() {
    const cookie = (await this.#getCloudSessionCookies()).join('; ');
    const res = await fetch(CLOUD_ORIGIN, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { cookie },
    });

    const location = res.headers.get('location') ?? '';

    return this.#isAuthenticatedUrl(location)
      ? this.#getProjectIdFromUrl(location)
      : null;
  }

  /**
   * @returns {Promise<{ projectId: string; }>}
   */
  async authenticate() {
    return (this.#authenticatePromise ??= (async () => {
      try {
        await electronApp.whenReady();
        const projectId = await this.fetchProjectId();
        if (projectId) {
          return { projectId };
        }
        const bw = new BrowserWindow({
          height: 800,
          width: 600,
          resizable: false,
          fullscreenable: false,
        });
        const abortController = new AbortController();
        const authInfoPromise = Promise.race([
          new Promise((resolve, reject) => {
            /**
             * @param {{ redirectURL: string }} details
             */
            const waitForAuthentication = async ({ redirectURL }) => {
              try {
                if (!this.#isAuthenticatedUrl(redirectURL)) {
                  return;
                }
                const projectId = this.#getProjectIdFromUrl(redirectURL);
                resolve({ projectId });
              } catch (err) {
                reject(err);
              }
            };
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
        void bw.loadURL(`${CLOUD_ORIGIN}/account/login`);
        return authInfoPromise;
      } finally {
        this.#authenticatePromise = null;
      }
    })());
  }

  async logout() {
    await session.defaultSession.clearStorageData({ storages: ['cookies'] });
  }

  async #createTestDBUser(projectId) {
    return await fetch(
      `http://localhost:${PROXY_PORT}/cloud-mongodb-com/nds/${projectId}/users`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          awsIAMType: 'NONE',
          db: '$external',
          deleteAfterDate: null,
          hasScramSha256Auth: false,
          hasUserToDNMapping: false,
          isEditable: true,
          labels: [],
          ldapAuthType: 'NONE',
          oidcAuthType: 'NONE',
          roles: [{ collection: null, db: 'admin', role: 'atlasAdmin' }],
          scopes: [],
          user: `CN=${TEST_DB_USER}`,
          x509Type: 'MANAGED',
        }),
      }
    ).then(handleRes);
  }

  async #ensureTestDBUserExists(projectId) {
    const users = await fetch(
      `http://localhost:${PROXY_PORT}/cloud-mongodb-com/nds/${projectId}/users`
    ).then(handleRes);
    const testCertUser = users.find((user) => {
      return user.x509Type === 'MANAGED' && user.user === TEST_DB_USER;
    });
    return testCertUser ?? (await this.#createTestDBUser(projectId));
  }

  async getX509Cert() {
    const projectId = await this.fetchProjectId();
    const testUser = await this.#ensureTestDBUserExists(projectId);
    const certUsername = encodeURIComponent(
      `CN=${testUser.user.replace(/^cn=/i, '')}`
    );
    const certAuthDb = testUser.db ?? '$external';
    return fetch(
      `http://localhost:${PROXY_PORT}/cloud-mongodb-com/nds/${projectId}/users/${certAuthDb}/${certUsername}/certs?monthsUntilExpiration=1`
    ).then((res) => {
      return res.text();
    });
  }
}

const atlasCloudAuthenticator = new AtlasCloudAuthenticator();

// Proxy endpoint that triggers the sign in flow through configured cloud
// environment
proxyWebServer.use('/authenticate', async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 400;
    res.end();
    return;
  }

  try {
    const { projectId } = await atlasCloudAuthenticator.authenticate();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ projectId }));
  } catch (err) {
    res.statusCode = 500;
    res.send(err.stack ?? err.message);
  }
  res.end();
});

proxyWebServer.use('/logout', async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
    return;
  }

  await atlasCloudAuthenticator.logout();
  res.statusCode = 200;
  res.end();
});

proxyWebServer.use('/x509', async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
    return;
  }

  try {
    await atlasCloudAuthenticator.authenticate();
    const cert = await atlasCloudAuthenticator.getX509Cert();
    res.setHeader('Content-Type', 'text/plain');
    res.send(cert);
  } catch (err) {
    res.statusCode = 500;
    res.send(err.stack ?? err.message);
  }
  res.end();
});

proxyWebServer.use('/projectId', async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
    return;
  }

  try {
    const projectId = await atlasCloudAuthenticator.fetchProjectId();
    if (!projectId) {
      res.statusCode = 403;
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.send(projectId);
    }
  } catch (err) {
    res.statusCode = 500;
    res.send(err.stack ?? err.message);
  }
  res.end();
});

proxyWebServer.use('/create-cluster', async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
    return;
  }

  res.setHeader(
    'Location',
    `${CLOUD_ORIGIN}/v2/${await atlasCloudAuthenticator.fetchProjectId()}#/clusters/edit/`
  );
  res.statusCode = 303;
  res.end();
});

// Prefixed proxy to the cloud backend
proxyWebServer.use(
  '/cloud-mongodb-com',
  proxyMiddleware(CLOUD_ORIGIN, {
    async proxyReqOptDecorator(req) {
      req.headers = {
        ...req.headers,
        ...(await atlasCloudAuthenticator.getCloudHeaders()),
      };
      return req;
    },
    userResHeaderDecorator(headers, _req, res) {
      // Cloud backend will try to always set auth cookies on requests, but we
      // can't really meaningfully store those in the browser (__secure- ones
      // would be ignored anyways), so to avoid polluting storage, we just not
      // allow the set-cookie header to propagate
      delete headers['set-cookie'];

      if (isSignedOutRedirect(headers.location)) {
        res.statusCode = 403;
        return {};
      }
      return headers;
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

electronApp.on('will-quit', () => {
  atlasCloudAuthenticator.logout();
});

electronApp.whenReady().then(() => {
  if (process.env.OPEN_BROWSER !== 'false') {
    shell.openExternal(`http://localhost:${PROXY_PORT}`);
  }
});
