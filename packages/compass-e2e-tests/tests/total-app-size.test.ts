import { expect } from 'chai';
import { promises as fs } from 'fs';

import {
  getCompassBuildMetadata,
  getCompassExecutionParameters,
} from '../helpers/compass';

describe.only('Total packaged app size', function () {
  let compassSize: number;
  before(async function () {
    const { testPackagedApp, binary } = await getCompassExecutionParameters();
    if (!testPackagedApp) {
      return this.skip();
    }
    const compassSize22 =
      (await fs.stat(binary)).size / (1024 * 1024); /* convert to MB */

    const { appPath } = await getCompassBuildMetadata();
    compassSize =
      (await fs.stat(appPath)).size / (1024 * 1024) /* convert to MB */;
    console.log('platform:', process.platform);
    console.log('file size:', compassSize, 'compassSize22:', compassSize22);
  });

  it('has a bundle size under greater than 50MB, less than 200MB', function () {
    // TODO: Check the bundle size on mac.
    if (process.platform !== 'darwin') {
      this.skip();
    }
    expect(compassSize).to.be.greaterThan(50);
    expect(compassSize).to.be.lessThan(200);
  });
});
