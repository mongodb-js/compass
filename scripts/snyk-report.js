const childProcess = require('child_process');
const path = require('path');
const { promises: fs } = require('fs');
const { glob } = require('glob');
const { promisify } = require('util');
const execFile = promisify(childProcess.execFile);

async function snykReport() {
  const rootPath = path.resolve(__dirname, '..');

  console.log('Collecting all reports ...');

  const results = await Promise.all(
    (
      await glob('**/snyk-test.json', {
        ignore: 'node_modules',
        cwd: rootPath,
      })
    ).map((reportPath) => {
      return fs
        .readFile(path.join(rootPath, reportPath), 'utf-8')
        .then((content) => {
          return JSON.parse(content);
        });
    })
  );

  await fs.mkdir(path.join(rootPath, `.sbom`), { recursive: true });

  await fs.writeFile(
    path.join(rootPath, `.sbom/snyk-test-result.json`),
    JSON.stringify(results.flat(), null, 2)
  );

  console.log('Generating HTML result ...');

  await execFile(
    'npx',
    [
      'snyk-to-html',
      '-i',
      path.join(rootPath, '.sbom/snyk-test-result.json'),
      '-o',
      path.join(rootPath, `.sbom/snyk-test-result.html`),
    ],
    { cwd: rootPath }
  );

  console.log('Finished generating final report');
}

snykReport();
