'use strict';
const fs = require('fs');
const pkgUp = require('pkg-up');
const assert = require('assert');

// Fixup the bson v5 package.json so that we always get the CommonJS version.
// https://jira.mongodb.org/browse/NODE-5057 suggests doing that in the bson
// package itself.
const bson5packagejson = pkgUp.sync({ cwd: require.resolve('bson') });
const contents = JSON.parse(fs.readFileSync(bson5packagejson, 'utf8'));
assert(contents.version.startsWith('5.'));
contents['compass:exports'] = {
  import: contents.exports.require,
  require: contents.exports.require,
};
fs.writeFileSync(bson5packagejson, JSON.stringify(contents, null, 2));
