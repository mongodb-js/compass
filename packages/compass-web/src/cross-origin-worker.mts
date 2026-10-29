/**
 * Compass Web is served from the CDN while the page lives on
 * cloud.mongodb.com, and browsers only start a Worker from a same-origin
 * script. A blob: URL has the page's origin, so the worker starts from a blob
 * that imports the real script (the CDN serves it with CORS). The worker then
 * runs as the page's origin, so its requests carry the page's cookies.
 *
 * webpack.config.js registers this class in `parser.javascript.worker`, so
 * `new CrossOriginWorker(new URL(..., import.meta.url))` is still bundled as a
 * worker entry.
 */
export class CrossOriginWorker extends Worker {
  constructor(url: URL, options?: WorkerOptions) {
    // Not bare `URL`: webpack-config-compass provides whatwg-url as `URL`,
    // which has no createObjectURL
    const { URL: NativeURL } = globalThis;
    const shim = NativeURL.createObjectURL(
      new Blob([`import ${JSON.stringify(url.href)};`], {
        type: 'text/javascript',
      })
    );
    super(shim, { ...options, type: 'module' });
    NativeURL.revokeObjectURL(shim);
  }
}
