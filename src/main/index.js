if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

var path = require('path');
var resourcePath = path.join(__dirname, '..', '..');

var ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

require('./application').main();
