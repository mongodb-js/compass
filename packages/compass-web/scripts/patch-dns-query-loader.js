module.exports = function (source) {
  if (/node_modules(\/|\\)dns-query(\1)common.mjs$/.test(this.resourcePath)) {
    // TODO(COMPASS-11365): A change in behavior around globals detection in
    // latest webpack version causes multiple const definitions for the same
    // global variable override to end up in the package, this will take a
    // moment to submit to webpack and get a fix issued, so to unblock updates
    // we will temporarily remove the offending code
    const s = source
      .replace('const URL =', 'const _URL =')
      .replace(
        'export { AbortError, URL }',
        'export { AbortError, _URL as URL }'
      )
      .replaceAll('new URL', 'new _URL');

    if (s !== source) {
      return s;
    }
  }
  return source;
};
