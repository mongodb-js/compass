import process from 'process/browser';
import hrtime from 'browser-process-hrtime';
(process as any).hrtime ??= hrtime;
// eslint-disable-next-line no-console
(process as any).emitWarning ??= console.warn;
(process as any).platform = 'Unknown';
(process as any).arch = 'Unknown';
const {
  nextTick,
  title,
  env,
  argv,
  version,
  versions,
  on,
  addListener,
  once,
  off,
  removeListener,
  removeAllListeners,
  emit,
  prependListener,
  prependOnceListener,
  listeners,
  cwd,
  chdir,
  umask,
  emitWarning,
  platform,
  arch,
} = process;

// We provide both named and default exports so that this module works
// seamlessly for consumer chunks that are either esm or commonjs
export {
  process,
  nextTick,
  title,
  env,
  argv,
  version,
  versions,
  on,
  addListener,
  once,
  off,
  removeListener,
  removeAllListeners,
  emit,
  prependListener,
  prependOnceListener,
  listeners,
  cwd,
  chdir,
  umask,
  emitWarning,
  platform,
  arch,
  hrtime,
};
export default process;
