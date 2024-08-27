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
export function createFetch(): never {
  throw new Error('node-fetch like-API not available in compass-web');
}
export function systemCA(): never {
  throw new Error('system CA access not available in compass-web');
}
export function resetSystemCACache(): never {
  throw new Error('system CA access not available in compass-web');
}

// Explicitly web-compatible
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error TS resolution doesn't match webpack resolution
export * from '@mongodb-js/devtools-proxy-support/proxy-options';
