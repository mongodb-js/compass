import { expect } from 'chai';
import {
  beforeTests,
  afterTests,
  afterTest,
  runCompassOnce,
} from '../helpers/compass';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import * as Selectors from '../helpers/selectors';
import type { CompassBrowser } from '../helpers/compass-browser';

async function getCheckboxAndBannerState(
  browser: CompassBrowser,
  setting: string
) {
  const settingSelector = `${Selectors.SettingsModal} [data-testid="setting-${setting}"]`;
  const checkbox = await browser.$(`${settingSelector} input[type="checkbox"]`);
  const disabled = await checkbox.getAttribute('disabled');
  const value = await checkbox.getAttribute('aria-checked'); // .getValue() always returns 'on'?
  const banner = await browser.$(
    `${settingSelector} [data-testid="set-cli-banner"], ${settingSelector} [data-testid="set-global-banner"], ${settingSelector} [data-testid="derived-banner"]`
  );
  const bannerText = (await banner.isExisting())
    ? await banner.getText()
    : null;
  return { disabled, value, bannerText };
}

describe('Global preferences', function () {
  let tmpdir: string;
  let i = 0;

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      `compass-global-preferences-${Date.now().toString(32)}-${++i}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
    process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING = path.join(
      tmpdir,
      'config'
    );
  });

  afterEach(async function () {
    await fs.rmdir(tmpdir, { recursive: true });
    delete process.env.COMPASS_GLOBAL_CONFIG_FILE_FOR_TESTING;
  });

  it('allows setting preferences through the CLI', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--no-enable-maps'],
    });
    try {
      const browser = compass.browser;
      await browser.openSettingsModal('Privacy');
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'enableMaps'
        );
        expect(value).to.equal('false');
        expect(disabled).to.equal(''); // null = missing attribute, '' = set
        expect(bannerText).to.include(
          'This setting cannot be modified as it has been set at Compass startup.'
        );
      }
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'trackUsageStatistics'
        );
        expect(value).to.equal('true');
        expect(disabled).to.equal(null);
        expect(bannerText).to.equal(null);
      }
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('allows setting preferences through the global configuration file (YAML)', async function () {
    await fs.writeFile(path.join(tmpdir, 'config'), 'enableMaps: false\n');
    const compass = await beforeTests();
    try {
      const browser = compass.browser;
      await browser.openSettingsModal('Privacy');
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'enableMaps'
        );
        expect(value).to.equal('false');
        expect(disabled).to.equal(''); // null = missing attribute, '' = set
        expect(bannerText).to.include(
          'This setting cannot be modified as it has been set in the global Compass configuration file.'
        );
      }
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'trackUsageStatistics'
        );
        expect(value).to.equal('true');
        expect(disabled).to.equal(null);
        expect(bannerText).to.equal(null);
      }
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('allows setting preferences through the global configuration file (EJSON)', async function () {
    await fs.writeFile(path.join(tmpdir, 'config'), '{"enableMaps": false}\n');
    const compass = await beforeTests();
    try {
      const browser = compass.browser;
      await browser.openSettingsModal('Privacy');
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'enableMaps'
        );
        expect(value).to.equal('false');
        expect(disabled).to.equal(''); // null = missing attribute, '' = set
        expect(bannerText).to.include(
          'This setting cannot be modified as it has been set in the global Compass configuration file.'
        );
      }
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'trackUsageStatistics'
        );
        expect(value).to.equal('true');
        expect(disabled).to.equal(null);
        expect(bannerText).to.equal(null);
      }
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('allows setting networkTraffic: false and reflects that in the settings modal', async function () {
    await fs.writeFile(path.join(tmpdir, 'config'), 'networkTraffic: false\n');
    const compass = await beforeTests();
    try {
      const browser = compass.browser;
      await browser.openSettingsModal('Privacy');
      const { disabled, value, bannerText } = await getCheckboxAndBannerState(
        browser,
        'enableMaps'
      );
      expect(value).to.equal('false');
      expect(disabled).to.equal(''); // null = missing attribute, '' = set
      expect(bannerText).to.include(
        'This setting cannot be modified as it has been set in the global Compass configuration file.'
      );
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('allows setting readOnly: true and reflects that in the settings modal', async function () {
    await fs.writeFile(path.join(tmpdir, 'config'), 'readOnly: true\n');
    const compass = await beforeTests();
    try {
      const browser = compass.browser;
      await browser.openSettingsModal('Privacy');
      await browser.clickVisible(Selectors.GeneralSettingsButton);
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'readOnly'
        );
        expect(value).to.equal('true');
        expect(disabled).to.equal(''); // null = missing attribute, '' = set
        expect(bannerText).to.include(
          'This setting cannot be modified as it has been set in the global Compass configuration file.'
        );
      }
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'enableShell'
        );
        expect(value).to.equal('false');
        expect(disabled).to.equal(''); // null = missing attribute, '' = set
        expect(bannerText).to.include(
          'This setting cannot be modified as it has been set in the global Compass configuration file.'
        );
      }
      {
        const shellSection = await browser.$(Selectors.ShellSection);
        const isShellSectionExisting = await shellSection.isExisting();
        expect(isShellSectionExisting).to.be.equal(false);
      }
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('allows showing version information', async function () {
    const { stdout, stderr } = await runCompassOnce(['--version']);
    expect(stdout.trim()).to.match(/^MongoDB Compass.*\d$/);
    expect(stderr).to.not.include('DeprecationWarning');
  });

  it('allows showing usage information', async function () {
    const { stdout, stderr } = await runCompassOnce(['--help']);
    expect(stdout).to.include('Available options');
    expect(stderr).to.not.include('DeprecationWarning');
  });

  it('redacts command line options after parsing', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['mongodb://usr:53cr3t@localhost:0/'],
    });
    try {
      // ps-list is ESM-only in recent versions.
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const processList: typeof import('ps-list') = await eval(
        `import('ps-list')`
      );
      const list = await processList.default();
      for (const proc of list) {
        expect(JSON.stringify(proc)).to.not.include('53cr3t');
      }
    } finally {
      await afterTests(compass, this.currentTest);
    }
  });
});
