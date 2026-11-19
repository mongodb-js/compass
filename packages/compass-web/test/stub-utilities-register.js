'use strict';
const Module = require('node:module');
const path = require('node:path');

// src/utilities.mts has to be an ES module (webpack needs `import.meta.url` to
// bundle each worker), but tests load sources as CommonJS through ts-node,
// which can't require it. jsdom has no Worker either, so tests get a
// startUtilities that starts nothing.
const filename = path.resolve(__dirname, '..', 'src', 'utilities.mts');
const stub = new Module(filename);
stub.filename = filename;
stub.loaded = true;
stub.exports = {
  startUtilities() {
    return { [Symbol.dispose]() {} };
  },
};
require.cache[filename] = stub;
