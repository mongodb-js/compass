import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { UserData } from './user-data';
import { expect } from 'chai';

describe('UserData', function () {
  let tempDir;

  beforeEach(async function () {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'compass-user-data-tests-')
    );
  });

  afterEach(async function () {
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (e) {
      // windows fails to clean those up sometimes, let's just skip it and move
      // forward with runnning the tests
    }
  });

  describe('read', function () {
    it('reads an existing file', async function () {
      await fs.writeFile(path.join(tempDir, 'file.json'), '{"x":1}');

      const userData = new UserData({ alternateDataRoot: tempDir });

      const parsed = await userData.read('file.json');

      expect(parsed).to.deep.equal({ x: 1 });
    });
  });

  describe('readAll', function () {
    it('reads all available files', async function () {
      await fs.writeFile(path.join(tempDir, 'file1.json'), '{"x":1}');
      await fs.writeFile(path.join(tempDir, 'file2.json'), '{"x":2}');

      const userData = new UserData({ alternateDataRoot: tempDir });

      const parsed = await userData.readAll();
      expect(parsed).to.deep.equal([{ x: 1 }, { x: 2 }]);
    });

    it('reads available files matching a glob pattern', async function () {
      await fs.writeFile(path.join(tempDir, 'file1.json'), '{"x":1}');
      await fs.writeFile(path.join(tempDir, 'file2.json'), '{"x":2}');

      const userData = new UserData({ alternateDataRoot: tempDir });

      const parsed = await userData.readAll('file1.*');
      expect(parsed).to.deep.equal([{ x: 1 }]);
    });
  });

  describe('write', function () {
    it('writes data to a file', async function () {
      const userData = new UserData({ alternateDataRoot: tempDir });
      await userData.write('file.json', { z: 1 });
      const parsed = await userData.readAll();
      expect(parsed).to.deep.equal([{ z: 1 }]);
    });
  });

  describe('delete', function () {
    it('deletes already-written files', async function () {
      const userData = new UserData({ alternateDataRoot: tempDir });
      await userData.write('file.json', { z: 1 });
      await userData.delete('file.json');
      const parsed = await userData.readAll();
      expect(parsed).to.deep.equal([]);
    });
  });
});
