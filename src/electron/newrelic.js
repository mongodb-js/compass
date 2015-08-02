/**
 * Sets environment variables to configure the newrelic agent
 * and require the newrelic module to start the agent.
 */
var _ = require('lodash');
var config = require('./config');
var debug = require('debug')('scout:electron:newrelic');

var ENV = {
  NEW_RELIC_ENABLED: config.get('newrelic:enabled'),
  NEW_RELIC_APP_NAME: config.get('newrelic:app_name'),
  NEW_RELIC_LICENSE_KEY: config.get('newrelic:license_key'),
  NEW_RELIC_USE_SSL: config.get('newrelic:use_ssl'),
  NEW_RELIC_LOG_ENABLED: config.get('newrelic:log_enabled'),
  NEW_RELIC_LOG_LEVEL: config.get('newrelic:log_level'),
  NEW_RELIC_LOG: config.get('newrelic:log_filepath'),
  NEW_RELIC_SLOW_SQL_ENABLED: false,
  NEW_RELIC_UTILIZATION_DETECT_AWS: false,
  NEW_RELIC_UTILIZATION_DETECT_DOCKER: false
};

_.assign(process.env, ENV);

if (config.get('newrelic:enabled')) {
  debug('newrelic enabled!  view log file at `%s`', config.get('newrelic:log_filepath'));
} else {
  debug('newrelic not enabled');
}

require('newrelic');
