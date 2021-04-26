/**
 * @type {{ WorkerRuntime: typeof import('@mongosh/node-runtime-worker-thread').WorkerRuntime }}
 */
const { WorkerRuntime } = (() => {
  // Workaround for webpack require that overrides global require
  const req =
    // eslint-disable-next-line camelcase
    typeof __webpack_require__ === 'function'
      ? // eslint-disable-next-line camelcase, no-undef
      __non_webpack_require__
      : require;
  const realModulePath = req.resolve('@mongosh/node-runtime-worker-thread');
  // Runtime needs to be outside the asar bundle to function properly, so if we
  // resolved it inside of one, we will try to import it from outside (and hard
  // fail if this didn't work)
  if (/\.asar(?!\.unpacked)/.test(realModulePath)) {
    try {
      return req(realModulePath.replace('.asar', '.asar.unpacked'));
    } catch (e) {
      e.message +=
        '\n\n@mongosh/node-runtime-worker-thread module and all its dependencies needs to be unpacked before it can be used';
      throw e;
    }
  }

  return req(realModulePath);
})();

export { WorkerRuntime };
