function fixWhatwgURLParse(): void {
  // https://github.com/jsdom/whatwg-url/issues/315
  if (
    typeof URL.parse === 'function' &&
    Object.prototype.toString.call(URL.parse('http://example.com')) !==
      '[object URL]' &&
    Object.prototype.toString.call(new URL('http://example.com')) ===
      '[object URL]'
  ) {
    URL.parse = function (url, base) {
      try {
        return new URL(url, base);
      } catch {
        return null;
      }
    };
  }
}

fixWhatwgURLParse();
