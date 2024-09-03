// A bunch of leafygreen / React messages that only generate noise in tests
// without being meaningfully actionable for us
const ignoreLeafygreenWarnings = [
  /validateDOMNesting\(/,
  /Failed (prop|%s) type/,
  /recommend using the Leafygreen/,
  /The property `aria-controls` is required/,
  /For screen-reader accessibility, label or aria-labelledby/,
  [
    /Can't perform a React state update/,
    /./,
    /@leafygreen-ui\/(tooltip|toast)/,
  ],
  /react-16-node-hanging-test-fix/,
];

const console = globalThis.console;

for (const method of ['warn', 'error']) {
  /* eslint-disable no-console */
  const fn = console[method];
  console[method] = function (...args) {
    if (typeof args[0] === 'string') {
      if (
        ignoreLeafygreenWarnings.some((regex) => {
          return Array.isArray(regex)
            ? regex.every((r, index) => {
                return r.test(args[index]);
              })
            : regex.test(args[0]);
        })
      ) {
        return;
      }
    }
    return fn.apply(this, args);
  };
  /* eslint-enable no-console */
}
