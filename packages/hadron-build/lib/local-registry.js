const path = require('path');
const execa = require('execa');
const getPort = require('get-port');
const waitOn = require('wait-on');
const uuid = require('uuid');
const os = require('os');
const fs = require('fs');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rmdir);

const monorepoPath = path.dirname(require.resolve('../../../package.json'));

function startServer(port, configPath) {
  return execa('npx', [
    'verdaccio',
    '--config', configPath,
    '--listen', port
  ], { cwd: monorepoPath, stdio: 'inherit' });
}

async function lernaPublish(registryAddress) {
  await execa('npx', [
    'lerna', 'publish', 'from-package',
    '--ignore-scripts',
    '--registry', registryAddress,
    '--yes'
  ], { cwd: monorepoPath, stdio: 'inherit' });
}

async function listPackages() {
  const { stdout } = await execa('npx', [
    'lerna', 'ls', '--json'
  ], { cwd: monorepoPath });
  console.log(stdout);
  return JSON.parse(stdout);
}

async function writeConfigFile(tempDir) {
  const storagePath = path.join(tempDir, 'storage');
  const packages = await listPackages();
  const packagesOverrides = packages.map(({name}) => `  '${name}': {access: $all, publish: $all}`).join('\n');

  const yaml = `
storage: "${storagePath}"
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
${packagesOverrides}
  '@*/*':
    access: $all
    publish: none
    proxy: npmjs
  '**':
    access: $all
    publish: none
    proxy: npmjs
logs: { type: stdout, level: error }`;

  const configPath = path.join(tempDir, 'config.yaml');
  await writeFile(configPath, yaml);
  return configPath;
}

async function createTempDir() {
  const tempDir = path.join(os.tmpdir(), uuid.v4());
  await mkdir(tempDir, { recursive: true });
  return tempDir;
}

async function startLocalRegistry() {
  const tempDir = await createTempDir();
  const configFilePath = await writeConfigFile(tempDir);
  const port = await getPort();
  const verdaccioProcess = startServer(port, configFilePath);

  const registryAddress = `http://localhost:${port}`;
  await waitOn({resources: [
    registryAddress
  ]});

  console.log('verdaccio ready on', registryAddress);

  await lernaPublish(registryAddress);

  const stopServer = async() => {
    verdaccioProcess.cancel();

    try {
      await verdaccioProcess;
    } catch (error) {
      console.log('verdaccio server terminated');
    }

    await rmdir(tempDir, { recursive: true });
  };

  return {
    address: registryAddress,
    stop: stopServer
  };
}

module.exports = startLocalRegistry;

