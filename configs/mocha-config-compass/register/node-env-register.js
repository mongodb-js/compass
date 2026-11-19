'use strict';
process.env.NODE_ENV = 'test';

module.exports = {
  mochaHooks: {
    afterAll() {
      require('@mongodb-js/shell-bson-parser').terminateWorker();
    },
  },
};
