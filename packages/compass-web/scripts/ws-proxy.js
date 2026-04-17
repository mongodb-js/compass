'use strict';
const net = require('net');
const tls = require('tls');
const { WebSocketServer } = require('ws');
const { serialize, deserialize } = require('bson');

function parseFrame(data) {
  if (data.length < 4) return null;
  const headerSize =
    data[0] | (data[1] << 8) | (data[2] << 16) | ((data[3] << 24) >>> 0);
  if (headerSize < 5 || headerSize > data.length) return null;
  try {
    const header = deserialize(data.slice(0, headerSize));
    const payload = data.slice(headerSize);
    return { header, payload };
  } catch {
    return null;
  }
}

function buildFrame(header, payload) {
  const headerBytes = Buffer.from(serialize(header));
  if (!payload || payload.length === 0) return headerBytes;
  return Buffer.concat([headerBytes, payload]);
}

/**
 * Creates a multiplexed WebSocket proxy for local sandbox development.
 *
 * Accepts a single shared WebSocket connection and demultiplexes it into
 * individual TLS connections using the same BSON 5-tuple framing as
 * MultiplexWebSocketTransport on the client side.
 */
function createWebSocketProxy(port = 1337, logger = console) {
  const wsServer = new WebSocketServer({ host: 'localhost', port }, () => {
    logger.log('[multiplex] ws proxy listening at %s', wsServer.options.port);
  });

  wsServer.on('connection', (ws) => {
    // sp (client source port) -> Socket
    const streams = new Map();

    logger.log(
      '[ws-proxy] new ws connection (total %s)',
      wsServer.clients.size
    );

    ws.on('error', (err) => {
      logger.log('[ws-proxy] ws error: %s', err.message);
    });

    ws.on('close', (code, reason) => {
      logger.log(
        '[ws-proxy] ws closed, code=%d, reason=%s, destroying %d stream(s)',
        code,
        reason,
        streams.size
      );
      for (const socket of streams.values()) {
        socket.destroy();
      }
      streams.clear();
    });

    function safeSend(frame) {
      if (ws.readyState === ws.OPEN) {
        ws.send(frame);
      }
    }

    ws.on('message', (rawData) => {
      const data = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);
      const parsed = parseFrame(data);
      if (!parsed) return;

      const { header, payload } = parsed;
      const { v, sp, da, dp } = header;

      if (v === -1) {
        // Client is closing this stream
        const socket = streams.get(sp);
        if (socket) {
          socket.destroy();
          streams.delete(sp);
        }
        return;
      }

      if (!streams.has(sp)) {
        // First frame for this sp = CONNECT: open TLS connection to da:dp
        logger.log(
          '[ws-proxy.socket.open] tls stream sp=%d -> %s:%d',
          sp,
          da,
          dp
        );

        // All the localhost addresses will use net instead of tls. This is not the perfect
        // solution and does not cover every use case but it allows us to connect to locally
        // running clusters without worrying much.
        const secure = !da.match(/^localhost$|^127\.0\.0\.1$|^::1$/);

        const socket = secure
          ? tls.connect({ servername: da, host: da, port: dp })
          : net.connect({ host: da, port: dp });
        socket.setKeepAlive(true, 300000);
        socket.setTimeout(30000);
        socket.setNoDelay(true);

        streams.set(sp, socket);

        const connectEvent = secure ? 'secureConnect' : 'connect';
        socket.on(connectEvent, () => {
          logger.log(
            '[ws-proxy.socket.%s] stream sp=%d connected to %s:%d',
            connectEvent,
            sp,
            da,
            dp
          );
          // No frame needed: the client net polyfill emits secureConnect immediately
          // when registering the socket, without waiting for a proxy signal.
        });

        socket.on('data', (chunk) => {
          logger.log(
            '[ws-proxy.socket.data] stream sp=%d sending %d bytes',
            sp,
            chunk.length
          );
          safeSend(
            buildFrame(
              {
                v: 1,
                sa: 'localhost',
                sp: 0,
                da: 'localhost',
                dp: sp,
                sz: chunk.length,
              },
              chunk
            )
          );
        });

        socket.on('close', (hadError) => {
          logger.log(
            '[ws-proxy.socket.close] stream sp=%d closed, hadError=%s',
            sp,
            hadError
          );
          streams.delete(sp);
          safeSend(
            buildFrame({
              v: -1,
              sa: 'localhost',
              sp: 0,
              da: 'localhost',
              dp: sp,
              sz: 0,
              er: hadError ? 'tcp closed with error' : 'tcp closed',
            })
          );
        });

        socket.on('error', (err) => {
          logger.log(
            '[ws-proxy.socket.error] stream sp=%d error: %s',
            sp,
            err.message
          );
          streams.delete(sp);
          safeSend(
            buildFrame({
              v: -1,
              sa: 'localhost',
              sp: 0,
              da: 'localhost',
              dp: sp,
              sz: 0,
              er: err.message,
            })
          );
        });

        if (payload.length > 0) {
          socket.write(payload);
        }
      } else {
        const socket = streams.get(sp);
        if (socket && payload.length > 0) {
          socket.write(payload);
        }
      }
    });
  });

  return wsServer;
}

module.exports = { createWebSocketProxy };
