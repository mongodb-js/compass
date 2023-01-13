import { expect } from 'chai';
import { beforeTests, afterTests } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

const connectionStringSuccess = 'mongodb://localhost:27091/test';
const connectionStringUnreachable =
  'mongodb://localhost:27091/test?tls=true&serverSelectionTimeoutMS=10';
const connectionStringInvalid = 'http://example.com';

describe('Automatically connecting from the command line', function () {
  let tmpdir: string;
  let i = 0;

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

  it('works with a connection string on the command line', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: [connectionStringSuccess],
      noWaitForConnectionScreen: true,
    });
    await compass.browser.waitForConnectionResult('success');
    await afterTests(compass, this.currentTest);
  });

  it('works with a connection file on the command line', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: [
        '--file',
        path.join(tmpdir, 'exported.json'),
        '--passphrase',
        'p4ssw0rd',
        '54dba8d8-fe31-463b-bfd8-7147517ce3ab',
      ],
      noWaitForConnectionScreen: true,
    });
    await compass.browser.waitForConnectionResult('success');
    await afterTests(compass, this.currentTest);
  });

  it('does not store the connection information as a recent connection', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: [connectionStringSuccess],
      noWaitForConnectionScreen: true,
      firstRun: true,
    });
    const browser = compass.browser;
    await browser.waitForConnectionResult('success');
    await browser.disconnect();
    await browser
      .$(Selectors.RecentConnections)
      .waitForDisplayed({ reverse: true });
    await afterTests(compass, this.currentTest);
  });

  it('fails with an unreachable URL', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: [
        '--file',
        path.join(tmpdir, 'exported.json'),
        '--passphrase',
        'p4ssw0rd',
        'd47681e6-1884-41ff-be8e-8843f1c21fd8',
      ],
    });
    const error = await compass.browser.waitForConnectionResult('failure');
    expect(error).to.match(
      /ECONNRESET|Server selection timed out|Client network socket disconnected/i
    );
    await afterTests(compass, this.currentTest);
  });

  it('fails with invalid auth', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: [
        '--file',
        path.join(tmpdir, 'exported.json'),
        '--passphrase',
        'p4ssw0rd',
        '54dba8d8-fe31-463b-bfd8-7147517ce3ab',
        '--username=doesnotexist',
        '--password=asdf/',
      ],
    });
    const error = await compass.browser.waitForConnectionResult('failure');
    expect(error).to.include('Authentication failed');
    const connectFormState = await compass.browser.getConnectFormState();
    expect(connectFormState.defaultUsername).to.equal('doesnotexist');
    expect(connectFormState.defaultPassword).to.equal('asdf/');
    await afterTests(compass, this.currentTest);
  });

  it('fails with an invalid connection string', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: [
        '--file',
        path.join(tmpdir, 'invalid.json'),
        '9beea496-22b2-4973-b3d8-03d5010ff989',
      ],
    });
    const error = await compass.browser.waitForConnectionResult('failure');
    expect(error).to.include('Invalid scheme');
    await afterTests(compass, this.currentTest);
  });

  it('fails with an invalid connections file', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: ['--file', path.join(tmpdir, 'doesnotexist.json')],
    });
    const error = await compass.browser.waitForConnectionResult('failure');
    expect(error).to.include('ENOENT');
    await afterTests(compass, this.currentTest);
  });

  it('enters auto-connect mode again if the window is hard reloaded', async function () {
    if (process.platform === 'win32' && (process.env.ci || process.env.CI)) {
      return this.skip(); // Doesn't work on Windows, but only in CI
    }
    const compass = await beforeTests({
      extraSpawnArgs: [connectionStringSuccess],
      noWaitForConnectionScreen: true,
    });
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
    await browser.waitForConnectionScreen();
    await afterTests(compass, this.currentTest);
  });

  it('does not enter auto-connect mode in new windows', async function () {
    const compass = await beforeTests({
      extraSpawnArgs: [connectionStringSuccess],
      noWaitForConnectionScreen: true,
    });
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

      const connectScreenElement = await browser.$(Selectors.ConnectSection);
      return await connectScreenElement.isDisplayed();
    });

    await browser.waitForConnectionScreen();
    await afterTests(compass, this.currentTest);
  });
});
