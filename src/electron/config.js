var app = require('app');
var nconf = require('nconf');
var path = require('path');
var pkg = require('../../package.json');

var CONFIG_FILE = path.resolve(__dirname, '../config.json');

var defaults = {
  newrelic: {
    license_key: null,
    app_name: pkg.product_name,
    use_ssl: true,
    log_enabled: true,
    log_level: 'info',
    log_filepath: path.join(app.getPath('temp'), 'newrelic.log')
  }
};

nconf
  .file(CONFIG_FILE)
  .env('__')
  .argv()
  .use('memory')
  .defaults(defaults);

// Some versions of node leave the colon on the end.
nconf.overrides({
  newrelic: {
    enabled: !!nconf.get('newrelic:license_key')
  }
});

module.exports = nconf;
