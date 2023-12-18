import { resolveSrv, resolveTxt } from 'dns';
export const withNodeFallback = { resolveSrv, resolveTxt };
export function wasNativelyLookedUp() {
  return false;
}
