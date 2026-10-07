// node-fetch is dead weight on Node 24+ / Electron 44 / modern Chromium —
// both provide the WHATWG fetch natively. This shim re-exports the global
// so any `import fetch from 'node-fetch'` resolves to the native fetch.
const fetch = globalThis.fetch.bind(globalThis);
export default fetch;
export { fetch };
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
