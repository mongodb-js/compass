'use strict';
process.env.NODE_ENV = 'test';

module.exports = {
  mochaHooks: {
    async afterAll() {
      await require('@mongodb-js/shell-bson-parser').terminateWorker();
    },
  },
};
