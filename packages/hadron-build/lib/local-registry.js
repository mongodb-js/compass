const path = require('path');
const execa = require('execa');
const getPort = require('get-port');
const waitOn = require('wait-on');
const monorepoPath = path.dirname(require.resolve('../../../package.json'));

function startServer(port) {
  return execa('npx', [
    'verdaccio',
    '--config', path.resolve(__dirname, 'verdaccio.yaml'),
    '--listen', port
  ], { cwd: monorepoPath, stdio: 'inherit' });
}

async function lernaPublish(registryAddress) {
  await execa('npx', [
    'lerna', 'publish', 'from-package',
    '--ignore-scripts',
    '--registry', registryAddress
    // , '--yes'
  ], { cwd: monorepoPath, stdio: 'inherit' });
}

async function main() {
  const port = await getPort();
  const verdaccioProcess = startServer(port);

  const registryAddress = `http://localhost:${port}`;
  await waitOn({resources: [
    registryAddress
  ]});

  console.log('verdaccio ready on', registryAddress);

  await lernaPublish(registryAddress);

  verdaccioProcess.cancel();

  try {
    await verdaccioProcess;
  } catch (error) {
    console.log('verdaccio server terminated');
  }
}

main();
