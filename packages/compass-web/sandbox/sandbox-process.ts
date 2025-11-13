const kSandboxProcessEnv = Symbol.for('@compass-web-sandbox-process-env');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)[kSandboxProcessEnv] = process.env;
// eslint-disable-next-line no-console
console.info(
  `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-process-env')] to get access to process.env`
);
