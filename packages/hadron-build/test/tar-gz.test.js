const path = require('path');
const os = require('os');
const { promises: fs } = require('fs');
const { execFile: execFileCb } = require('child_process');
const util = require('util');
const execFile = util.promisify(execFileCb);
const tar = require('../lib/tar-gz');

describe('tar', function() {
  before(function() {
    if (os.platform === 'win32') {
      this.skip();
    }
  });

  let tmpdir;
  beforeEach(async function() {
    tmpdir = path.join(
      os.tmpdir(),
      'hadron-build-tar-test',
      `test-${Date.now()}`
    );

    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function() {
    await fs.rm(tmpdir, { recursive: true });
  });

  it('creates a tar archive from a directory, preserves the root and the permissions', async function() {
    const src = path.join(tmpdir, 'src');
    const extracted = path.join(tmpdir, 'extracted');
    await fs.mkdir(src, { recursive: true });
    await fs.mkdir(extracted, { recursive: true });

    const destFile = path.join(tmpdir, 'file.tar');
    const executableSrc = path.join(src, 'executable');

    await fs.writeFile(executableSrc, '');
    await fs.chmod(executableSrc, 0o755);
    await tar(src, destFile);
    await execFile('gunzip', ['-t', destFile]);
    await execFile('tar', ['-xvzf', destFile, '-C', extracted]);
    const extractedExecutable = path.join(extracted, 'src', 'executable');
    await fs.access(extractedExecutable, fs.constants.X_OK);
  });
});
