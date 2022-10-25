import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { expect } from 'chai';
import * as Selectors from '../helpers/selectors';
import { createNumbersCollection } from '../helpers/insert-data';
import { getCheckboxAndBannerState } from '../helpers/get-checkbox-and-banner-state';

describe('readOnly: true / Read-Only Edition', function () {
  let tmpdir: string;
  let i = 0;

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      `compass-global-preferences-${Date.now().toString(32)}-${++i}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    await fs.rmdir(tmpdir, { recursive: true });
  });

  it('allows setting preferences through the CLI', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--read-only'],
    });
    try {
      const browser = compass.browser;
      await browser.openSettingsModal();
      {
        const { disabled, value, bannerText } = await getCheckboxAndBannerState(
          browser,
          'readOnly'
        );
        expect(value).to.equal('true');
        expect(disabled).to.equal(''); // null = missing attribute, '' = set
        expect(bannerText).to.include(
          'This setting cannot be modified as it has been set at Compass startup.'
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
          'This setting cannot be modified as it has been set at Compass startup.'
        );
      }
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('does not show plus icon on the siderbar to create a database', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--read-only'],
    });
    try {
      const browser = compass.browser;
      await browser.connectWithConnectionString(
        'mongodb://localhost:27091/test'
      );

      const sidebarCreateDatabaseButton = await browser.$(
        Selectors.SidebarCreateDatabaseButton
      );
      const isSidebarCreateDatabaseButtonExisting =
        await sidebarCreateDatabaseButton.isExisting();
      expect(isSidebarCreateDatabaseButtonExisting).to.be.equal(false);
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('does not show plus icon on the siderbar to create a collection', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--read-only'],
    });
    try {
      const browser = compass.browser;
      await createNumbersCollection();
      await browser.connectWithConnectionString(
        'mongodb://localhost:27091/test'
      );

      const dbName = 'test'; // existing db
      await browser.clickVisible(Selectors.SidebarFilterInput);
      const sidebarFilterInputElement = await browser.$(
        Selectors.SidebarFilterInput
      );
      await sidebarFilterInputElement.setValue(dbName);
      const dbElement = await browser.$(Selectors.sidebarDatabase(dbName));
      await dbElement.waitForDisplayed();
      await browser.hover(Selectors.sidebarDatabase(dbName));

      const sidebarCreateCollectionButton = await browser.$(
        Selectors.CreateCollectionButton
      );
      const isSidebarCreateCollectionButtonExisting =
        await sidebarCreateCollectionButton.isExisting();
      expect(isSidebarCreateCollectionButtonExisting).to.be.equal(false);
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('does not show create database button on instance tab', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--read-only'],
    });
    try {
      const browser = compass.browser;
      await browser.connectWithConnectionString(
        'mongodb://localhost:27091/test'
      );

      await browser.navigateToInstanceTab('Databases');

      const instanceCreateDatabaseButton = await browser.$(
        Selectors.InstanceCreateDatabaseButton
      );
      const isInstanceCreateDatabaseButtonExisting =
        await instanceCreateDatabaseButton.isExisting();
      expect(isInstanceCreateDatabaseButtonExisting).to.be.equal(false);
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('does not show create collection button on instance tab', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--read-only'],
    });
    try {
      const browser = compass.browser;
      await createNumbersCollection();
      await browser.connectWithConnectionString(
        'mongodb://localhost:27091/test'
      );

      await browser.navigateToCollectionTab('test', 'numbers', 'Documents');
      const addDataButton = await browser.$(Selectors.AddDataButton);
      const isAddDataButtonExisting = await addDataButton.isExisting();
      expect(isAddDataButtonExisting).to.be.equal(false);
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });

  it('does not show mongodb shell', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--read-only'],
    });
    try {
      const browser = compass.browser;
      await browser.connectWithConnectionString(
        'mongodb://localhost:27091/test'
      );

      const shellSection = await browser.$(Selectors.ShellSection);
      const isShellSectionExisting = await shellSection.isExisting();
      expect(isShellSectionExisting).to.be.equal(false);
    } finally {
      await afterTest(compass, this.currentTest);
      await afterTests(compass, this.currentTest);
    }
  });
});
