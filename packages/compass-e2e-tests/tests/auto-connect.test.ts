import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import {
  init,
  cleanup,
  positionalArgs,
  skipForWeb,
  TEST_MULTIPLE_CONNECTIONS,
  screenshotPathName,
  connectionNameFromString,
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
    // TODO(COMPASS-8010): pory these tests
    if (TEST_MULTIPLE_CONNECTIONS) {
      this.skip();
    }
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
    await compass.browser.waitForConnectionResult(false, 'success');
    const sidebarTitle = await compass.browser
      .$(Selectors.SidebarTitle)
      .getText();
    expect(sidebarTitle).to.eq(expectedTitle);
    const result = await compass.browser.shellEval(
      connectionNameFromString(connectionStringSuccess),
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
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
      const error = await compass.browser.waitForConnectionResult(
        false,
        'failure'
      );
      expect(error).to.match(
        /ECONNRESET|Server selection timed out|Client network socket disconnected/i
      );
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
      const error = await browser.waitForConnectionResult(false, 'failure');
      expect(error).to.include('Authentication failed');
      const connectFormState = await browser.getConnectFormState();
      expect(connectFormState.defaultUsername).to.equal('doesnotexist');
      expect(connectFormState.defaultPassword).to.equal('asdf/');
    } catch (err: any) {
      await browser.screenshot(screenshotPathName('fails with invalid auth'));
      throw err;
    } finally {
      await cleanup(compass);
    }
  });

  it('fails with an invalid connection string', async function () {
    const args = [
      `--file=${path.join(tmpdir, 'invalid.json')}`,
      '9beea496-22b2-4973-b3d8-03d5010ff989',
    ];
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs(args),
    });
    try {
      const error = await compass.browser.waitForConnectionResult(
        false,
        'failure'
      );
      expect(error).to.include('Invalid scheme');
    } finally {
      await cleanup(compass);
    }
  });

  it('fails with an invalid connections file', async function () {
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([
        `--file=${path.join(tmpdir, 'doesnotexist.json')}`,
      ]),
    });
    try {
      const error = await compass.browser.waitForConnectionResult(
        false,
        'failure'
      );
      expect(error).to.include('ENOENT');
    } finally {
      await cleanup(compass);
    }
  });

  it('enters auto-connect mode again if the window is hard reloaded', async function () {
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
      noWaitForConnectionScreen: true,
    });
    try {
      const { browser } = compass;
      await browser.waitForConnectionResult(false, 'success');
      await browser.execute(() => {
        location.reload();
      });
      await browser.waitForConnectionResult(false, 'success');
      await browser.disconnect();
      await browser.execute(() => {
        location.reload();
      });
      await browser.waitForConnectionScreen();
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
      await browser.waitForConnectionResult(false, 'success');
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

        const connectScreenElement = await browser.$(Selectors.ConnectSection);
        return await connectScreenElement.isDisplayed();
      });

      await browser.waitForConnectionScreen();
    } finally {
      await cleanup(compass);
    }
  });

  it('does not store the connection information as a recent connection', async function () {
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
      noWaitForConnectionScreen: true,
      firstRun: true,
    });
    try {
      const browser = compass.browser;
      await browser.waitForConnectionResult(false, 'success');
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
