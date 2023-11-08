declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

// Workaround for webpack require that overrides global require
function getRealRequire() {
  // eslint-disable-next-line camelcase
  return typeof __webpack_require__ === 'function'
    ? // eslint-disable-next-line camelcase, no-undef
      __non_webpack_require__
    : require;
}

/**
 * @type {{ WorkerRuntime: .WorkerRuntime }}
 */
const { WorkerRuntime } = (() => {
  const require = getRealRequire();
  const realModulePath = require.resolve('@mongosh/node-runtime-worker-thread');
  // Runtime needs to be outside the asar bundle to function properly, so if we
  // resolved it inside of one, we will try to import it from outside (and hard
  // fail if this didn't work)
  if (/\.asar(?!\.unpacked)/.test(realModulePath)) {
    try {
      return require(realModulePath.replace('.asar', '.asar.unpacked'));
    } catch (e: any) {
      e.message +=
        '\n\n@mongosh/node-runtime-worker-thread module and all its dependencies needs to be unpacked before it can be used';
      throw e;
    }
  }

  return require(realModulePath);
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
})() as typeof import('@mongosh/node-runtime-worker-thread');

export { WorkerRuntime };
