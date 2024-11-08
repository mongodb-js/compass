'use strict';
// @ts-check
const express = require('express');
const proxyMiddleware = require('express-http-proxy');
const { once } = require('events');
const {
  app: electronApp,
  BrowserWindow,
  session,
  shell,
  net: { fetch: electronFetch },
} = require('electron');
const { createWebSocketProxy } = require('./ws-proxy');
const {
  webpack,
  WebpackDevServer,
} = require('@mongodb-js/webpack-config-compass');

const webpackConfig = require('../webpack.config')(
  { WEBPACK_SERVE: true },
  { mode: 'development' }
);

const expressProxy = express();

const logger = console;

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

const TEST_DB_USER = `compass-web-test-user-x509-${Date.now()}`;
const TEST_X509_CERT_PROMISE = new Map();

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

  async #fetch(path, init) {
    let csrfHeaders;
    if (
      init?.method &&
      /^(GET|HEAD|OPTIONS|TRACE)$/i.test(init.method) === false
    ) {
      csrfHeaders = await this.#getCSRFHeaders();
    }
    return electronFetch(`${CLOUD_ORIGIN}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        ...csrfHeaders,
      },
    }).then(handleRes);
  }

  /**
   * @param {string} url
   * @returns {boolean}
   */
  #isAuthenticatedUrl(url) {
    return new URL(url, 'http://localhost').pathname.startsWith('/v2/');
  }

  async #getCSRFHeaders() {
    const projectId = await this.getProjectId();
    const { csrfToken, csrfTime } = await this.#fetch(
      `/v2/${projectId}/params`
    );
    return {
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...(csrfTime && { 'X-CSRF-Time': csrfTime }),
    };
  }

  async getCloudHeaders() {
    const cookie = (await this.#getCloudSessionCookies()).join('; ');
    return {
      cookie,
      host: CLOUD_HOST,
      origin: CLOUD_ORIGIN,
    };
  }

  /**
   * @returns {Promise<string | null>}
   */
  async getProjectId() {
    const res = await this.#fetch('/user/shared');
    return res?.currentProject?.projectId ?? null;
  }

  /**
   * @returns {Promise<{ projectId: string; }>}
   */
  async authenticate() {
    return (this.#authenticatePromise ??= (async () => {
      try {
        await electronApp.whenReady();
        const projectId = await this.getProjectId();
        if (projectId) {
          return { projectId };
        }
        const bw = new BrowserWindow({
          width: 600,
          height: 800,
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
              bw.close();
            });
          }),
          once(bw, 'close', { signal: abortController.signal }).then(() => {
            throw new Error('Window closed before finished signing in');
          }),
        ]);
        void electronApp.dock?.show();
        void bw.loadURL(`${CLOUD_ORIGIN}/account/login`);
        return authInfoPromise;
      } finally {
        this.#authenticatePromise = null;
      }
    })());
  }

  async cleanupAndLogout() {
    // When logging out, delete the test user too. If we don't do this now, we
    // will lose a chance to do it later due to missing auth
    try {
      await atlasCloudAuthenticator.deleteTestDBUser();
    } catch (err) {
      logger.err('[electron-proxy] failed to remove the test user:', err);
    }
    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'localstorage'],
    });
  }

  #createTestDBUser(projectId) {
    return this.#fetch(`/nds/${projectId}/users`, {
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
    });
  }

  async #ensureTestDBUserExists(projectId) {
    const users = await this.#fetch(`/nds/${projectId}/users`);
    const testCertUser = users.find((user) => {
      return (
        user.x509Type === 'MANAGED' &&
        user.user.replace(/^cn=/i, '') === TEST_DB_USER
      );
    });
    const user = testCertUser ?? (await this.#createTestDBUser(projectId));
    let mongodbConfigurationInProgress = true;
    let attempts = 0;
    while (mongodbConfigurationInProgress && attempts <= 10) {
      attempts++;
      await new Promise((resolve) => {
        setTimeout(resolve, 5_000);
      });
      const project = await this.#fetch(`/nds/${projectId}`);
      const configuringUserOrRoles = project?.plans?.some((plan) => {
        return plan.moves?.some((move) => {
          return move.name === 'ConfigureMongoDBForProject';
        });
      });
      mongodbConfigurationInProgress =
        project?.state === 'UPDATING' &&
        (!project?.plans || configuringUserOrRoles);
    }
    return user;
  }

  async deleteTestDBUser() {
    const projectId = await this.getProjectId();
    const certUsername = encodeURIComponent(
      `CN=${TEST_DB_USER.replace(/^cn=/i, '')}`
    );
    return this.#fetch(`/nds/${projectId}/users/$external/${certUsername}`, {
      method: 'DELETE',
    });
  }

  /**
   *
   * @returns {Promise<string>}
   */
  async getX509Cert() {
    const projectId = await this.getProjectId();
    if (TEST_X509_CERT_PROMISE.has(projectId)) {
      return TEST_X509_CERT_PROMISE.get(projectId);
    }
    const promise = (async () => {
      try {
        const testUser = await this.#ensureTestDBUserExists(projectId);
        const certUsername = encodeURIComponent(
          `CN=${testUser.user.replace(/^cn=/i, '')}`
        );
        const certAuthDb = testUser.db ?? '$external';
        return await this.#fetch(
          `/nds/${projectId}/users/${certAuthDb}/${certUsername}/certs?monthsUntilExpiration=1`
        );
      } catch (err) {
        TEST_X509_CERT_PROMISE.delete(projectId, promise);
        logger.error(
          '[electron-proxy] failed to issue a cert for the test user',
          err
        );
        throw err;
      }
    })();
    TEST_X509_CERT_PROMISE.set(projectId, promise);
    return promise;
  }
}

const atlasCloudAuthenticator = new AtlasCloudAuthenticator();

// Proxy endpoint that triggers the sign in flow through configured cloud
// environment
expressProxy.use('/authenticate', async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 400;
    res.end();
    return;
  }

  try {
    const { projectId } = await atlasCloudAuthenticator.authenticate();
    // Start issuing the cert to save some time when signing in
    void atlasCloudAuthenticator.getX509Cert().catch(() => {
      // ignore errors
    });
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ projectId }));
  } catch (err) {
    res.statusCode = 500;
    res.send(err.stack ?? err.message);
  }
  res.end();
});

expressProxy.use('/logout', async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
    return;
  }

  await atlasCloudAuthenticator.cleanupAndLogout();
  res.statusCode = 200;
  res.end();
});

expressProxy.use('/x509', async (req, res) => {
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

expressProxy.use('/projectId', async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
    return;
  }

  try {
    const projectId = await atlasCloudAuthenticator.getProjectId();
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

expressProxy.use('/create-cluster', async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 400;
    res.end();
    return;
  }

  res.setHeader(
    'Location',
    `${CLOUD_ORIGIN}/v2/${await atlasCloudAuthenticator.getProjectId()}#/clusters/edit/`
  );
  res.statusCode = 303;
  res.end();
});

