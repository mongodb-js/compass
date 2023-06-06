'use strict';
require('ts-node').register({
  files: true,
  transpileOnly: true,
  compilerOptions: {
    allowJs: true,
    jsx: 'react',
  },
});

// XXX: @cspotcode/source-map-support library used by ts-node internally causes
// issues when running tests in electron renderer environment due to webassembly
// module registering that it's trying to run going out of allowed size boundary
// for the sync compilation resulting in the following error:
//
//   Uncaught RangeError: WebAssembly.Compile is disallowed on the main thread,
//   if the buffer size is larger than 4KB. Use WebAssembly.compile, or compile
//   on a worker thread.
//
// There is no way to disable it through the library configuration so the only
// thing we can do is to manually uninstall it after registering ts-node if we
// can detect that we are in the electron renderer / web runtime
if (
  process.env.COMPASS_TEST_DISABLE_SOURCEMAPS === 'true' ||
  typeof process === 'undefined' ||
  process.type === 'renderer'
) {
  require('@cspotcode/source-map-support').uninstall();
}
