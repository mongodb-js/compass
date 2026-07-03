import { expect } from 'chai';
import { serialize, runInfoCommand } from './info';
import { getTarget } from '../../test/test-helpers';

describe('commands/info', function () {
  describe('serialize', function () {
    it('omits function values', function () {
      const result = serialize({ a: 1, b: () => {}, c: 'hello' });
      expect(result).to.deep.equal({ a: 1, c: 'hello' });
    });

    it('omits undefined values', function () {
      const result = serialize({ a: 1, b: undefined });
      expect(result).to.deep.equal({ a: 1 });
    });

    it('omits regexp values', function () {
      const result = serialize({ a: 1, b: /regex/ });
      expect(result).to.deep.equal({ a: 1 });
    });

    it('keeps non-function, non-undefined values', function () {
      const result = serialize({ a: 1, b: 'str', c: true, d: [1, 2] });
      expect(result).to.deep.equal({ a: 1, b: 'str', c: true, d: [1, 2] });
    });
  });

  describe('runInfoCommand', function () {
    let initialHadronDistribution: string | undefined;
    before(function () {
      initialHadronDistribution = process.env.HADRON_DISTRIBUTION;
      process.env.HADRON_DISTRIBUTION = 'compass';
    });
    after(function () {
      process.env.HADRON_DISTRIBUTION = initialHadronDistribution;
    });
    it('generates expected output for expansions', async function () {
      const target = getTarget();
      const output = await runInfoCommand({
        dir: target.dir,
        version: target.version,
        platform: target.platform,
        arch: target.arch,
        format: 'json',
        flatten: true,
        out: undefined,
        print: false,
      });

      // These are the keys that are expected to be used in expansions.yml on evergreen
      const keys = [
        'app_archive_name',
        'windows_setup_filename',
        'windows_setup_label',
        'windows_msi_filename',
        'windows_msi_label',
        'windows_zip_filename',
        'windows_zip_label',
        'windows_releases_filename',
        'windows_releases_label',
        'windows_nupkg_full_filename',
        'windows_nupkg_full_label',
        'windows_zip_sign_filename',
        'windows_zip_sign_label',
        'windows_nupkg_full_sign_filename',
        'windows_nupkg_full_sign_label',
        'osx_dmg_filename',
        'osx_dmg_label',
        'osx_zip_filename',
        'osx_zip_label',
        'osx_zip_sign_filename',
        'osx_zip_sign_label',
        'linux_deb_filename',
        'linux_deb_sign_filename',
        'linux_rpm_filename',
        'linux_tar_filename',
        'linux_tar_sign_filename',
        'rhel_tar_filename',
        'rhel_tar_sign_filename',
      ];

      expect(Object.keys(JSON.parse(output))).to.include.members(keys);
    });
  });
});
