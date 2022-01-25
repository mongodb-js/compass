const path = require('path');
const os = require('os');
const fs = require('fs');

const tmpDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'saved-aggregations-queries-test')
);
process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH = tmpDir;


module.exports = require('@mongodb-js/mocha-config-compass/compass-plugin');
