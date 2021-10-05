require('../setup-hadron-distribution');

const { app, dialog, clipboard } = require('electron');
const cleanStack = require('clean-stack');
const ensureError = require('ensure-error');
const COMPASS_ICON = require('../icon');

// Name and version are setup outside of Application and before anything else so
// that if uncaught exception happens we already show correct name and version
app.setName(process.env.HADRON_PRODUCT_NAME);
// For spectron env we are changing appName so that keychain records do not
// overlap with anything else. Only appName should be changed for the spectron
// environment that is running tests, all relevant paths are configured from the
// test runner.
if (process.env.APP_ENV === 'spectron') {
  app.setName(`${app.getName()} Spectron`);
}
app.setVersion(process.env.HADRON_APP_VERSION);

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('handling uncaughtException', err);
  err = ensureError(err);
  const stack = cleanStack(err.stack);

  var detail = `${app.getName()} version ${app.getVersion()}\n`;
  detail += `Stacktrace:\n${stack}`;
  const message = `${app.getName()} has encountered an unexpected error`;

  // eslint-disable-next-line no-console
  console.error(`${message}: ${detail}`);

  // Dialog can't be used until app emits a `ready` event
  app.on('ready', () => {
    const btnIndex = dialog.showMessageBox({
      type: 'error',
      buttons: [
        'OK',
        process.platform === 'darwin' ? 'Copy Error' : 'Copy error'
      ],
      icon: COMPASS_ICON,
      defaultId: 0,
      noLink: true,
      message: message,
      detail: detail
    });
    /**
     * TODO (@imlucas) Copy diagnostics to clipboard?
     * or prepopulated JIRA link?
     * https://confluence.atlassian.com/jirakb/creating-issues-via-direct-html-links-159474.html
     */
    if (btnIndex === 1) {
      clipboard.writeText(`${message}\n${stack}`);
      return;
    }

    if (btnIndex === 0) {
      app.quit();
      return;
    }
  });
});

require('./application').main();
