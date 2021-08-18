/* eslint-disable no-console */
const path = require('path');
const execa = require('execa');
const getPort = require('get-port');
const waitOn = require('wait-on');
const uuid = require('uuid');
const os = require('os');
const fs = require('fs');
const util = require('util');
const lerna = require('./lerna');

const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rmdir);

function startServer(port, configPath) {
  return execa('npx', [
    'verdaccio',
    '--config', path.basename(configPath), // circumvent any issues with windows paths
    '--listen', port
  ], { cwd: path.dirname(configPath), stdio: 'inherit' });
}

async function writeConfigFile(tempDir) {
  // creates a verdaccio yaml config for the tmp folder
  // NOTE: in order to disable the uplink with npm for internal packages
  // we add overrides for each package.

  const packages = await lerna.listPackages();
  const packagesOverrides = packages.map(
    ({name}) => `  '${name}': {access: $all, publish: $all}`).join('\n');

  const yaml = `
storage: "storage"
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

  const stopServer = async() => {
    try {
      verdaccioProcess.cancel();

      try {
        await verdaccioProcess;
      } catch (error) {
        console.log('verdaccio server terminated');
      }
    } catch (error) {
      console.log('WARNING: closing verdaccio failed, skipping. Caused by:', error);
    }

    try {
      await rmdir(tempDir, { recursive: true });
    } catch (error) {
      console.log('WARNING: removing verdaccio storage and config failed, skipping. Caused by:', error);
    }
  };

  try {
    await waitOn({
      resources: [
        registryAddress
      ],
      timeout: 60000
    });

    console.log('verdaccio ready on', registryAddress);
  } catch (error) {
    await stopServer();
    throw error;
  }

  return {
    address: registryAddress,
    stop: stopServer
  };
}

module.exports = startLocalRegistry;
