import '../setup-hadron-distribution';
import './setup-csfle-library';
import { app } from 'electron';
import { handleUncaughtException } from './handle-uncaught-exception';
import { initialize } from '@electron/remote/main';

initialize();

// Name and version are setup outside of Application and before anything else so
// that if uncaught exception happens we already show correct name and version
app.setName(process.env.HADRON_PRODUCT_NAME);
// For webdriverio env we are changing appName so that keychain records do not
// overlap with anything else. Only appName should be changed for the webdriverio
// environment that is running tests, all relevant paths are configured from the
// test runner.
if (process.env.APP_ENV === 'webdriverio') {
  app.setName(`${app.getName()} Webdriverio`);
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error setVersion is not a public method
app.setVersion(process.env.HADRON_APP_VERSION);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('uncaughtException', handleUncaughtException);

void import('./application').then(({ CompassApplication }) => {
  void CompassApplication.init();
});
