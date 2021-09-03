// @ts-check

/**
 * @param {ExtendedApplication} app
 */
exports.addCommands = function(app) {
  app.client.addCommand('waitForElement', require('./wait-for-element')(app));
  app.client.addCommand('waitUntilGone', require('./wait-until-gone')(app));
  app.client.addCommand('clickVisible', require('./click-visible')(app));
  app.client.addCommand('setValueVisible', require('./set-value-visible')(app));
  app.client.addCommand('waitForConnectionScreen', require('./wait-for-connection-screen')(app));
  app.client.addCommand('closeTourModal', require('./close-tour-modal')(app));
  app.client.addCommand('closePrivacySettingsModal', require('./close-privacy-settings-modal')(app));
  app.client.addCommand('doConnect', require('./do-connect')(app));
  app.client.addCommand('connectWithConnectionString', require('./connect-with-connection-string')(app));
  app.client.addCommand('connectWithConnectionForm', require('./connect-with-connection-form')(app));
  app.client.addCommand('disconnect', require('./disonnect')(app));
  app.client.addCommand('shellEval', require('./shell-eval')(app));
};
