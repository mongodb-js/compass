require('../../src/app/setup-hadron-caches');

require('../../src/app/reflux-listen-to-external-store');

// Would be nice not to need this jQuery being present
window.jQuery = require('jquery');

if (!process.env.HADRON_DISTRIBUTION) {
  process.env.HADRON_DISTRIBUTION = 'compass-lite';
}

// Require our internal-packages so we can integration-test things fast,
// i.e. without requiring a full functional test
require('../../src/app/setup-package-manager');
