import { expect } from 'chai';
import os from 'os';
import { promises as fs } from 'fs';

import { getOsInfo } from './get-os-info';

describe('get-os-info', function () {
  let osInfo;
  beforeEach(async function () {
    osInfo = await getOsInfo();
  });

  it('returns info from "os" module', function () {
    const { os_arch, os_type, os_version, os_release } = osInfo;
    expect({ os_arch, os_type, os_version, os_release }).to.deep.equal({
      os_arch: os.arch(),
      os_type: os.type(),
      os_version: os.version(),
      os_release: os.release(),
    });
  });

  describe('on linux', function () {
    beforeEach(function () {
      if (process.platform !== 'linux') {
        this.skip();
      }
    });

    it('returns info from /etc/releases', async function () {
      const etcRelease = await fs.readFile('/etc/os-release', 'utf-8');

      const releaseKv = etcRelease
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.split('='));

      const distroId = releaseKv.find(([k]) => k === 'ID')[1];
      const distroVer = releaseKv.find(([k]) => k === 'VERSION_ID')[1];

      // check that we test against actual values and not just an empty string
      expect(distroId).to.match(/^(rhel|ubuntu|debian)$/);
      expect(distroVer).to.match(/^\d+/);

      const { os_linux_dist, os_linux_release } = osInfo;
      expect({ os_linux_dist, os_linux_release }).to.deep.equal({
        os_linux_dist: distroId,
        os_linux_release: distroVer,
      });
    });
  });
});
