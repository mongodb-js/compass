/**
 * This polyfill that is using net.createConnection directly is only used when
 * running compass-web in a local sandbox. This establishes a connection to a
 * simple passthrough Node.js proxy through a websocket. See
 * polyfills/net/index.ts and scripts/ws-proxy.js for more info
 */
import type { SocketConnectOpts } from 'net';
import { createConnection } from 'net';

export const connect = (options: { host: string; port: number }) => {
  return createConnection({
    ...options,
    tls: true,
  } as unknown as SocketConnectOpts);
};
