#!/usr/bin/env node

'use strict';

const path = require('path');
const crossSpawn = require('cross-spawn');
const getPort = require('get-port');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const net = require('net');
const findUp = require('find-up');
const yargsParser = require('yargs-parser');
const { rimraf } = require('rimraf');

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

function getInstanceLogPath(instanceName) {
  return path.join(
    instancesRoot,
    'logs',
    `testserver-${instanceName}-${Date.now()}.log`
  );
}

function initializeLogDir() {
  fs.mkdirSync(path.join(instancesRoot, 'logs'), { recursive: true });
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

async function retry(condition) {
  let attempt = 0;

  while (++attempt <= 10) {
    try {
      await condition();
      return;
    } catch (e) {
      console.info(`Attempt ${attempt} failed`, e);
    }

    attempt++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
  const port = +(yargsOptions.port ?? (await getPort()));

  // make sure other instances are not running on the same port
  // before doing anything
  await waitForStopped(port);
  initializeLogDir();

  const instanceDataPath = getInstanceDataPath(instanceName, port);

  // nuke data from previous runs:
  await rimraf(instanceDataPath);
  writePort(instanceName, port);

  const mongodbRunnerArgs = [
    'start',
    `--dbpath=${getInstanceDataPath(instanceName, port)}`,
    `--logpath=${getInstanceLogPath(instanceName)}`,
    `--port=${port}`,
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

  try {
    await assertPortOpen(port);
  } catch (err) {
    console.error('Server port was already closed:', err);
    console.warn('Running mongodb-runner close to clean up');
  }

  try {
    const mongodbRunnerArgs = [
      'stop',
      `--dbpath=${getInstanceDataPath(instanceName)}`,
      `--port=${port}`,
    ];

    const mongodbRunnerPath = getMongodbRunnerPath();
    console.info('Running', mongodbRunnerPath, mongodbRunnerArgs);
    crossSpawn.sync(mongodbRunnerPath, mongodbRunnerArgs, { stdio: 'inherit' });
  } catch (err) {
    console.warn('mongodb-runner stop failed', err);
    console.warn('checking if the server is stopped anyway ...');
  }

  await waitForStopped(port);
}

async function main() {
  const argv = process.argv.slice(2);
  const invalidOpts = ['--dbpath', 'logpath'];
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
