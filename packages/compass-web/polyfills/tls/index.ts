/**
 * Polyfill for the Node.js 'tls' module used by compass-web in all build
 * targets (library and sandbox).
 *
 * Delegates to the 'net' polyfill (polyfills/net/index.ts), which handles
 * both the multiplex WebSocket transport (production) and the direct
 * WebSocket proxy (local sandbox). Passing `tls: true` causes the net polyfill
 * to emit 'secureConnect' instead of 'connect', which is what the MongoDB
 * driver expects from a TLS socket.
 */
import type { SocketConnectOpts } from 'net';
import { createConnection } from 'net';

export const connect = (options: { host: string; port: number }) => {
  return createConnection({
    ...options,
    tls: true,
  } as unknown as SocketConnectOpts);
};
