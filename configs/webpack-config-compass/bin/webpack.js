#!/usr/bin/env node

// XXX: This mimics (simplified) webpack behavior, but makes sure that we are
// always resolving webpack-cli relative to the config. It is required to do, to
// avoid hoisting issues that can try to start e.g., webpack-dev-server with
// an unsupported version due to some webpack deps being hoisted and some not
// (also allows other packages to avoid depending on those)
//
// This can be removed immediately after we are done moving other plugins to the
// new webpack configuration.
const path = require('path');
process.env.WEBPACK_CLI_SKIP_IMPORT_LOCAL = true;
// Make sure webpack-cli and @webpack-cli/serve use webpack modules resolved
// from the config package to ensure that everything is running a version
// specified in a single place (this package)
process.env.WEBPACK_PACKAGE = path.dirname(
  require.resolve('webpack/package.json')
);
process.env.WEBPACK_DEV_SERVER_PACKAGE = path.dirname(
  require.resolve('webpack-dev-server/package.json')
);
const pkgPath = require.resolve('webpack-cli/package.json');
const pkg = require(pkgPath);

// We handle analyze through env vars instead of just allowing webpack to handle
// it because webpack default behaviour here is not that great: it will try to
// start multiple bundle analyzers on the same port and fail. You also can't
// pass custom args to webpack bin, it will fail with unknown argument error
const analyze = process.argv.includes('--analyze');

if (analyze) {
  process.env.ANALYZE = 'true';
  process.argv = process.argv.filter((key) => key !== '--analyze');
}

require(path.resolve(path.dirname(pkgPath), pkg.bin['webpack-cli']));
