import type { CompassBrowser } from '../helpers/compass-browser';
import {
  init,
  cleanup,
  screenshotIfFailed,
  positionalArgs,
  TEST_COMPASS_WEB,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { expect } from 'chai';
import { ConnectionString } from 'mongodb-connection-string-url';

describe('forceConnectionOptions', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    if (TEST_COMPASS_WEB) {
      // cli parameters not supported in compass-web
      this.skip();
    }

    compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([
        '--forceConnectionOptions.appName=testAppName',
      ]),
    });
    browser = compass.browser;
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
  });

  afterEach(async function () {
    await screenshotIfFailed(compass, this.currentTest);
  });

  it('forces the value of a specific connection option', async function () {
    const warnings = await browser
      .$('[data-testid="connection-warnings-summary"]')
      .getText();
    expect(warnings.trim()).to.equal(
      'Some connection options have been overridden through settings: appName'
    );
    await browser.connectWithConnectionString(
      'mongodb://127.0.0.1:27091/?appName=userSpecifiedAppName'
    );
    const result = await browser.shellEval('db.getMongo()._uri', true);
    expect(new ConnectionString(result).searchParams.get('appName')).to.equal(
      'testAppName'
    );
  });
});
