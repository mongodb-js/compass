if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const pkg = require('../../package.json');

require('../setup-hadron-distribution');

/**
 * Check if the distribution is defined, if not, we need to override
 * the product name of the app.
 */
if (!pkg.distribution) {
  const { app } = require('electron');
  app.setName(
    pkg.config.hadron.distributions[process.env.HADRON_DISTRIBUTION].productName
  );
}

// TODO (@imlucas): Revisit whether to ship this at same time or not.
//
const { dialog, clipboard, app } = require('electron');
const COMPASS_ICON = require('../icon');
const cleanStack = require('clean-stack');
const ensureError = require('ensure-error');

process.on('uncaughtException', err => {
  // eslint-disable-next-line no-console
  console.error('handling uncaughtException', err);
  err = ensureError(err);
  const stack = cleanStack(err.stack);

  var detail = '${app.getName()} version ${app.getVersion()}\n';
  detail += `Stacktrace:\n${stack}`;
  const message = `${app.getName()} has encountered an unexpected error`;

  // eslint-disable-next-line no-console
  console.error(`${message}: ${detail}`);

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

var path = require('path');
var resourcePath = path.join(__dirname, '..', '..');

var ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

require('./application').main();
