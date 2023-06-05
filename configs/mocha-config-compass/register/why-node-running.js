'use strict';
require('why-is-node-running/include');
exports.mochaHooks = {
  afterAll() {
    if (process.argv.includes('--watch')) {
      return;
    }
    const timeout = setTimeout(() => {
      console.log(
        "if the process still running, run kill -SIGINFO %s to see what's keeping it",
        process.pid
      );
    }, 10000);
    timeout.unref?.();
  },
};
