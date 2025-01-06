import { expect } from 'chai';
import path from 'path';
import {
  init,
  cleanup,
  screenshotIfFailed,
  runCompassOnce,
} from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import { startAutoUpdateServer } from '../helpers/mock-auto-update-server';

import type { Server } from 'http';

describe('Auto update', function () {
  let compass: Compass | undefined;
  let server: Server | undefined;

  beforeEach(async function () {});

  afterEach(async function () {
    delete process.env.HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE;

    if (server) {
      server.close();
    }
    if (compass) {
      await screenshotIfFailed(compass, this.currentTest);
      await cleanup(compass);
      compass = undefined;
    }
  });

  // TODO(COMPASS-8533): requires support for more installers
  it('notifies the user of a new version if auto update is not supported');

  it('tells the user when they are already on the latest version');

  it('automatically updates to the latest version if auto update is supported', async function () {
    // NOTE: This test is destructive by its very nature in that it replaces the
    // copy of Compass that it runs. Therefore it should be the last test we run
    // before re-installing Compass again.

    const port = 3000;

    const { stdout } = await runCompassOnce(['--version']);
    const match = stdout
      .trim()
      .match(/^MongoDB Compass( (Dev|Beta|Stable))? (.*)$/);
    const currentChannel = ((match && match[2]) ?? 'Stable').toLowerCase() as
      | 'dev'
      | 'beta'
      | 'stable';
    const currentVersion = match && match[3];
    expect(currentVersion).to.not.be.undefined;

    // TODO: calculate this
    const currentPlatform = 'darwin-arm64';

    // TODO: read this from the mocked-compass package.json
    const newVersion = '99.0.0-dev';

    // TODO: calculate this
    const filename = `mongodb-compass-${newVersion}-darwin-arm64.zip`;

    // start the auto-update server with info about mocked compass
    ({ server } = startAutoUpdateServer({
      // TODO: take into account the expected distribution
      expectedPlatform: currentPlatform,
      expectedChannel: currentChannel,
      expectedVersion: currentVersion as string,
      newVersion,
      filename,
      mockedDistDir: path.join(__dirname, '..', '..', 'mocked-compass', 'dist'),
      newNotes: 'something',
      port,
    }));

    // start compass
    process.env.HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE = `http://localhost:${port}`;
    compass = await init(this.test?.fullTitle(), { firstRun: true });

    const browser = compass.browser;

    console.log('pausing for a bit');
    await browser.pause(60_000);

    // wait for it to hit the auto-update endpoint
    // wait for it to get the toast
    // close compass
    // run compass on the command line
    // check that it wrote the expected file
  });
});
