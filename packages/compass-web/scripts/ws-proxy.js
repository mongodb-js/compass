'use strict';
const net = require('net');
const tls = require('tls');
const { WebSocketServer } = require('ws');

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
        const dataView = new Uint8Array(data);
        const messageByte = dataView[0];
        if (messageByte !== 0x01) {
          logger.log('first message should have type byte,(%s)', evt, err);
          ws.close(evt === 'close' ? 1001 : 1011);
        }
        const jsonBytes = dataView.subarray(1);
        const jsonStr = new TextDecoder('utf-8').decode(jsonBytes);
        console.log('pre message received on backend: ', jsonStr);
        const { tls: useSecureConnection, ...connectOptions } =
          JSON.parse(jsonStr);

        // const { tls: useSecureConnection, ...connectOptions } = JSON.parse(data.toString);
        logger.log(
          'setting up new%s connection to %s:%s',
          useSecureConnection ? ' secure' : '',
          connectOptions.host,
          connectOptions.port
        );
        socket = useSecureConnection
          ? tls.connect({
              servername: connectOptions.host,
              ...connectOptions,
            })
          : net.createConnection(connectOptions);
        socket.setKeepAlive(true, 300000);
        socket.setTimeout(30000);
        socket.setNoDelay(true);
        const connectEvent = useSecureConnection ? 'secureConnect' : 'connect';
        SOCKET_ERROR_EVENT_LIST.forEach((evt) => {
          socket.on(evt, (err) => {
            logger.log('server socket error event (%s)', evt, err);
            ws.close(evt === 'close' ? 1001 : 1011);
          });
        });
        socket.on(connectEvent, () => {
          logger.log(
            'server socket connected at %s:%s',
            connectOptions.host,
            connectOptions.port
          );
          socket.setTimeout(0);
          const utf8Encoder = new TextEncoder();
          const message = JSON.stringify({ preMessageOk: 1 });
          const utf8Array = utf8Encoder.encode(message);

          const encoded = new Uint8Array(utf8Array.length + 1);
          encoded[0] = 0x01;
          encoded.set(utf8Array, 1);
          ws.send(encoded);
        });
        socket.on('data', async (data) => {
          const encoded = new Uint8Array(data.length + 1);
          encoded[0] = 0x02;
          encoded.set(data, 1);
          // ws.send(encoded);
          logger.log(encoded);
          ws.send(encoded);
        });
      }
    });
  });

  return wsServer;
}

module.exports = { createWebSocketProxy };
