const kSandboxSetEnvFn = Symbol.for('@compass-web-sandbox-set-env');
// eslint-disable-next-line no-console
console.info(
  `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-set-env')]('KEY', 'value') to dynamically set environment variables`
);
// Even though it doesn't look like it, process is module scoped in web bundle,
// to allow overriding it in runtime in the sandbox we add a special global
// scoped method
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)[kSandboxSetEnvFn] = (key: string, value: string) => {
  process.env[key] = value;
};
