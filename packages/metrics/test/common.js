var pkg = require('../package.json');
var process = require('process');

module.exports = {
  appName: pkg.name,
  appVersion: pkg.version,
  appPlatform: process.platform,
  userId: '121d91ad-15a4-47eb-977d-f279492932f0'
};
