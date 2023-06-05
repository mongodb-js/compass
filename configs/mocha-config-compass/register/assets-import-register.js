'use strict';
const filepathExports = (module, filepath) => {
  module.exports = require('path').relative(module.parent.path, filepath);
};

require.extensions['.jpg'] = filepathExports;
require.extensions['.jpeg'] = filepathExports;
require.extensions['.png'] = filepathExports;
require.extensions['.svg'] = filepathExports;
require.extensions['.gif'] = filepathExports;
require.extensions['.ico'] = filepathExports;
require.extensions['.woff'] = filepathExports;
require.extensions['.woff2'] = filepathExports;
require.extensions['.ttf'] = filepathExports;
require.extensions['.eot'] = filepathExports;
