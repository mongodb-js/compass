'use strict';
const identityObjProxy = require('identity-obj-proxy');

const identityProxyExports = (module) => {
  module.exports = identityObjProxy;
};

require.extensions['.css'] = identityProxyExports;
require.extensions['.less'] = identityProxyExports;
