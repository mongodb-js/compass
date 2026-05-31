import { releaseCommand } from './release';
import fs from 'fs/promises';
import plist from 'plist';
import assert from 'assert';

import path from 'path';
import { getConfig } from '../../test/test-helpers';

// TODO: Investigate why it's failing in GitHub Actions CI
describe.skip('hadron-build::release', function () {
  let target: ReturnType<typeof getConfig>;
  before(async function () {
    if (
      // Functional tests on appveyor too slow. Skipping.
      process.platform === 'win32' ||
      // Fails too often on darwin due to hdiutil electron issue
      process.platform === 'darwin'
    ) {
      return;
    }
    await fs.rm(
      path.join(__dirname, '..', 'test', 'fixtures', 'hadron-app', 'dist'),
      { recursive: true, force: true }
    );
    target = getConfig();
    // TODO: this is not correct here. When unskipping this suite, this
    // will be resolved!
    await releaseCommand.handler({
      dir: target.dir,
      version: target.version,
      skip_installer: true,
    } as never);
  });

  it('should symlink `Electron` to the app binary on OS X', async function () {
    if (target.platform !== 'darwin') {
      return this.skip();
    }
    const bin = target.dest(
      `${target.productName}-darwin-${target.arch}`,
      `${target.productName}.app`,
      'Contents',
      'MacOS',
      'Electron'
    );
    try {
      await fs.access(bin);
    } catch {
      assert.fail(`Expected ${bin} to exist`);
    }
  });

  it('has the correct product name', function () {
    assert.equal(
      target.productName,
      'MongoDB Compass Enterprise super long test name Beta'
    );
  });

  it('sets the correct CFBundleIdentifier', async function () {
    if (target.platform !== 'darwin') {
      return this.skip();
    }
    const info = target.dest(
      `${target.productName}-darwin-${target.arch}`,
      `${target.productName}.app`,
      'Contents',
      'Info.plist'
    );
    const contents = await fs.readFile(info, 'utf8');
    const config = plist.parse(contents);
    assert.equal(config.CFBundleIdentifier, 'com.mongodb.hadron-testing.beta');
  });

  /**
   * TODO (imlucas) Compare from `CONFIG.icon` to
   * `path.join(CONFIG.resource, 'electron.icns')` (platform specific).
   * Should have matching md5 of contents.
   */
  it('should have the correct application icon', function () {});

  it.skip('should have all assets specified in the manifest', async function () {
    const missingAssets = await Promise.all(
      target.assets.map(async (asset) => {
        try {
          await fs.access(asset.path);
          return false;
        } catch {
          return true;
        }
      })
    );
    assert.deepStrictEqual(missingAssets, []);
  });
});
