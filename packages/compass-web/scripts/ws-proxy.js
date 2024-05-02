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

/**
 * Creates a simple passthrough proxy that accepts a websocket connection and
 * establishes a corresponding socket connection to a server. The connection
 * flow starts by the frontend sending a connection options message after which
 * every follow-up message is directly written to the opened socket stream
 */
function createWebSocketProxy(port = 1337, logger = console) {
  const wsServer = new WebSocketServer({ port }, () => {
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
        logger.log('message from client');
        socket.write(data, 'binary');
      } else {
        // First message before socket is created is with connection info
        const {
          connectOptions: { tls: useSecureConnection, ...connectOptions },
          setOptions: { setKeepAlive, setTimeout, setNoDelay },
        } = JSON.parse(data.toString());
        logger.log(
          'setting up new%s connection to %s:%s',
          useSecureConnection ? ' secure' : '',
          connectOptions.host,
          connectOptions.port
        );
        socket = useSecureConnection
          ? tls.connect(connectOptions)
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
          logger.log('message from server');
          ws.send(data);
        });
      }
    });
  });
}

module.exports = { createWebSocketProxy };
