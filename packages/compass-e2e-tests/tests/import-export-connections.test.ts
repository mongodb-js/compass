import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import {
  TEST_MULTIPLE_CONNECTIONS,
  screenshotIfFailed,
  skipForWeb,
} from '../helpers/compass';
import {
  init,
  cleanup,
  runCompassOnce,
  subtestTitle,
} from '../helpers/compass';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import * as Selectors from '../helpers/selectors';
import type { Telemetry } from '../helpers/telemetry';
import { startTelemetryServer } from '../helpers/telemetry';
import { UUID } from 'bson';
import type { CompassBrowser } from '../helpers/compass-browser';
import Debug from 'debug';
const debug = Debug('import-export-connections');

function waitForConnections() {
  // The connection list UI does not handle concurrent modifications to the
  // connections list well. Unfortunately, this includes the initial load,
  // which can realistically take longer than the startup time + the time
  // it takes to save a favorite in e2e tests, and so the result of that
  // initial load would override the favorite saving (from the point of view
  // of the connection sidebar at least). Add a timeout to make this less flaky. :(
  return new Promise((resolve) => setTimeout(resolve, 5000));
}

/**
 * @securityTest Connection Import / Export Testing
 *
 * Compass allows users to export and import connections. Our tests verify that
 * the application informs the user about what this feature does, and in particular
 * that encryption for credentials is correctly applied.
 */
describe.only('Connection Import / Export', function () {
  let tmpdir: string;
  let i = 0;
  let telemetry: Telemetry;
  let isFirstRun = false;

  const getTrackedEvents = (): any[] =>
    telemetry.events().filter((e: any) => e.type === 'track');

  before(function () {
    skipForWeb(this, 'export connections not available in compass-web');
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
    await browser.selectConnection(favoriteName);
    await browser.clickVisible(Selectors.EditConnectionStringToggle);
    await browser.clickVisible(Selectors.confirmationModalConfirmButton());
    const cs = await browser.getConnectFormConnectionString(true);
    const expected =
      variant === 'protected'
        ? connectionStringWithoutCredentials
        : connectionString;
    expect(cs).to.equal(expected);

    if (TEST_MULTIPLE_CONNECTIONS) {
      // close the modal again so connectWithConnectionString sees the expected state
      await browser.clickVisible(Selectors.ConnectionModalCloseButton);

      await browser.selectConnectionMenuItem(
        favoriteName,
        Selectors.Multiple.RemoveConnectionItem
      );
    } else {
      await browser.selectConnection(favoriteName);

      await browser.selectConnectionMenuItem(
        favoriteName,
        Selectors.Single.RemoveConnectionItem
      );
    }

    await waitForConnections();
  }

  for (const variant of variants) {
    it(`can export and import connections through the CLI, ${variant}`, async function () {
      const file = path.join(tmpdir, 'file');
      const passphraseArgs =
        variant === 'encrypted'
          ? [`--passphrase=${passphrase}`]
          : variant === 'protected'
          ? ['--protectConnectionStrings']
          : [];

      debug('Favoriting connection');
      {
        // Open compass, create and save favorite
        const compass = await init(
          subtestTitle(this.test, 'Favoriting connection'),
          { firstRun: isFirstRun }
        );

        isFirstRun = false;

        try {
          const { browser } = compass;

          if (TEST_MULTIPLE_CONNECTIONS) {
            // open the connection modal so we can fill in the connection string
            await browser.clickVisible(
              Selectors.Multiple.SidebarNewConnectionButton
            );
          }

          await browser.setValueVisible(
            Selectors.ConnectionFormStringInput,
            connectionString
          );

          await waitForConnections();
          await browser.saveFavorite(
            favoriteName,
            TEST_MULTIPLE_CONNECTIONS ? 'Orange' : 'color3'
          );
          await waitForConnections();
        } finally {
          await cleanup(compass);
        }
      }

      debug('Exporting connection via CLI');
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

      debug('Removing connection');
      {
        // Open compass, delete favorite
        const compass = await init(
          subtestTitle(this.test, 'Removing connection'),
          { firstRun: false }
        );
        try {
          const { browser } = compass;
          if (TEST_MULTIPLE_CONNECTIONS) {
            await browser.selectConnectionMenuItem(
              favoriteName,
              Selectors.Multiple.RemoveConnectionItem
            );
          } else {
            await browser.selectConnection(favoriteName);

            await browser.selectConnectionMenuItem(
              favoriteName,
              Selectors.Single.RemoveConnectionItem
            );
          }
          await waitForConnections();
        } finally {
          await cleanup(compass);
        }
      }

      debug('Importing connection via CLI');
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

      debug('Verifying imported connection');
      {
        // Open compass, verify favorite exists
        const compass = await init(
          subtestTitle(this.test, 'Verifying imported connection'),
          { firstRun: false }
        );
        try {
          const { browser } = compass;
          await verifyAndRemoveImportedFavorite(browser, favoriteName, variant);
        } finally {
          await cleanup(compass);
        }
      }
    });
  }

  context('importing and exporting through the UI', function () {
    let compass: Compass;
    let browser: CompassBrowser;
    let filename: string;

    before(async function () {
      // Open compass, create and save favorite
      compass = await init(this.test?.fullTitle(), { firstRun: false });
      browser = compass.browser;

      if (TEST_MULTIPLE_CONNECTIONS) {
        // open the connection modal so we can fill in the connection string
        await browser.clickVisible(
          Selectors.Multiple.SidebarNewConnectionButton
        );
      }

      await browser.setValueVisible(
        Selectors.ConnectionFormStringInput,
        connectionString
      );

      await waitForConnections();

      await browser.saveFavorite(
        favoriteName,
        TEST_MULTIPLE_CONNECTIONS ? 'Orange' : 'color3'
      );

      // again: make sure the new favourite is there
      await waitForConnections();
    });

    afterEach(async function () {
      await screenshotIfFailed(compass, this.currentTest);
    });

    after(async function () {
      await cleanup(compass);
    });

    for (const variant of variants) {
      it(`supports exporting and importing connections in ${variant} mode`, async function () {
        const Sidebar = TEST_MULTIPLE_CONNECTIONS
          ? Selectors.Multiple
          : Selectors.Single;

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
          await browser.selectConnectionsMenuItem(
            Sidebar.ExportConnectionsModalOpen
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
            await browser.setValueVisible(
              Selectors.ExportConnectionsPassphrase,
              's3cr3t'
            );
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
          await browser.selectConnectionsMenuItem(
            Sidebar.ImportConnectionsModalOpen
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
            await browser.setValueVisible(
              Selectors.ImportConnectionsPassphrase,
              's3cr3t'
            );
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
