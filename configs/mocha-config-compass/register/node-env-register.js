'use strict';
process.env.NODE_ENV = 'test';

module.exports = {
  mochaHooks: {
    afterAll() {
      // TODO(COMPASS-11283): Towards the end of this integration when @mongodb-js/shell-bson-parser
      // is hoisted to the root of the repo, this resolution logic can be removed and
      // we can directly require('@mongodb-js/shell-bson-parser').terminateWorker();
      let parserPath;
      try {
        parserPath = require.resolve('@mongodb-js/shell-bson-parser', {
          paths: [process.cwd()],
        });
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') return;
        throw error;
      }
      require(parserPath)?.terminateWorker();
    },
  },
};
