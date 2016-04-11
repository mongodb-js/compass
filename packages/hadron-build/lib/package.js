'use strict';

const path = require('path');
const normalizePkg = require('normalize-package-data');

let get = (directory) => {
  const _path = path.join(directory, 'package.json');
  let pkg = require(_path);
  normalizePkg(pkg);
  pkg._path = _path;
  return pkg;
};

module.exports = get(process.cwd());
module.exports.get = get;
