// The java-shell doesn't have URL, so we fall back to a pure-JS implementation.
// And, because it's so much fun, it also doesn't have TextEncoder/TextDecoder,
// so we need to (crudely) polyfill that as well in order to use that
// pure-JS implementation.
if (
  typeof require('util').TextDecoder !== 'function' ||
  typeof require('util').TextEncoder !== 'function'
) {
  Object.assign(require('util'), textEncodingPolyfill());
}

// Easiest way to get global `this` (either `global` in Node or `window` in
// browser) in any environment
//
// eslint-disable-next-line no-new-func
const _global = new Function('return this')();

// URL has to be defined dynamically to allow browser environments get rid of
// the polyfill that can potentially break them, even when not used
let URL: typeof import('url').URL;
let URLSearchParams: typeof import('url').URLSearchParams;

// URL should be available in global scope both in Node >= 10 and in browser
// (this also means that electron renderer should have it available one way or
// another)
if ('URL' in _global) {
  URL = _global.URL;
  URLSearchParams = _global.URLSearchParams;
} else {
  // java-shell js runtime (and older Node versions, but we don't support those)
  // doesn't have URL available so we fallback to the `whatwg-url` polyfill.
  //
  // WARN: this polyfill is not supported in browser environment and even just
  // importing it can break the browser runtime from time to time, if you are
  // using `service-provider-core` in browser environment, make sure that this
  // import does not actually import the library
  URL = require('whatwg-url').URL;
  URLSearchParams = require('whatwg-url').URLSearchParams;
}

// Basic encoder/decoder polyfill for java-shell environment (see above)
function textEncodingPolyfill(): any {
  class TextEncoder {
    encode(string: string): Uint8Array {
      return Buffer.from(string, 'utf8');
    }
  }
  class TextDecoder {
    decode(bytes: Uint8Array): string {
      const str = Buffer.from(bytes).toString('utf8');
      return str.slice(+str.startsWith('\ufeff'));
    }
  }
  return { TextDecoder, TextEncoder };
}

export { textEncodingPolyfill, URL, URLSearchParams };
