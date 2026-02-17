function fixWhatwgURLParse(): void {
  console.log('fixWhatwgURLParse', {
    URL,
    C1: typeof URL.parse === 'function',
    C2: Object.prototype.toString.call(URL.parse?.('http://example.com')),
    C3: Object.prototype.toString.call(new URL('http://example.com')),
  });
  // https://github.com/jsdom/whatwg-url/issues/315
  if (
    typeof URL.parse === 'function' &&
    Object.prototype.toString.call(URL.parse('http://example.com')) !==
      '[object URL]' &&
    Object.prototype.toString.call(new URL('http://example.com')) ===
      '[object URL]'
  ) {
    console.warn('fixWhatwgURLParse fixing');
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
