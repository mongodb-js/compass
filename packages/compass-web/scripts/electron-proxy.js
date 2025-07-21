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
const http = require('http');
const https = require('https');

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

const WEBSOCKET_PROXY_PORT = process.env.COMPASS_WEBSOCKET_PROXY_PORT
  ? Number(process.env.COMPASS_WEBSOCKET_PROXY_PORT)
  : 1337;

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
    const tld = CLOUD_CONFIG_VARIANTS === 'local' ? 'localhost' : 'mongodb.com';
    const cloudHostCookies = (await session.defaultSession.cookies.get({}))
      .filter((cookie) => {
        return cookie.domain?.endsWith(tld) ?? true;
      })
      .map((cookie) => {
        return `${cookie.name}=${cookie.value}`;
      });
    return cloudHostCookies;
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  #getProjectIdFromUrl(url) {
    return new URL(url, 'http://localhost').pathname.replace('/v2/', '');
  }

  async #fetch(path, init) {
    return electronFetch(`${CLOUD_ORIGIN}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
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

  async getCloudHeaders(hostSubdomain = '') {
    const cookie = (await this.#getCloudSessionCookies()).join('; ');
    return {
      cookie,
      host: `${hostSubdomain}${CLOUD_HOST}`,
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
    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'localstorage'],
    });
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
      if (isSignedOutRedirect(headers.location)) {
        res.statusCode = 403;
        return {};
      }

      // When cloud session expires, cloud backend will send a new set of
      // session cookies to make sure that "active" client stays signed in. As
      // these proxy requests are not going through the electron fetch, we can
      // end up in a situation where electron still keeps the old session
      // cookies instead on new ones. When we receive set-cookie header in the
      // proxy, we will copy the cookies to the electron session to make sure
      // that both are in sync with electron storage that we use as source of
      // truth for cookies when creating the fetch request
      if (headers['set-cookie']) {
        const parsedCookies = headers['set-cookie'].map((cookieStr) => {
          const [cookie, ...options] = cookieStr.split(';').map((keyVal) => {
            return keyVal.split('=');
          });
          const domain = options.find((opt) => {
            return opt[0] === 'Domain';
          });
          return { name: cookie[0], value: cookie[1], domain: domain[1] };
        });
        session.defaultSession.cookies.set(parsedCookies);
      }
      delete headers['set-cookie'];

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

/**
 * Keeping a track of websocket proxy sockets so that we can clean them up on
 * close
 */
const wsProxySockets = new Set();

/**
 * @param {import('stream').Duplex} socket
 * @param {Buffer} head
 */
const prepareSocket = function (socket, head) {
  wsProxySockets.add(socket);
  socket.setTimeout(0);
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 0);
  if (head?.length) {
    socket.unshift(head);
  }
};

/**
 * @param {http.IncomingMessage} res
 * @param {Record<string, string | false>} headerOverride
 */
const createHeaderStringFromResponse = function (res, headerOverride = {}) {
  let header = `HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n`;
  for (let i = 0; i < res.rawHeaders.length; i += 2) {
    const k = res.rawHeaders[i].toLowerCase();
    const override = headerOverride[k];
    const v = override ?? res.rawHeaders[i + 1];
    delete headerOverride[k];
    if (!v) {
      continue;
    }
    header += `${k}: ${v}\r\n`;
  }
  for (const [k, v] of Object.entries(headerOverride)) {
    header += `${k}: ${v}\r\n`;
  }
  header += '\r\n';
  return header;
};

/**
 * Proxying websocket requests is handled separately from express application
 * directly on the proxy server
 */
proxyServer.on('upgrade', async (req, socket, head) => {
  const isCCS = Boolean(req.url?.startsWith('/ccs'));
  const websocketTarget = isCCS
    ? `https://cluster-connection.${CLOUD_HOST}${
        req.url?.replace('/ccs', '') ?? ''
      }`
    : `http://localhost:${WEBSOCKET_PROXY_PORT}`;
  const createRequest = websocketTarget.startsWith('https')
    ? https.request
    : http.request;

  socket.on('error', (err) => {
    logger.error(err);
  });

  prepareSocket(socket, head);

  let extraHeaders = {};

  if (isCCS) {
    extraHeaders = await atlasCloudAuthenticator.getCloudHeaders(
      'cluster-connection.'
    );
  }

  const proxyReq = createRequest(websocketTarget, {
    method: req.method,
    headers: { ...req.headers, ...extraHeaders },
  });

  proxyReq.on('error', (err) => {
    logger.error(err);
    socket.end();
  });

  proxyReq.on('response', (proxyRes) => {
    // We only get response back if upgrade didn't happen, so stream back
    // whatever server responded (it's probably an error)
    socket.write(createHeaderStringFromResponse(proxyRes));
    proxyRes.pipe(socket);
  });
  proxyReq.on('upgrade', async (proxyRes, proxySocket, proxyHead) => {
    // Will not be piped, so we do this manually
    proxySocket.on('error', (err) => {
      logger.error(err);
      socket.end();
    });
    prepareSocket(proxySocket, proxyHead);
    socket.write(
      createHeaderStringFromResponse(proxyRes, {
        'access-control-allow-credentials': false,
        'access-control-allow-origin': false,
        'set-cookie': false,
      })
    );
    proxySocket.pipe(socket).pipe(proxySocket);
  });

  proxyReq.end();
});

const websocketProxyServer = createWebSocketProxy(WEBSOCKET_PROXY_PORT);

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

    // close all proxy sockets
    Array.from(wsProxySockets.values()).map((socket) => {
      return socket.destroy();
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

process.on('uncaughtExceptionMonitor', (err, origin) => {
  logger.error(
    'Uncaught exception (caused by "%s"): ',
    origin,
    err.stack ?? err
  );
});

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
