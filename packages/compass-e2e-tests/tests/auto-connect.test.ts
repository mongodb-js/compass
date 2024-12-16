import { expect } from 'chai';
import type { Compass } from '../helpers/compass';
import {
  init,
  cleanup,
  positionalArgs,
  skipForWeb,
  screenshotPathName,
  connectionNameFromString,
} from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

const connectionStringSuccess = 'mongodb://127.0.0.1:27091/test';
const connectionNameSuccess = 'Success';
const connectionStringUnreachable =
  'mongodb://127.0.0.1:27091/test?tls=true&serverSelectionTimeoutMS=10';
const connectionNameUnreachable = 'Unreachable';
const connectionStringInvalid = 'http://example.com';
const connectionNameInvalid = 'Invalid';

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
    connectionName: string
  ) {
    await compass.browser.waitForConnectionResult(connectionName, {
      connectionStatus: 'success',
    });
    const result = await compass.browser.shellEval(
      connectionName,
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  }

  it('works with a connection string on the command line', async function () {
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
    });
    try {
      await waitForConnectionSuccessAndCheckConnection(
        compass,
        connectionNameFromString(connectionStringSuccess)
      );
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
        connectionNameUnreachable,
        { connectionStatus: 'failure' }
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
      const error = await browser.waitForConnectionResult(
        connectionNameSuccess,
        { connectionStatus: 'failure' }
      );
      expect(error).to.include('Authentication failed');
      await browser.clickVisible(Selectors.ConnectionToastErrorReviewButton);
      await browser.$(Selectors.ConnectionModal).waitForDisplayed();
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
        connectionNameInvalid,
        { connectionStatus: 'failure' }
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
    const connectionName =
      'no connection can appear because the file is invalid';
    try {
      const error = await compass.browser.waitForConnectionResult(
        connectionName,
        { connectionStatus: 'failure' }
      );
      expect(error).to.include('ENOENT');
    } finally {
      await cleanup(compass);
    }
  });

  it('enters auto-connect mode again if the window is hard reloaded', async function () {
    const compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
    });
    try {
      const { browser } = compass;
      await browser.waitForConnectionResult(
        connectionNameFromString(connectionStringSuccess),
        {
          connectionStatus: 'success',
        }
      );
      await browser.execute(() => {
        location.reload();
      });
      await browser.waitForConnectionResult(
        connectionNameFromString(connectionStringSuccess),
        {
          connectionStatus: 'success',
        }
      );
      await browser.disconnectAll();
      await browser.execute(() => {
        location.reload();
      });
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
    });
    try {
      const { browser } = compass;
      await browser.waitForConnectionResult(
        connectionNameFromString(connectionStringSuccess),
        {
          connectionStatus: 'success',
        }
      );

      // make sure the Welcome tab (if any) is gone
      await browser.closeWorkspaceTabs();

      await browser.execute(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        (require('electron').ipcRenderer as any).call(
          'test:show-connect-window'
        );
      });

      // Switch to the other window
      let currentWindow = await browser.getWindowHandle();
      let allWindows: string[] = [];
      await browser.waitUntil(async function () {
        allWindows = await browser.getWindowHandles();
        if (allWindows.length < 2) return false;
        currentWindow = allWindows.find((w) => w !== currentWindow) as string;
        await browser.switchToWindow(currentWindow);
        // the new window should open on the welcome tab
        const currentActiveTab = browser.$(
          Selectors.workspaceTab({ active: true })
        );
        const type = await currentActiveTab.getAttribute('data-type');
        return type === 'Welcome';
      });

      // no toasts to signify that anything is connecting
      const numToasts = await browser.$(Selectors.LGToastContainer).$$('div')
        .length;
      expect(numToasts).to.equal(0);

      // no active connections
      const numConnectionItems = await browser.$$(
        Selectors.Multiple.ConnectedConnectionItems
      ).length;
      expect(numConnectionItems).to.equal(0);
    } finally {
      await cleanup(compass);
    }
  });

  it('does not store the connection information as a recent connection', async function () {
    let browser;
    let compass = await init(this.test?.fullTitle(), {
      wrapBinary: positionalArgs([connectionStringSuccess]),
    });
    try {
      browser = compass.browser;
      await browser.waitForConnectionResult(
        connectionNameFromString(connectionStringSuccess),
        {
          connectionStatus: 'success',
        }
      );

      // close compass
      await cleanup(compass);

      // open compass again
      compass = await init(this.test?.fullTitle(), {
        // reuse the same user directory so we'd get the same connections
        firstRun: false,
      });

      browser = compass.browser;

      // there should be no connection items
      const numConnectionItems = await browser.$$(
        Selectors.Multiple.ConnectionItems
      ).length;
      expect(numConnectionItems).to.equal(0);

      await browser.$(Selectors.Multiple.NoDeploymentsText).waitForDisplayed();
      await browser
        .$(Selectors.Multiple.AddNewConnectionButton)
        .waitForDisplayed();
    } finally {
      await cleanup(compass);
    }
  });
});
