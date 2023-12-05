import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import { afterTest } from '../helpers/compass';
import { beforeTests, afterTests, runCompassOnce } from '../helpers/compass';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import * as Selectors from '../helpers/selectors';
import type { Telemetry } from '../helpers/telemetry';
import { startTelemetryServer } from '../helpers/telemetry';
import { UUID } from 'bson';
import type { CompassBrowser } from '../helpers/compass-browser';

describe('Connection Import / Export', function () {
  let tmpdir: string;
  let i = 0;
  let originalDisableKeychainUsage: string | undefined;
  let telemetry: Telemetry;

  const getTrackedEvents = (): any[] =>
    telemetry.events().filter((e: any) => e.type === 'track');

  before(function () {
    originalDisableKeychainUsage =
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
    if (process.platform === 'linux' && process.env.CI) {
      // keytar is not working on Linux in CI, see
      // https://jira.mongodb.org/browse/COMPASS-6119 for more details.
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = 'true';
    }
  });

  beforeEach(async function () {
    telemetry = await startTelemetryServer();

    tmpdir = path.join(
      os.tmpdir(),
      `compass-import-export-${Date.now().toString(32)}-${++i}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    await fs.rmdir(tmpdir, { recursive: true });

    await telemetry.stop();
  });

  after(function () {
    if (originalDisableKeychainUsage)
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE =
        originalDisableKeychainUsage;
    else delete process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
  });

  const connectionString = 'mongodb://foo:bar@host:1234/';
  const connectionStringWithoutCredentials = 'mongodb://foo@host:1234/';
  const favoriteName = 'Fav for export';
  const passphrase = 'pässwörd';
  const variants = ['plaintext', 'encrypted', 'protected'] as const;

  function verifyExportedFile(
    contents: any,
    variant: typeof variants[number]
  ): any {
    expect(contents.type).to.equal('Compass Connections');
    expect(contents.version.$numberInt).to.equal('1');
    expect(contents.connections).to.be.an('array');
    const conn = contents.connections.find(
      (conn: any) => conn?.favorite?.name === favoriteName
    );
    expect(conn).to.exist;
    if (variant === 'plaintext') {
      expect(conn.connectionOptions.connectionString).to.equal(
        connectionString
      );
    } else {
      expect(conn.connectionOptions.connectionString).to.equal(
        connectionStringWithoutCredentials
      );
    }
    if (variant === 'encrypted') {
      expect(conn.connectionSecrets).to.be.a('string');
    } else {
      expect(conn.connectionSecrets).to.not.exist;
    }
    return conn;
  }

  async function verifyAndRemoveImportedFavorite(
    browser: CompassBrowser,
    favoriteName: string,
    variant: typeof variants[number]
  ) {
    await browser.selectFavorite(favoriteName);
    await browser.clickVisible(Selectors.EditConnectionStringToggle);
    await browser.clickVisible(Selectors.ConfirmationModalConfirmButton());
    expect(await browser.getConnectFormConnectionString(true)).to.equal(
      variant === 'protected'
        ? connectionStringWithoutCredentials
        : connectionString
    );
    await browser.selectFavorite(favoriteName);
    await browser.selectConnectionMenuItem(
      favoriteName,
      Selectors.RemoveConnectionItem
    );
  }

  for (const variant of variants) {
    it(`can export and import connections through the CLI, ${variant}`, async function () {
      if (process.platform === 'win32') {
        // TODO(COMPASS-6269): these tests are very flaky on windows
        return this.skip();
      }

      const file = path.join(tmpdir, 'file');
      const passphraseArgs =
        variant === 'encrypted'
          ? [`--passphrase=${passphrase}`]
          : variant === 'protected'
          ? ['--protectConnectionStrings']
          : [];

      {
        // Open compass, create and save favorite
        const compass = await beforeTests();
        const { browser } = compass;
        await browser.setValueVisible(
          Selectors.ConnectionStringInput,
          connectionString
        );

        await browser.saveFavorite(favoriteName, 'color3');
        await afterTests(compass);
      }

      {
        const existingEventsCount = getTrackedEvents().length;
        // Export favorite, roughly verify file contents
        await runCompassOnce([
          `--export-connections=${file}`,
          ...passphraseArgs,
          '--trackUsageStatistics',
        ]);

        const contents = JSON.parse(await fs.readFile(file, 'utf8'));
        verifyExportedFile(contents, variant);

        const newEvents = getTrackedEvents().slice(existingEventsCount);
        expect(newEvents).to.have.lengthOf(1);
        expect(newEvents[0].event).to.equal('Connection Exported');
        expect(newEvents[0].properties.context).to.equal('CLI');
        // inequality since we may have lingering connections from other test runs
        expect(newEvents[0].properties.count).to.be.greaterThanOrEqual(1);
      }

      {
        // Open compass, delete favorite
        const compass = await beforeTests();
        const { browser } = compass;
        await browser.selectFavorite(favoriteName);
        await browser.selectConnectionMenuItem(
          favoriteName,
          Selectors.RemoveConnectionItem
        );
        await afterTests(compass);
      }

      {
        const existingEventsCount = getTrackedEvents().length;
        // Import favorite
        await runCompassOnce([
          `--import-connections=${file}`,
          ...passphraseArgs,
          '--trackUsageStatistics',
        ]);

        const newEvents = getTrackedEvents().slice(existingEventsCount);
        expect(newEvents).to.have.lengthOf(1);
        expect(newEvents[0].event).to.equal('Connection Imported');
        expect(newEvents[0].properties.context).to.equal('CLI');
        // inequality since we may have lingering connections from other test runs
        expect(newEvents[0].properties.count).to.be.greaterThanOrEqual(1);
      }

      {
        // Open compass, verify favorite exists
        const compass = await beforeTests();
        const { browser } = compass;
        await verifyAndRemoveImportedFavorite(browser, favoriteName, variant);
        await afterTests(compass);
      }
    });
  }

  context('importing and exporting through the UI', function () {
    let compass: Compass;
    let browser: CompassBrowser;
    let filename: string;

    before(async function () {
      // Open compass, create and save favorite
      compass = await beforeTests();
      browser = compass.browser;
      await browser.setValueVisible(
        Selectors.ConnectionStringInput,
        connectionString
      );

      // The connection list UI does not handle concurrent modifications to the
      // connections list well. Unfortunately, this includes the initial load,
      // which can realistically take longer than the startup time + the time
      // it takes to save a favorite in e2e tests, and so the result of that
      // initial load would override the favorite saving (from the point of view
      // of the connection sidebar at least). Add a timeout to make this less flaky. :(
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await browser.saveFavorite(favoriteName, 'color3');
    });

    afterEach(async function () {
      await afterTest(compass, this.currentTest);
    });

    after(async function () {
      await afterTests(compass);
    });

    for (const variant of variants) {
      it(`supports exporting and importing connections in ${variant} mode`, async function () {
        {
          // Make sure file exists so that the file picker works. We could also do work
          // similar to what we do for collection data export, where we add special listeners
          // in Compass for choosing a filename in save mode, but realistically
          // that doesn't test more of our code than just doing it this way.
          filename = path.join(tmpdir, 'connections.json');
          await fs.writeFile(filename, '');
        }

        // Open export modal
        {
          await browser.selectFavoritesMenuItem(
            Selectors.ExportConnectionsModalOpen
          );
          await browser.$(Selectors.ExportConnectionsModal).waitForDisplayed();
        }

        // Enter filename and adjust secrets handling
        {
          await browser.selectFile(
            Selectors.ExportImportConnectionsFileInput,
            filename
          );

          if (variant === 'protected') {
            await browser.clickParent(Selectors.ExportConnectionsRemoveSecrets);
          } else if (variant === 'encrypted') {
            await browser
              .$(Selectors.ExportConnectionsPassphrase)
              .setValue('s3cr3t');
          }
        }

        // Submit export and wait for result
        {
          await browser.waitUntil(async () => {
            return (
              (await browser
                .$(Selectors.ExportConnectionsSubmit)
                .getAttribute('aria-disabled')) === 'false'
            );
          });
          await browser.clickVisible(Selectors.ExportConnectionsSubmit);

          const toast = Selectors.ExportConnectionsSucceededToast;
          await browser.$(toast).waitForDisplayed();
          await browser.clickVisible(Selectors.closeToastButton(toast));
          await browser.$(toast).waitForDisplayed({ reverse: true });
        }

        const favoriteNameForImport = `favoriteName - ${variant}`;
        let favoriteIdForImport: string;
        {
          // Verify file contents
          const contents = JSON.parse(await fs.readFile(filename, 'utf8'));
          const conn = verifyExportedFile(contents, variant);

          // Write file back, with changed favorite name and changed id
          // so that we import a fresh favorite
          favoriteIdForImport = new UUID().toString();
          contents.connections = [
            {
              ...conn,
              id: favoriteIdForImport,
              favorite: { name: favoriteNameForImport },
            },
          ];
          await fs.writeFile(filename, JSON.stringify(contents));
        }

        // Open import modal
        {
          await browser.selectFavoritesMenuItem(
            Selectors.ImportConnectionsModalOpen
          );
          await browser.$(Selectors.ImportConnectionsModal).waitForDisplayed();
        }

        // Enter filename and adjust secrets handling
        {
          await browser.selectFile(
            Selectors.ExportImportConnectionsFileInput,
            filename
          );
          if (variant === 'encrypted') {
            await browser
              .$(Selectors.ImportConnectionsPassphrase)
              .setValue('s3cr3t');
          }
          // Wait until the favorite is listed in the import connection list
          const favoriteNameTableCell = browser.$(
            `${Selectors.ImportConnectionsModal} [data-testid="item-${favoriteIdForImport}-displayName"]`
          );
          await favoriteNameTableCell.waitForDisplayed();
          expect(await favoriteNameTableCell.getText()).to.equal(
            favoriteNameForImport
          );
        }

        // Submit import and wait for result
        {
          await browser.waitUntil(async () => {
            return (
              (await browser
                .$(Selectors.ImportConnectionsSubmit)
                .getAttribute('aria-disabled')) === 'false'
            );
          });
          await browser.clickVisible(Selectors.ImportConnectionsSubmit);

          const toast = Selectors.ImportConnectionsSucceededToast;
          await browser.$(toast).waitForDisplayed();
          await browser.clickVisible(Selectors.closeToastButton(toast));
          await browser.$(toast).waitForDisplayed({ reverse: true });
        }

        await verifyAndRemoveImportedFavorite(
          browser,
          favoriteNameForImport,
          variant
        );
      });
    }
  });
});
