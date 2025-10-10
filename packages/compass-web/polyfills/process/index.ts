import process from 'process/browser';
import hrtime from 'browser-process-hrtime';
(process as any).hrtime ??= hrtime;
// eslint-disable-next-line no-console
(process as any).emitWarning ??= console.warn;
(process as any).platform = 'Unknown';
(process as any).arch = 'Unknown';

// Allow e2e tests to override environment variables
if (process.env.APP_ENV === 'webdriverio') {
  const kSandboxSetEnvFn = Symbol.for('@compass-web-sandbox-set-env');
  // eslint-disable-next-line no-console
  console.info(
    `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-set-env')]('KEY', 'value') to dynamically set environment variables`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any)[kSandboxSetEnvFn] = (key: string, value: string) => {
    process.env[key] = value;
  };
}

export { process };
