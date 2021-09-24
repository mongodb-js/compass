import fs from 'fs';
import path from 'path';
import os from 'os';
import { UserData } from './user-data';

describe('UserData', function () {
  let tempDir;

  beforeEach(function () {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'compass-user-data-tests-')
    );
  });

  afterEach(function () {
    try {
      fs.rmdirSync(tempDir, { recursive: true });
    } catch (e) {
      // windows fails to clean those up sometimes, let's just skip it and move
      // forward with runnning the tests
    }
  });

  describe('read', function () {
    it('reads an existing file', async function () {
      fs.writeFileSync(path.join(tempDir, 'file.json'), '{"x":1}');

      const userData = new UserData({ alternateDataRoot: tempDir });

      const parsed = await userData.read('file.json');

      expect(parsed).to.deep.equal({ x: 1 });
    });
  });
});
