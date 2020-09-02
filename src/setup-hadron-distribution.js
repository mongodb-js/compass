const pkg = require('../package.json');

/**
 * @note: HADRON_DISTRIBUTION is set via command line args in dev, for example:
 * npm start compass-readonly
 */
if (!process.env.HADRON_DISTRIBUTION) {
  const distribution = pkg.distribution || pkg.config.hadron.distributions.default;
  process.env.HADRON_DISTRIBUTION = distribution;
}

const config = pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION];
const name = config.name;
const productName = config.productName;
const readonly = config.readonly;
const isolated = config.isolated;
process.env.HADRON_PRODUCT = name || 'mongodb-compass';
process.env.HADRON_PRODUCT_NAME = productName || 'MongoDB Compass';
process.env.HADRON_READONLY = readonly || false;
process.env.HADRON_ISOLATED = isolated || false;

if (!process.env.HARDRON_METRICS_BUGSNAG_KEY) {
  process.env.HARDRON_METRICS_BUGSNAG_KEY = config.metrics_bugsnag_key;
}

if (!process.env.HARDRON_METRICS_INTERCOM_APP_ID) {
  process.env.HARDRON_METRICS_INTERCOM_APP_ID = config.metrics_intercom_app_id;
}

if (!process.env.HARDRON_METRICS_STITCH_APP_ID) {
  process.env.HARDRON_METRICS_STITCH_APP_ID = config.metrics_stitch_app_id;
}

if (pkg.distribution) {
  process.env.NODE_ENV = 'production';
}
