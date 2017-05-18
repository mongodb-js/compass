if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const pkg = require('../../package.json');

require('../setup-hadron-distribution');

/**
 * Check if the distribution is defined, if not, we need to override
 * the product name of the app.
 */
if (!pkg.distribution) {
  const { app } = require('electron');
  app.setName(pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].productName);
}

var path = require('path');
var resourcePath = path.join(__dirname, '..', '..');

var ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

require('./application').main();
