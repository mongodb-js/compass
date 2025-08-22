export type { AmpersandMethodOptions } from './promisify-ampersand-method';
export { promisifyAmpersandMethod } from './promisify-ampersand-method';
export { getAppName, getStoragePath, getAppVersion } from './electron';
export {
  raceWithAbort,
  cancellableWait,
  createCancelError,
  isCancelError,
  throwIfAborted,
} from './cancellable-promise';
