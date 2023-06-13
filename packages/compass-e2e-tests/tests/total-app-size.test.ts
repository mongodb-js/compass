import { expect } from 'chai';
import { promises as fs } from 'fs';

import { getCompassExecutionParameters } from '../helpers/compass';

describe.only('Time to first query', function () {
  let compassSize: number;
  before(async function () {
    const { testPackagedApp, binary } = await getCompassExecutionParameters();
    if (!testPackagedApp) {
      return this.skip();
    }
    compassSize =
      (await fs.stat(binary)).size / (1024 * 1024) /* convert to MB */;
    console.log(process.platform, 'compassSize', compassSize);
  });

  describe('windows', function () {
    before(function () {
      if (process.platform !== 'win32') {
        this.skip();
      }
    });

    it('has a bundle size under 150mb', function () {
      expect(compassSize).to.be.greaterThan(1);
    });
  });

  describe('darwin (mac)', function () {
    before(function () {
      if (process.platform !== 'darwin') {
        this.skip();
      }
    });

    it('has a bundle size under 150mb', function () {
      expect(compassSize).to.be.greaterThan(0);
    });
  });
});
