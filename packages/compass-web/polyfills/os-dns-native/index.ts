import { resolveSrv, resolveTxt } from '../dns';

export const wasNativelyLookedUp = () => false;
export const withNodeFallback = {
  resolveSrv,
  resolveTxt,
};
