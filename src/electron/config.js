var app;
try {
  app = require('app');
} catch (e) {
  app = null;
}
var nconf = require('nconf');
var path = require('path');
var pkg = require('../../package.json');
var untildify = require('untildify');
var debug = require('debug')('scout:electron:config');
var _ = require('lodash');
var features = {};

// ## feature.private
//
// *default* `off`
//
// Don't send any data to or use third-party services.  I'm
// working in a high security environment and this any data
// related to mongodb or my data in it cannot leave my workstation.
features.private = {
  enabled: false
};

// ## feature: setup
//
// *default* `off`
//
// Whether the app should show the setup wizard when the app starts up
// for the first time.
features.setup = {
  enabled: false,
  version: '1.0.0'
};
if (app) {
  features.setup.file = path.join(app.getPath('userData'), 'setup.json');
}

// ## feature: github
//
// *default* `off`
//
// Use GitHub account to fill out inputs in setup wizard and
// enables sharing via GitHub gists.
features.github = {
  scope: 'user:email,gist',
  // For pointing at a GitHub Enterprise installations
  host: 'api.github.com',
  // e.g. /api/v3 for some GitHub Enterprise installations
  github_path_prefix: null,
  protocol: 'https'
};

// ## feature: newrelic
//
// *default* `off`
//
// Send app metrics and exceptions to our New Relic account.
features.newrelic = {
  app_name: pkg.product_name,
  use_ssl: true,
  log_enabled: true,
  log_level: 'info'
};
if (app) {
  features.newrelic.log_filepath = path.join(app.getPath('temp'), 'newrelic.log');
}

// ## feature: bugsnag
//
// *default* `off`
features.bugsnag = {};

features.querybuilder = {
  enabled: true
};

features.intercom = {
  enabled: false,
  app_id: 'p57suhg7'
};


nconf
  .defaults(_.clone(features))
  // Allow setting config values via environment variables, e.g.
  // `private__enabled=1 npm start`
  .env('__');

if (process.env.NODE_ENV === 'development') {
  // Use the config json in the project's dropbox for easy
  // feature sharing on dev machines.
  nconf.file(untildify('~/Dropbox/10gen-scout/config/development.json'));
}

// Use a bundled `config.json`
// @todo (imlucas): Make `npm run release` write this file from
//   environment variables set on evergreen.
nconf.file('bundled', path.resolve(__dirname, '../../config.json'));
nconf.use('memory');

/**
 * @param {String} name - The feature name to check.
 * @return {Boolean} Whether the feature is enabled.
 */
/*eslint no-bitwise:0*/
var isEnabled = nconf.isFeatureEnabled = function(name) {
  return Boolean(~~nconf.get(name + ':enabled'));
};

// Use overrides to disable any features that are missing a dependency
// or should not be enabled if `private` is on.
nconf.overrides({
  newrelic: {
    enabled: !!nconf.get('newrelic:license_key') && !isEnabled('private')
  },
  github: {
    enabled: !!nconf.get('github:client_secret') && !isEnabled('private')
  },
  bugsnag: {
    enabled: !!nconf.get('bugsnag:token') && !isEnabled('private')
  },
  intercom: {
    enabled: isEnabled('intercom') && !isEnabled('private')
  },
  setup: {
    enabled: isEnabled('setup') && !isEnabled('private')
  }
});

var featureNames = _.keys(features);
var featuresEnabledMap = _.chain(featureNames)
  .map(function(name) {
    return [name, nconf.isFeatureEnabled(name)];
  })
  .zipObject()
  .value();

nconf.toJSON = function() {
  return _.chain(featureNames)
    .map(function(name) {
      return [name, nconf.get(name)];
    })
    .zipObject()
    .value();
};

debug('Config ready! Features enabled: ', featuresEnabledMap);
module.exports = nconf;
