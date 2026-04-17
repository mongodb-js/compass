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
import { getMultiplexLink } from '../../src/multiplex-link';

declare global {
  interface Window {
    __compassWebSharedRuntime?: {
      tls?: {
        connect: (options: unknown) => ReturnType<typeof createConnection>;
      };
    };
  }
}

export const connect = (options: { host: string; port: number }) => {
  /**
   * Currently CompassWeb expects `tls` from `__compassWebSharedRuntime` global. However, when
   * multiplexing is enabled, we do not need to use that. And in order to continue to support the
   * non-multiplexing, we will use `__compassWebSharedRuntime.tls` to connect.
   */
  const isMultiplexingEnabled = !!getMultiplexLink();
  const isGlobalTlsAvailable = !!window.__compassWebSharedRuntime?.tls;

  if (!isMultiplexingEnabled && isGlobalTlsAvailable) {
    return window.__compassWebSharedRuntime?.tls?.connect(options);
  }

  return createConnection({
    ...options,
    tls: true,
  } as unknown as SocketConnectOpts);
};
