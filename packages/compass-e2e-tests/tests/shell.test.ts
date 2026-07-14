import type { CompassBrowser } from '../helpers/compass-browser.ts';
import { startTelemetryServer } from '../helpers/telemetry.ts';
import type { Telemetry } from '../helpers/telemetry.ts';
import {
  init,
  cleanup,
  screenshotIfFailed,
  skipForWeb,
  TEST_COMPASS_WEB,
  getDefaultConnectionNames,
} from '../helpers/compass.ts';
import type { Compass } from '../helpers/compass.ts';
import * as Selectors from '../helpers/selectors.ts';
import chai from 'chai';
import { createSidebarDatabase } from '../helpers/mongo-clients.ts';
import { getShellOutputText } from '../helpers/commands/index.ts';
const { expect } = chai;

describe('Shell', function () {
  let compass: Compass;
  let browser: CompassBrowser;
  let telemetry: Telemetry;

  before(async function () {
    skipForWeb(this, 'shell not available on compass-web');

    telemetry = await startTelemetryServer();
    compass = await init(this.test?.fullTitle());
    browser = compass.browser;
    await browser.setFeature('enableShell', true);
    await browser.setupDefaultConnections();
  });

  beforeEach(async function () {
    await browser.disconnectAll();
  });

  after(async function () {
    if (TEST_COMPASS_WEB) {
      return;
    }

    await cleanup(compass);
    await telemetry.stop();
  });

  afterEach(async function () {
    await browser.setFeature('enableShell', true);
    await screenshotIfFailed(compass, this.currentTest);
  });

  describe('with a dataset', function () {
    beforeEach(async function () {
      // Create a database that has a name that isn't the default `test`.
      await createSidebarDatabase();

      await browser.connectToDefaults();

      await browser.navigateToCollectionTab(
        getDefaultConnectionNames(0),
        'my-sidebar-database',
        'my-sidebar-collection',
        'Documents'
      );
    });

    it('uses the database and collection it is opened from and renders all types', async function () {
      await browser.openShellFromCollectionHeader(getDefaultConnectionNames(0));

      await browser.waitUntil(async () => {
        const output = await getShellOutputText(browser);

        // Wait for the shell to use the database.
        return output.length === 2;
      });

      // Shell is focused, we run the default command
      // which will find documents in the sidebar collection.
      await browser.keys(['Enter']);

      // Wait for the find command to complete.
      await browser.waitUntil(async () => {
        const output = await getShellOutputText(browser);

        if (output.length > 3) {
          await browser
            .$(`${Selectors.ShellInput} [aria-label="Chevron Right Icon"]`)
            .waitForDisplayed();
          return true;
        }
        return false;
      });

      const output = await getShellOutputText(browser);
      expect(output.slice(0, 3)).to.deep.equal([
        'use("my-sidebar-database")',
        'switched to db my-sidebar-database',
        'db["my-sidebar-collection"].find()',
      ]);

      expect(output[3]).to.include(`'),
  docIndex: 0,
  double: 1.2,
  primitiveDouble: 1.2,
  doubleThatIsAlsoAnInteger: 1,
  string: 'Hello, world!',
  object: {
    key: 'value'
  },
  array: [
    1,
    2,
    3
  ],
  binData: Binary.createFromBase64('AQID', 0),
  objectId: ObjectId('642d766c7300158b1f22e975'),
  boolean: true,
  date: 2023-04-05T13:25:08.445Z,
  null: null,
  regex: BSONRegExp('pattern', 'i'),
  javascript: Code('function() {}'),
  symbol: 'symbol',
  javascriptWithScope: Code('function() {}', {
    foo: Int32(1),
    bar: 'a'
  }),
  int: 12345,
  primitiveInt: 12345,
  timestamp: Timestamp({ t: 1680701109, i: 1 }),
  long: Long('123456789123456789'),
  decimal: Decimal128('5.477284286264328586719275128128001E-4088'),
  minKey: MinKey(),
  maxKey: MaxKey(),`);

      expect(output[3]).to.include(`
  binaries: {
    generic: Binary.createFromBase64('AQID', 0),
    functionData: Binary.createFromBase64('//8=', 1),
    binaryOld: Binary.createFromBase64('//8=', 2),
    uuidOld: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 3),
    uuid: UUID('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),
    md5: MD5('73ffd26444b34c6990e8e7d1dfc035d4'),
    encrypted: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 6),
    compressedTimeSeries: Binary.createFromBase64('CQCKW/8XjAEAAIfx//////////H/////////AQAAAAAAAABfAAAAAAAAAAEAAAAAAAAAAgAAAAAAAAAHAAAAAAAAAA4AAAAAAAAAAA==', 7),
    custom: Binary.createFromBase64('//8=', 128)
  },
  dbRef: DBRef('namespace', ObjectId('642d76b4b7ebfab15d3c4a78'))
}`);
    });
  });

  it('has an info modal', async function () {
    await browser.connectToDefaults();

    await browser.openShellFromSidebar(getDefaultConnectionNames(0));
    await browser.clickVisible(Selectors.ShellInfoButton);

    await browser.waitForOpenModal(Selectors.ShellInfoModal);

    await browser.clickVisible(Selectors.ShellInfoModalCloseButton);
    await browser.waitForOpenModal(Selectors.ShellInfoModal, { reverse: true });

    await browser.closeShell(getDefaultConnectionNames(0));
  });

  it('shows and hides shell based on settings', async function () {
    await browser.connectToDefaults();

    expect(
      await browser.hasConnectionMenuItem(
        getDefaultConnectionNames(0),
        Selectors.OpenShellItem
      )
    ).to.be.equal(true);

    await browser.openSettingsModal();
    await browser.clickVisible(Selectors.GeneralSettingsButton);

    await browser.clickParent(Selectors.SettingsInputElement('enableShell'));
    await browser.clickVisible(Selectors.SaveSettingsButton);

    // wait for the modal to go away
    await browser.waitForOpenModal(Selectors.SettingsModal, { reverse: true });

    expect(
      await browser.hasConnectionMenuItem(
        getDefaultConnectionNames(0),
        Selectors.OpenShellItem
      )
    ).to.be.equal(false);
  });
});
