export function createAgent(): void {
  // The original can return 'undefined' as well
}
export function isExistingAgentInstance(): boolean {
  return false;
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
  return async () =>
    Promise.reject(new Error('node-fetch not available in compass web'));
}
export async function systemCA() {
  await Promise.reject(
    new Error('system CA access not available in compass-web')
  );
}
export function resetSystemCACache(): never {
  throw new Error('reset system CA access not available in compass-web');
}

// Explicitly web-compatible
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
export * from '@mongodb-js/devtools-proxy-support/proxy-options';
