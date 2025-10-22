module.exports = function (source) {
  if (this.resourcePath.includes('d3')) {
    // Our version of d3 uses `this` as a reference to global object / window.
    // This is not allowed in "strict mode" and all esm code will be running in
    // this mode. We are 4 major versions behind, so patching is an easy way to
    // deal with this for now without forcing us to update to latest
    source = source
      .replace(
        /\bthis\.(document|Element|navigator|CSSStyleDeclaration|d3)/g,
        'window.$1'
      )
      .replace(/\bthis(\[d3_vendorSymbol\()this/, 'window$1window');
  }
  return source;
};
