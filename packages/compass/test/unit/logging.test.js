const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { extractPartialLogFile } = require('../../src/main/logging');

describe('extractPartialLogFile', function() {
  let tmpdir;
  beforeEach(async function() {
    tmpdir = path.join(os.tmpdir(), 'compass-logging-test', 'test-' + Date.now());
    await fs.mkdir(tmpdir, { recursive: true });
  });
  afterEach(async function() {
    await fs.rmdir(tmpdir, { recursive: true });
  });

  it('should read an incomplete log file and write a decompressed version of it to a tmp file', async function() {
    const logFilePath = path.join(tmpdir, 'xyz.gz');
    await fs.writeFile(
      logFilePath,
      Buffer.from('H4sIAAAAAAAAA8pIzcnJVyjPL8pJUQQAAAD//w==', 'base64'));
    const tempFilePath = await extractPartialLogFile({
      logFilePath,
      app: {
        getPath() {
          return tmpdir;
        }
      }
    });
    const content = await fs.readFile(tempFilePath, 'utf8');
    assert.strictEqual(tempFilePath, path.join(tmpdir, 'compass_logs', 'compass_xyz.txt'));
    assert.strictEqual(content, 'hello world!');
  });
});
