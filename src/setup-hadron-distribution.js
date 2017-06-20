const pkg = require('../package.json');

/**
 * @note: HADRON_DISTRIBUTION is set via command line args in dev, for example:
 * npm start compass-enterprise
 */
if (!process.env.HADRON_DISTRIBUTION) {
  process.env.HADRON_DISTRIBUTION = pkg.distribution || pkg.config.hadron.distributions.default;
}

if (pkg.distribution) {
  process.env.NODE_ENV = 'production';
}
