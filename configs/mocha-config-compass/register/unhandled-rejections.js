'use strict';
// https://github.com/mochajs/mocha/issues/2640
process.on('unhandledRejection', (reason) => {
  throw reason;
});
