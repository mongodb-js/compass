// @ts-check

/**
 * @param {ExtendedApplication} app
 */
exports.bindCommands = function (app, page) {
  const commands = {};

  const add = (name, path) => {
    const f = require(path);
    commands[name] = f(app, page, commands);
  };

  add('existsEventually', './exists-eventually');
  add('openTourModal', './open-tour-modal');
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
  add('runFindOperation', './run-find-operation');
  add('setAceValue', './set-ace-value');
  add('focusStageOperator', './focus-stage-operator');
  add('selectStageOperator', './select-stage-operator');
  add('closeCollectionTabs', './close-collection-tabs');
  add('setValidation', './set-validation');
  add('listenForTelemetryEvents', './listen-for-telemetry-events');
  add('selectFile', './select-file');
  add('waitUntil', './wait-until');

  return commands;
};
