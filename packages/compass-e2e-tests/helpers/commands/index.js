// @ts-check

/**
 * @param {ExtendedApplication} app
 */
exports.addCommands = function (app) {
  app.client.addCommand('existsEventually', require('./exists-eventually')(app));
  app.client.addCommand('clickVisible', require('./click-visible')(app));
  app.client.addCommand('setValueVisible', require('./set-value-visible')(app));
  app.client.addCommand(
    'waitForConnectionScreen',
    require('./wait-for-connection-screen')(app)
  );
  app.client.addCommand('closeTourModal', require('./close-tour-modal')(app));
  app.client.addCommand(
    'closePrivacySettingsModal',
    require('./close-privacy-settings-modal')(app)
  );
  app.client.addCommand('doConnect', require('./do-connect')(app));
  app.client.addCommand(
    'connectWithConnectionString',
    require('./connect-with-connection-string')(app)
  );
  app.client.addCommand(
    'connectWithConnectionForm',
    require('./connect-with-connection-form')(app)
  );
  app.client.addCommand('disconnect', require('./disconnect')(app));
  app.client.addCommand('shellEval', require('./shell-eval')(app));
  app.client.addCommand('navigateToCollectionTab', require('./navigate-to-collection-tab')(app));
};
