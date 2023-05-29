#!/usr/bin/env node

'use strict';

const path = require('path');
const crossSpawn = require('cross-spawn');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const net = require('net');
const findUp = require('find-up');
const yargsParser = require('yargs-parser');
const { rimraf } = require('rimraf');
const glob = require('glob');

const isDebug = !!(process.env.DEBUG || '')
  .split(',')
  .find((x) => x === 'mongodb-test-server');

const instancesRoot = path.join(
  path.dirname(findUp.sync('package-lock.json')),
  '.testserver'
);

function getMongodbRunnerPath() {
  const packagePath = require.resolve('mongodb-runner');
  const packageDir = path.dirname(packagePath);
  const binaryPath = path.join(packageDir, 'bin', 'mongodb-runner.js');
  return binaryPath;
}

function getInstanceDataPath(instanceName, port) {
  return path.join(instancesRoot, 'dbs', `${instanceName}-${port}`);
}

function getInstanceLogPath(instanceName, port) {
  return path.join(
    instancesRoot,
    'logs',
    `testserver-${instanceName}-${port}-${Date.now()}.log`
  );
}

function initializeLogDir() {
  fs.mkdirSync(path.join(instancesRoot, 'logs'), { recursive: true });
}

function getInstancePidsPath(instanceName, port) {
  return path.join(instancesRoot, 'pids', `${instanceName}-${port}`);
}

function initializePidsDir(instanceName, port) {
  fs.mkdirSync(getInstancePidsPath(instanceName, port), { recursive: true });
}

function portPath(instanceName) {
  return path.join(instancesRoot, 'ports', `${instanceName}.port`);
}

function writePort(instanceName, port) {
  const portFilePath = portPath(instanceName);
  fs.mkdirSync(path.dirname(portFilePath), { recursive: true });
  fs.writeFileSync(portFilePath, JSON.stringify({ port: port }));
}

function readPort(instanceName) {
  return JSON.parse(fs.readFileSync(portPath(instanceName), 'utf-8')).port;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readWorkerPids(instanceName, port) {
  return fs
    .readdirSync(getInstancePidsPath(instanceName, port))
    .filter((x) => x.endsWith('.pid'))
    .map((filename) =>
      fs
        .readFileSync(
          path.join(getInstancePidsPath(instanceName, port), filename),
          'utf-8'
        )
        .trim()
    );
}

function readServerPids(instanceName, port) {
  const instanceDataPath = getInstanceDataPath(instanceName, port);
  return glob
    .sync('**/mongo[d|s].lock', {
      cwd: instanceDataPath,
    })
    .map((filename) =>
      fs.readFileSync(path.join(instanceDataPath, filename), 'utf-8').trim()
    );
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (e.code === 'EPERM') {
      console.info('Got EPERM checking pid = ', pid);
      return true;
    } else if (e.code === 'ESRCH') {
      return false;
    } else {
      throw e;
    }
  }
}

async function retry(condition) {
  let attempt = 0;

  while (++attempt <= 10) {
    try {
      await condition();
      return;
    } catch (e) {
      console.info(`Attempt ${attempt} failed`, e);
    }

    await sleep(5000);
  }

  throw new Error('All the attempts failed.');
}

async function waitForStopped(port) {
  console.info(`\nWaiting for ${port} to be closed`);
  await retry(() => assertPortClosed(+port));
  console.info(`\n${port} is closed`);
}

async function waitForRunning(port) {
  const url = `mongodb://localhost:${port}`;
  const client = new MongoClient(url);

  console.info(`\nWaiting for ${url} to be available`);
  try {
    await retry(() => client.connect());
  } finally {
    client.close();
  }

  console.info(`\n${url} available.`);
}

function assertPortOpen(port) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(100);
    client.on('connect', function () {
      console.debug('connect', port, 'succeeded');
      client.end();
      resolve();
    });

    client.on('timeout', function () {
      if (isDebug) {
        console.debug('Timeout, port should be closed.');
      }

      client.destroy();
      reject(new Error(`port ${port} is closed`));
    });

    client.on('error', function (err) {
      if (isDebug) {
        console.debug('port is closed.', err);
      }

      try {
        client.destroy();
      } catch (e) {
        //
      }

      reject(err);
    });

    client.connect(port, 'localhost');
  });
}

async function assertPortClosed(port) {
  const isOpen = await assertPortOpen(port)
    .then(() => true)
    .catch(() => false);

  if (isOpen) {
    throw new Error(`port ${port} is open`);
  }
}

async function start(instanceName, options) {
  const yargsOptions = yargsParser(options);
  const port = +yargsOptions.port;

  // make sure other instances are not running on the same port
  // before doing anything
  await waitForStopped(port);
  initializeLogDir();
  initializePidsDir(instanceName, port);

  const instanceDataPath = getInstanceDataPath(instanceName, port);

  // nuke data from previous runs:
  await rimraf(instanceDataPath);
  writePort(instanceName, port);

  const mongodbRunnerArgs = [
    'start',
    `--dbpath=${getInstanceDataPath(instanceName, port)}`,
    `--logpath=${getInstanceLogPath(instanceName, port)}`,
    `--port=${port}`,
    `--pidpath=${getInstancePidsPath(instanceName, port)}`,
    ...options.filter(
      (opt, i) => !(opt.startsWith('--port') || options[i - 1] === '--port')
    ),
  ];

  const mongodbRunnerPath = getMongodbRunnerPath();
  console.info('Running', mongodbRunnerPath, mongodbRunnerArgs);
  crossSpawn.sync(mongodbRunnerPath, mongodbRunnerArgs, { stdio: 'inherit' });
  await waitForRunning(port);
}

async function stop(instanceName) {
  const port = readPort(instanceName);
  const mongodbRunnerWorkerPids = readWorkerPids(instanceName, port);
  const serverPids = readServerPids(instanceName, port);

  try {
    await assertPortOpen(port);
  } catch (err) {
    console.info(
      'Server port is already closed, the server has been killed or crashed',
      err
    );
  }

  const processes = [...mongodbRunnerWorkerPids, ...serverPids];
  await sendSignalToAll(processes, 'SIGKILL');
  await waitForStopped(port);
}

async function sendSignalToAll(pids, sig) {
  const runningProcesses = pids.filter(isRunning);

  if (runningProcesses.length) {
    for (const pid of runningProcesses) {
      try {
        console.log(`sending ${sig} to`, pid);
        process.kill(pid, sig);
      } catch (e) {
        console.info(e);
      }
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const invalidOpts = ['--dbpath', '--logpath', '--pidpath'];
  if (argv.find((arg) => invalidOpts.some((opt) => arg.startsWith(opt)))) {
    throw new Error(
      `${invalidOpts.join(', ')} mongodb-runner options are not allowed.`
    );
  }

  const [command, instanceName, ...options] = argv;

  if (command === 'start') {
    await start(instanceName, options);
  } else if (command === 'stop') {
    await stop(instanceName);
  } else if (command === 'port') {
    console.info(readPort(instanceName));
  } else {
    throw new Error(`unknown command ${command}`);
  }
}

main();
