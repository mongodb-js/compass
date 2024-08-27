export function createAgent(): undefined {
  // The original can return 'undefined' as well
}
export function useOrCreateAgent(): undefined {
  // The original can return 'undefined' as well
}
export function createSocks5Tunnel(): undefined {
  // The original can return 'undefined' as well
}
export function hookLogger(): undefined {
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
export * from '@mongodb-js/devtools-proxy-support/proxy-options';
