import process from 'process/browser';
import hrtime from 'browser-process-hrtime';
(process as any).hrtime ??= hrtime;
// eslint-disable-next-line no-console
(process as any).emitWarning ??= console.warn;
(process as any).platform = 'Unknown';
(process as any).arch = 'Unknown';
export { process };
