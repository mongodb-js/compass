import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

/**
 * Compass Menu tests
 */
 describe('Menu', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  beforeEach(async function () {
    await browser.connectWithConnectionString('mongodb://localhost:27091/test');
  });

  after(function () {
    return afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
    await browser.disconnect();
  });

  describe('Settings', function () {
    it('opens settings modal', async function () {
      await browser.performActions([
        {
          type: 'key',
          id: 'keyboard',
          actions: [
            { type: 'keyDown', key: 'Command+,' },
          ]
        },
      ]);

      const modal = await browser.$(Selectors.SettingsModal);
      expect(modal).to.exist;
    });
  });
});