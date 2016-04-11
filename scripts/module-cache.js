var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var ModuleCache = require('hadron-module-cache');

function createModuleCache(CONFIG, done) {
  var appDir = path.join(CONFIG.resources, 'app');
  ModuleCache.create(appDir);
  var pkg = path.join(appDir, 'package.json');
  var metadata = require(pkg);
  _.each(metadata._compassModuleCache.folders, function(folder) {
    if (_.includes(folder.paths, '')) {
      folder.paths = [ '', 'test', 'src', 'src/app' ];
    }
  });
  fs.writeFile(pkg, JSON.stringify(metadata, null, 2), done);
}

module.exports = createModuleCache;
