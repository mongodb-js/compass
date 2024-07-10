import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import {
  init,
  cleanup,
  positionalArgs,
  skipForWeb,
  TEST_MULTIPLE_CONNECTIONS,
  screenshotPathName,
} from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

const connectionStringSuccess = 'mongodb://127.0.0.1:27091/test';
const connectionStringSuccessTitle = '127.0.0.1:27091';
const connectionStringUnreachable =
  'mongodb://127.0.0.1:27091/test?tls=true&serverSelectionTimeoutMS=10';
const connectionStringInvalid = 'http://example.com';

describe('Automatically connecting from the command line', function () {
  let tmpdir: string;
  let i = 0;

  before(function () {
    skipForWeb(this, 'cli parameters not supported in compass-web');
  });

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      `compass-auto-connect-${Date.now().toString(32)}-${++i}`
    );
    await fs.mkdir(tmpdir, { recursive: true });
    await fs.writeFile(
      path.join(tmpdir, 'exported.json'),
      `
    {
      "type": "Compass Connections",
      "version": { "$numberInt": "1" },
      "connections": [{
        "id": "54dba8d8-fe31-463b-bfd8-7147517ce3ab",
        "connectionOptions": { "connectionString": ${JSON.stringify(
          connectionStringSuccess
        )} },
        "favorite": { "name": "Success" },
        "connectionSecrets": "AAGgVnjgNTtXvIX8mepITskKWud9fBtnoy2aJQvQkdh01mBG1903YlOuix4fhZRcBl8PsMbLr6laqhk2WjO1Uw=="
      }, {
        "id": "d47681e6-1884-41ff-be8e-8843f1c21fd8",
        "connectionOptions": { "connectionString": ${JSON.stringify(
          connectionStringUnreachable
        )} },
        "favorite": { "name": "Unreachable" },
        "connectionSecrets": "AAGgVnjgNTtXvIX8mepITskKWud9fBtnoy2aJQvQkdh01mBG1903YlOuix4fhZRcBl8PsMbLr6laqhk2WjO1Uw=="
      }]
    }
    `
    );
    await fs.writeFile(
      path.join(tmpdir, 'invalid.json'),
      `
    {
      "type": "Compass Connections",
      "version": { "$numberInt": "1" },
      "connections": [{
        "id": "9beea496-22b2-4973-b3d8-03d5010ff989",
        "connectionOptions": { "connectionString": ${JSON.stringify(
          connectionStringInvalid
        )} },
        "favorite": { "name": "Invalid" }
      }]
    }
    `
    );
  });

  afterEach(async function () {
    await fs.rmdir(tmpdir, { recursive: true });
  });

  async function waitForConnectionSuccessAndCheckConnection(
    compass: Compass,
    expectedTitle = connectionStringSuccessTitle
  ) {
    if (TEST_MULTIPLE_CONNECTIONS) {
      await compass.browser
        .$(Selectors.Multiple.ConnectionItemConnected)
        .waitForExist();
    } else {
      await compass.browser.waitForConnectionResult('success');
      const sidebarTitle = await compass.browser
        .$(Selectors.SidebarTitle)
        .getText();
      expect(sidebarTitle).to.eq(expectedTitle);
      const result = await compass.browser.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    }
  }

  it('works with a connection string on the command line', async function () {
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
      noWaitForConnectionScreen: true,
    });
    try {
      await waitForConnectionSuccessAndCheckConnection(compass);
    } finally {
      await cleanup(compass);
    }
  });

  it('works with a connection file on the command line', async function () {
    const args = [
      `--file=${path.join(tmpdir, 'exported.json')}`,
      '54dba8d8-fe31-463b-bfd8-7147517ce3ab',
      `--passphrase=p4ssw0rd`,
    ];

    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs(args),
      noWaitForConnectionScreen: true,
    });
    try {
      await waitForConnectionSuccessAndCheckConnection(compass, 'Success');
    } finally {
      await cleanup(compass);
    }
  });

  it('fails with an unreachable URL', async function () {
    const args = [
      `--file=${path.join(tmpdir, 'exported.json')}`,
      'd47681e6-1884-41ff-be8e-8843f1c21fd8',
      `--passphrase=p4ssw0rd`,
    ];
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs(args),
    });
    try {
      const error = await compass.browser.waitForConnectionResult('failure');
      // TODO(COMPASS-7397): There is no error text returned for multiple
      // connections at present, because the error toast does not appear in this
      // case.
      if (!TEST_MULTIPLE_CONNECTIONS) {
        expect(error).to.match(
          /ECONNRESET|Server selection timed out|Client network socket disconnected/i
        );
      }
    } finally {
      await cleanup(compass);
    }
  });

  it('fails with invalid auth', async function () {
    const args = [
      `--file=${path.join(tmpdir, 'exported.json')}`,
      '54dba8d8-fe31-463b-bfd8-7147517ce3ab',
      `--passphrase=p4ssw0rd`,
      '--username=doesnotexist',
      '--password=asdf/',
    ];
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs(args),
    });
    const { browser } = compass;
    try {
      const error = await browser.waitForConnectionResult('failure');

      // TODO(COMPASS-7397): the error toast doesn't appear in multiple
      // connections so we don't have access to the error message
      if (!TEST_MULTIPLE_CONNECTIONS) {
        expect(error).to.include('Authentication failed');
      }

      // TODO(COMPASS-7397): we don't pop up and pre-populate the form when
      // auto-connect fails for multiple connections
      if (!TEST_MULTIPLE_CONNECTIONS) {
        const connectFormState = await browser.getConnectFormState();
        expect(connectFormState.defaultUsername).to.equal('doesnotexist');
        expect(connectFormState.defaultPassword).to.equal('asdf/');
      }
    } catch (err: any) {
      await browser.screenshot(screenshotPathName('fails with invalid auth'));
      throw err;
    } finally {
      await cleanup(compass);
    }
  });

  it('fails with an invalid connection string', async function () {
    // TODO(COMPASS-7397): this just silently fails in the multiple connections
    // case
    if (TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }

    const args = [
      `--file=${path.join(tmpdir, 'invalid.json')}`,
      '9beea496-22b2-4973-b3d8-03d5010ff989',
    ];
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs(args),
    });
    try {
      const error = await compass.browser.waitForConnectionResult('failure');
      expect(error).to.include('Invalid scheme');
    } finally {
      await cleanup(compass);
    }
  });

  it('fails with an invalid connections file', async function () {
    // TODO(COMPASS-7397): this just silently fails in the multiple connections
    // case
    if (TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }

    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([
        `--file=${path.join(tmpdir, 'doesnotexist.json')}`,
      ]),
    });
    try {
      const error = await compass.browser.waitForConnectionResult('failure');
      expect(error).to.include('ENOENT');
    } finally {
      await cleanup(compass);
    }
  });

  it('enters auto-connect mode again if the window is hard reloaded', async function () {
    // TODO(COMPASS-7397): Doesn't work in the multiple connections world yet.
    if (TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }

    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
      noWaitForConnectionScreen: true,
    });
    try {
      const { browser } = compass;
      await browser.waitForConnectionResult('success');
      await browser.execute(() => {
        location.reload();
      });
      await browser.waitForConnectionResult('success');
      await browser.disconnect();
      await browser.execute(() => {
        location.reload();
      });
      if (TEST_MULTIPLE_CONNECTIONS) {
        await browser.waitForConnectionResult('success');
      } else {
        await browser.waitForConnectionScreen();
      }
    } catch (err: any) {
      await compass.browser.screenshot(
        screenshotPathName(
          'enters auto-connect mode again if the window is hard reloaded'
        )
      );
      throw err;
    } finally {
      await cleanup(compass);
    }
  });

  it('does not enter auto-connect mode in new windows', async function () {
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
      noWaitForConnectionScreen: true,
    });
    try {
      const { browser } = compass;
      await browser.waitForConnectionResult('success');
      await browser.execute(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('electron').ipcRenderer.call('test:show-connect-window');
      });

      // Switch to the other window
      let currentWindow = await browser.getWindowHandle();
      let allWindows: string[] = [];
      await browser.waitUntil(async function () {
        allWindows = await browser.getWindowHandles();
        if (allWindows.length < 2) return false;
        currentWindow = allWindows.find((w) => w !== currentWindow) as string;
        await browser.switchToWindow(currentWindow);

        if (TEST_MULTIPLE_CONNECTIONS) {
          // the connection does still show up in the list, but remains disconnected
          // (ideally this would check over time because what if we're just too quick?)
          await browser
            .$(Selectors.Multiple.ConnectionItemDisconnected)
            .waitForDisplayed();
          !(await browser
            .$(Selectors.Multiple.ConnectionItemConnected)
            .isExisting());
          !(await browser
            .$(Selectors.Multiple.ConnectionItemFailed)
            .isExisting());

          return true;
        } else {
          const connectScreenElement = await browser.$(
            Selectors.ConnectSection
          );
          return await connectScreenElement.isDisplayed();
        }
      });

      await browser.waitForConnectionScreen();
    } finally {
      await cleanup(compass);
    }
  });

  it('does not store the connection information as a recent connection', async function () {
    // TODO(COMPASS-7397): Right now in multiple connections we store every
    // connection so it will be in the sidebar after disconnecting. We'd also
    // need a different assertion because connections have to show up in the
    // sidebar anyway.
    if (TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }

    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
      noWaitForConnectionScreen: true,
      firstRun: true,
    });
    try {
      const browser = compass.browser;
      await browser.waitForConnectionResult('success');
      await browser.disconnect();

      // this is not the ideal check because by default the recent connections
      // list doesn't exist either
      await browser
        .$(Selectors.Single.RecentConnections)
        .waitForDisplayed({ reverse: true });
    } finally {
      await cleanup(compass);
    }
  });
});
