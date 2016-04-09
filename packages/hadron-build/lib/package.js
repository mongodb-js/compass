var path = require('path');
var normalizePkg = require('normalize-package-data');
var pkg = require(path.join(process.cwd(), 'package.json'));
normalizePkg(pkg);

module.exports = pkg;
