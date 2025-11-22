export function createAgent(): void {
  // The original can return 'undefined' as well
}
export function useOrCreateAgent(): void {
  // The original can return 'undefined' as well
}
export function createSocks5Tunnel(): void {
  // The original can return 'undefined' as well
}
export function hookLogger(): void {
  // no-op
}
export function createFetch(): typeof fetch {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async () => {
    throw new Error('node-fetch not available in compass web');
  };
}
// eslint-disable-next-line @typescript-eslint/require-await
export async function systemCA(): Promise<never> {
  const error = new Error('system CA access not available in compass-web');
  (error as unknown as { code: 'OUT_OF_MEM' }).code = 'OUT_OF_MEM'; // This is a "tls" error code that makes devtools-connect not use the systemCA
  throw error;
}
export function resetSystemCACache(): never {
  throw new Error('reset system CA access not available in compass-web');
}

// Explicitly web-compatible
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
export * from '@mongodb-js/devtools-proxy-support/proxy-options';
