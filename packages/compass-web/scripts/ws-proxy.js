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
        socket.write(decodeMessageWithTypeByte(data), 'binary');
      } else {
        // First message before socket is created is with connection info
        const { tls: useSecureConnection, ...connectOptions } =
          decodeMessageWithTypeByte(data);

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
          const encoded = encodeStringMessageWithTypeByte(
            JSON.stringify({ preMessageOk: 1 })
          );
          ws.send(encoded);
        });
        socket.on('data', async (data) => {
          ws.send(encodeBinaryMessageWithTypeByte(data));
        });
      }
    });
  });

  return wsServer;
}

function encodeStringMessageWithTypeByte(message) {
  const utf8Encoder = new TextEncoder();
  const utf8Array = utf8Encoder.encode(message);
  return encodeMessageWithTypeByte(utf8Array, 0x01);
}

function encodeBinaryMessageWithTypeByte(message) {
  return encodeMessageWithTypeByte(message, 0x02);
}

function encodeMessageWithTypeByte(message, type) {
  const encoded = new Uint8Array(message.length + 1);
  encoded[0] = type;
  encoded.set(message, 1);
  return encoded;
}

function decodeMessageWithTypeByte(message) {
  const typeByte = message[0];
  if (typeByte === 0x01) {
    const jsonBytes = message.subarray(1);
    const textDecoder = new TextDecoder('utf-8');
    const jsonStr = textDecoder.decode(jsonBytes);
    return JSON.parse(jsonStr);
  } else if (typeByte === 0x02) {
    return message.subarray(1);
  }
}

module.exports = { createWebSocketProxy };
