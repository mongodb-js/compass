const pkg = require('../package.json');

/**
 * @note: HADRON_DISTRIBUTION is set via command line args in dev, for example:
 * npm start compass-community
 */
if (!process.env.HADRON_DISTRIBUTION) {
  const distribution = pkg.distribution || pkg.config.hadron.distributions.default;
  process.env.HADRON_DISTRIBUTION = distribution;
}

const name = pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].name;
process.env.HADRON_PRODUCT = name || 'mongodb-compass';

if (pkg.distribution) {
  process.env.NODE_ENV = 'production';
}
