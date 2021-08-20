var path = require('path');
var resourcePath = path.join(__dirname, '..', '..');

var ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

var CompileCache = require('hadron-compile-cache');
CompileCache.setHomeDirectory(resourcePath);
try {
  CompileCache.digestMappings = require('../../.compile-cache-mappings.json');
} catch (_) {
  CompileCache.digestMappings = {};
}
