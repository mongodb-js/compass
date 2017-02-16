require('../../src/app/setup-hadron-caches');

require('../../src/app/reflux-listen-to-external-store');

// Would be nice not to need this jQuery being present
window.jQuery = require('jquery');

// Require our internal-packages so we can integration-test things fast,
// i.e. without requiring a full functional test
require('../../src/app/setup-package-manager');
