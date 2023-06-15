import { expect } from 'chai';
import { promises as fs } from 'fs';

import { getCompassExecutionParameters } from '../helpers/compass';

describe('Total packaged app size', function () {
  let compassSize: number;
  before(async function () {
    const { testPackagedApp, binary } = await getCompassExecutionParameters();
    if (!testPackagedApp) {
      return this.skip();
    }
    compassSize =
      (await fs.stat(binary)).size / (1024 * 1024) /* convert to MB */;
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
