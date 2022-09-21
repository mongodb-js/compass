/**
 * This script makes sure that no mongo instances are running. This is helpful
 * for the test suites where mongo-runner is used to ensure that the following
 * test suites are not running into weird issues trying to access a database
 * that was spawned and modified before
 */
const { withProgress } = require('./monorepo/with-progress');
const { runInDir } = require('./run-in-dir');

async function getMongoProcesses() {
  const psList = await import('ps-list'); // ps-list@>=8 is an ESM module
  const list = await psList.default({ all: true });
  return list.filter(({ name }) => /(mongos|mongod)/.test(name));
}

function sleep(ms = 100) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function kill(pid) {
  try {
    if (process.platform === 'win32') {
      await runInDir(`taskkill /PID ${pid} /F /T`);
    } else {
      process.kill(pid);
    }
    let waitForExitAttempts = 0;
    // Trying three times with increasing timeout to wait for the process to
    // exit
    while (waitForExitAttempts < 3) {
      await sleep(500 * waitForExitAttempts);
      try {
        process.kill(pid, 0);
      } catch (e) {
        // If `kill -0 PID` throws, it means process does not exist anymore, we
        // can exit the function
        return;
      }
    }
    // If process is still alive we throw an error because we failed to kill a
    // running mongo process and this might break the follow-up tests
    throw new Error(`Failed to make process with PID ${pid} stop`);
  } catch (err) {
    console.warn(`Cleaning up process with PID ${pid} failed:`);
    console.warn();
    console.warn(err);
    console.warn();
  }
}

async function killall() {
  const mongoProcesses = await getMongoProcesses();

  if (mongoProcesses.length > 0) {
    console.log(
      `Found ${mongoProcesses.length} running mongod/mongos ${
        mongoProcesses.length > 1 ? 'processes' : 'process'
      }:`
    );
    console.log();

    for (const { name, pid } of mongoProcesses) {
      await withProgress(`Killing process ${name} (PID: ${pid})`, kill, pid);
    }
  } else {
    console.log('Found no mongos/mongod processes running');
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

killall();
