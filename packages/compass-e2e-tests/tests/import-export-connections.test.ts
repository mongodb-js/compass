import { expect } from 'chai';
import { beforeTests, afterTests, runCompassOnce } from '../helpers/compass';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import * as Selectors from '../helpers/selectors';
import type { Telemetry } from '../helpers/telemetry';
import { startTelemetryServer } from '../helpers/telemetry';

describe('Connection Import / Export', function () {
  let tmpdir: string;
  let i = 0;
  let originalDisableKeychainUsage: string | undefined;
  let telemetry: Telemetry;

  beforeEach(async function () {
    telemetry = await startTelemetryServer();

    tmpdir = path.join(
      os.tmpdir(),
      `compass-import-export-${Date.now().toString(32)}-${++i}`
    );
    await fs.mkdir(tmpdir, { recursive: true });

    originalDisableKeychainUsage =
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
    if (process.platform === 'linux' && process.env.CI) {
      // keytar is not working on Linux in CI, see
      // https://jira.mongodb.org/browse/COMPASS-6119 for more details.
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = 'true';
    }
  });

  afterEach(async function () {
    if (originalDisableKeychainUsage)
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE =
        originalDisableKeychainUsage;
    else delete process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;

    await fs.rmdir(tmpdir, { recursive: true });

    await telemetry.stop();
  });

  for (const variant of ['plaintext', 'encrypted', 'protected'] as const) {
    it(`can export and import connections through the CLI, ${variant}`, async function () {
      if (process.platform === 'win32') {
        // TODO(COMPASS-6269): these tests are very flaky on windows
        return this.skip();
      }

      const file = path.join(tmpdir, 'file');
      const favoriteName = 'Fav for export';
      const passphrase = 'pässwörd';
      const passphraseArgs =
        variant === 'encrypted'
          ? [`--passphrase=${passphrase}`]
          : variant === 'protected'
          ? ['--protectConnectionStrings']
          : [];
      const connectionString = 'mongodb://foo:bar@host:1234/';
      const connectionStringWithoutCredentials = 'mongodb://foo@host:1234/';

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
        const existingEventsCount = telemetry.events().length;
        // Export favorite, roughly verify file contents
        await runCompassOnce([
          `--export-connections=${file}`,
          ...passphraseArgs,
          '--trackUsageStatistics',
        ]);

        const contents = JSON.parse(await fs.readFile(file, 'utf8'));
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

        const newEvents = telemetry.events().slice(existingEventsCount);
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
        const existingEventsCount = telemetry.events().length;
        // Import favorite
        await runCompassOnce([
          `--import-connections=${file}`,
          ...passphraseArgs,
          '--trackUsageStatistics',
        ]);

        const newEvents = telemetry.events().slice(existingEventsCount);
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
        await browser.selectFavorite(favoriteName);
        await browser.clickVisible(
          '[data-testid="toggle-edit-connection-string"]'
        );
        await browser.clickVisible(
          '[data-testid="edit-uri-confirmation-modal"] button:first-of-type'
        );
        expect(
          await browser.$(Selectors.ConnectionStringInput).getValue()
        ).to.equal(
          variant === 'protected'
            ? connectionStringWithoutCredentials
            : connectionString
        );
        await browser.selectFavorite(favoriteName);
        await browser.selectConnectionMenuItem(
          favoriteName,
          Selectors.RemoveConnectionItem
        );
        await afterTests(compass);
      }
    });
  }
});