// Prefixed proxy to the cloud backend
expressProxy.use(
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
expressProxy.use(
  proxyMiddleware(`http://localhost:${WEBPACK_DEV_SERVER_PORT}`)
);

void electronApp.dock?.hide();

logger.log('[electron-proxy] starting proxy server on port %s', PROXY_PORT);

const proxyServer = expressProxy.listen(PROXY_PORT, 'localhost');

const websocketProxyServer = createWebSocketProxy();

const webpackCompiler = webpack(webpackConfig);

const webpackDevServer = new WebpackDevServer(
  { ...webpackConfig.devServer, setupExitSignals: false },
  webpackCompiler
);

let cleaningUp = false;

// If stdio stream was already destroyed while we're cleaning up, these streams
// can throw causing Electron to pop up a modal with an error, so we catch and
// print the error ourselves
[process.stdout, process.stderr].forEach((stream) => {
  stream.on('error', (err) => {
    logger.error(err);
  });
});

function cleanupAndExit() {
  if (cleaningUp) {
    return;
  }
  cleaningUp = true;
  logger.log('[electron-proxy] cleaning up before exit');
  void Promise.allSettled([
    // This will cleanup auth and remove the session test user
    atlasCloudAuthenticator.cleanupAndLogout(),

    // close the http proxy server
    proxyServer.closeAllConnections(),
    new Promise((resolve) => {
      proxyServer.close(resolve);
    }),

    // close the driver websocket proxy server
    Array.from(websocketProxyServer.clients.values()).map((ws) => {
      return ws.terminate();
    }),
    new Promise((resolve) => {
      websocketProxyServer.close(resolve);
    }),

    // cleanup everything webpack-server related
    new Promise((resolve) => {
      webpackDevServer.compiler?.close?.(resolve);
    }),
    webpackDevServer.stop(),
  ]).finally(() => {
    logger.log('[electron-proxy] done cleaning up');
    process.exitCode = 0;
    process.exit();
  });
}

electronApp.whenReady().then(async () => {
  // Create an empty browser window so that webdriver session can be
  // immediately get attached to something without failing
  const emptyBrowserWindow = new BrowserWindow({ show: false });
  emptyBrowserWindow.loadURL('about:blank');

  electronApp.on('window-all-closed', () => {
    // We want proxy to keep running even when all the windows are closed, but
    // hide the dock icon because there are not windows associated with it
    // anyway
    electronApp.dock?.hide();
  });

  electronApp.on('will-quit', (evt) => {
    evt.preventDefault();
    void cleanupAndExit();
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, cleanupAndExit);
  }

  await webpackDevServer.start();

  if (process.env.OPEN_BROWSER !== 'false') {
    shell.openExternal(`http://localhost:${PROXY_PORT}`);
  }
});
