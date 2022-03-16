'use strict';

module.exports = {
  // this gives you the html report in coverage/lcov-report/index.html
  reporter: 'lcov',
  // set the root of the monorepo so it can find all the files rather than
  // looking in this directory
  cwd: '../..',
  // once you set cwd the other parts are relative to that
  tempDir: './packages/compass-e2e-tests/.nyc_output',
  reportDir: './packages/compass-e2e-tests/coverage',
};
