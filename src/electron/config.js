var app = require('app');
var nconf = require('nconf');
var path = require('path');
var pkg = require('../../package.json');
var untildify = require('untildify');
var debug = require('debug')('scout:electron:config');


var defaults = {
  private: false,
  github: {
    scope: 'user:email,gist',
    // For pointing at a GitHub Enterprise installations
    host: 'api.github.com',
    // e.g. /api/v3 for some GitHub Enterprise installations
    github_path_prefix: null,
    protocol: 'https'
  },
  newrelic: {
    app_name: pkg.product_name,
    use_ssl: true,
    log_enabled: true,
    log_level: 'info',
    log_filepath: path.join(app.getPath('temp'), 'newrelic.log')
  }
};

nconf
  .defaults(defaults)
  .file(untildify('~/Dropbox/10gen-scout/config/development.json'))
  .env('__')
  .argv()
  .use('memory');

// Some versions of node leave the colon on the end.
nconf.overrides({
  newrelic: {
    enabled: !!nconf.get('newrelic:license_key') && !nconf.get('private')
  },
  github: {
    enabled: !!nconf.get('github:client_secret') && !nconf.get('private')
  }
});

debug('Features enabled', {
  github: nconf.get('github:enabled'),
  newrelic: nconf.get('newrelic:enabled')
});



module.exports = nconf;
