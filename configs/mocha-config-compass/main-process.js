'use strict';
const { initialize, enable } = require('@electron/remote/main');
const { app } = require('electron');
app.on('web-contents-created', function (_, webContents) {
  enable(webContents);
});
initialize();
// Every compass plugin depends on compass-preferences-model, for a lot of them
// running tests in electron environments are either spamming "no handler
// registered" warnings or just not working when expected settings are missing
// or can't be updated. To handle that we are setting up preferences for every
// test environment, but making sure that it's in sandbox mode so that nothing
// is actually written to the disk when preferences change
process.env.COMPASS_TEST_USE_PREFERENCES_SANDBOX =
  process.env.COMPASS_TEST_USE_PREFERENCES_SANDBOX ?? 'true';
// NB: Not adding this as a dep in package.json to avoid circular dependency
require('compass-preferences-model').setupPreferences();
