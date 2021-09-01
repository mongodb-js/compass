const path = require('path');
const os = require('os');

const DiskBackend = require('./disk');

function TestBackend(options) {
  return new DiskBackend(
    Object.assign({}, options, {
      basepath: process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH ||
        path.join(os.tmpdir(), 'compass-storage-mixin-tests')
    })
  );
}

TestBackend.enable = (basePath) => {
  process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST = 'true';
  process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH = basePath;
};

TestBackend.disable = () => {
  delete process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST;
  delete process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH;
};


module.exports = TestBackend;
