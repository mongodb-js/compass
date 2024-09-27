'use strict';
const net = require('net');
const tls = require('tls');
const { WebSocketServer } = require('ws');

function serializeError(err) {
  if (err) {
    return {
      name: err.name,
      message: err.message,
    };
  }
}

const certsMap = new Map();

const WEB_PROXY_PORT = process.env.COMPASS_WEB_HTTP_PROXY_PORT
  ? Number(process.env.COMPASS_WEB_HTTP_PROXY_PORT)
  : 7777;

async function resolveX509Cert({ projectId, clusterName }) {
  if (certsMap.has(projectId)) {
    return certsMap.get(projectId);
  }
  try {
    const certUrl = new URL(`http://localhost:${WEB_PROXY_PORT}/x509`);
    certUrl.searchParams.set('projectId', projectId);
    certUrl.searchParams.set('clusterName', clusterName);
    const cert = await fetch(certUrl).then((res) => {
      if (!res.ok) {
        throw new Error('Failed to resolve x509 cert for the connection');
      }
      return res.text();
    });
    certsMap.set(projectId, cert);
    return cert;
  } catch {
    return null;
  }
}

/**
 * Creates a simple passthrough proxy that accepts a websocket connection and
 * establishes a corresponding socket connection to a server. The connection
 * flow starts by the frontend sending a connection options message after which
 * every follow-up message is directly written to the opened socket stream
 */
function createWebSocketProxy(port = 1337, logger = console) {
  const wsServer = new WebSocketServer({ host: 'localhost', port }, () => {
    logger.log('ws server listening at %s', wsServer.options.port);
  });

  const SOCKET_ERROR_EVENT_LIST = ['error', 'close', 'timeout', 'parseError'];

  wsServer.on('connection', (ws) => {
    let socket;
    logger.log('new ws connection (total %s)', wsServer.clients.size);
    ws.on('close', () => {
      logger.log('ws closed');
      socket?.removeAllListeners();
      socket?.end();
    });
    ws.on('message', async (data) => {
      if (socket) {
        socket.write(data, 'binary');
      } else {
        // First message before socket is created is with connection info
        const {
          connectOptions: { tls: useSecureConnection, ...connectOptions },
          setOptions: { setKeepAlive, setTimeout, setNoDelay },
          atlasOptions,
        } = JSON.parse(data.toString());
        logger.log(
          'setting up new%s connection to %s:%s',
          useSecureConnection ? ' secure' : '',
          connectOptions.host,
          connectOptions.port
        );
        let cert = null;
        if (atlasOptions) {
          logger.log(
            'detected atlas connection, resolving x509 cert for cluster %s',
            atlasOptions.clusterName
          );
          cert = await resolveX509Cert(atlasOptions);
        }
        socket = useSecureConnection
          ? tls.connect({
              ...connectOptions,
              ...(cert && { cert: cert, key: cert }),
            })
          : net.createConnection(connectOptions);
        if (setKeepAlive) {
          socket.setKeepAlive(setKeepAlive.enabled, setKeepAlive.initialDelay);
        }
        if (setTimeout) {
          socket.setKeepAlive(setKeepAlive.timeout);
        }
        if (setNoDelay) {
          socket.setKeepAlive(setKeepAlive.noDelay);
        }
        const connectEvent = useSecureConnection ? 'secureConnect' : 'connect';
        SOCKET_ERROR_EVENT_LIST.forEach((evt) => {
          socket.on(evt, (err) => {
            logger.log('server socket error event (%s)', evt, err);
            ws.send(JSON.stringify({ evt, error: serializeError(err) }));
          });
        });
        socket.on(connectEvent, () => {
          logger.log(
            'server socket connected at %s:%s',
            connectOptions.host,
            connectOptions.port
          );
          socket.setTimeout(0);
          ws.send(JSON.stringify({ evt: connectEvent }));
        });
        socket.on('data', async (data) => {
          ws.send(data);
        });
      }
    });
  });

  return wsServer;
}

module.exports = { createWebSocketProxy };
