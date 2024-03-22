const childProcess = require('child_process');
const path = require('path');
const { promises: fs } = require('fs');
const { promisify } = require('util');

const execFile = promisify(childProcess.execFile);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function snykTest(cwd = process.cwd()) {
  const rootPath = path.resolve(__dirname, '..');
  const shortCwd = path.relative(rootPath, cwd);
  const outputPath = path.join(cwd, 'snyk-test.json');

  let execErr;

  try {
    if (!(await fileExists(path.join(cwd, `package.json`)))) {
      return;
    }

    console.info(`Testing ${shortCwd} ...`);
    await fs.mkdir(path.join(cwd, `node_modules`), { recursive: true });

    try {
      await execFile(
        'npx',
        [
          'snyk@latest',
          'test',
          '--all-projects',
          '--severity-threshold=low',
          '--dev',
          `--json-file-output=${outputPath}`,
        ],
        {
          cwd,
          maxBuffer: 50 /* MB */ * 1024 * 1024, // default is 1 MB
        }
      );
    } catch (err) {
      execErr = err;
    }

    console.info(`Testing ${shortCwd} done.`);
  } catch (err) {
    console.error(
      `Snyk failed to create a json report for ${shortCwd}:`,
      execErr
    );
    throw new Error(`Testing ${shortCwd} failed.`);
  }
}

snykTest();
