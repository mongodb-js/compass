// @ts-check

/**
 * @param {ExtendedApplication} app
 */
exports.addCommands = function (app) {
  const add = (name, path) => {
    const f = require(path)(app);
    app.client.addCommand(name, f);
  };

  add('existsEventually', './exists-eventually');
  add('clickVisible', './click-visible');
  add('setValueVisible', './set-value-visible');
  add('waitForConnectionScreen', './wait-for-connection-screen');
  add('closeTourModal', './close-tour-modal');
  add('closePrivacySettingsModal', './close-privacy-settings-modal');
  add('doConnect', './do-connect');
  add('connectWithConnectionString', './connect-with-connection-string');
  add('connectWithConnectionForm', './connect-with-connection-form');
  add('disconnect', './disconnect');
  add('shellEval', './shell-eval');
  add('navigateToInstanceTab', './navigate-to-instance-tab');
  add('navigateToDatabaseTab', './navigate-to-database-tab');
  add('navigateToCollectionTab', './navigate-to-collection-tab');
};
