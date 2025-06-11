'use strict';
const { promisify } = require('util');
const { exec } = require('child_process');

const ONE_HOUR = 1000 * 60 * 60;

async function runInDir(command, args = [], cwd = process.cwd(), timeout = ONE_HOUR) {
  const execFile = promisify(require('child_process').execFile);
  const execPromise = execFile(command, args, {
    stdio: 'pipe',
    cwd,
    timeout,
  });
  return await execPromise;
}

module.exports = { runInDir };
