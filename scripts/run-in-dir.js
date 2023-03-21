const { promisify } = require('util');
const { exec } = require('child_process');

const ONE_HOUR = 1000 * 60 * 60;

async function runInDir(command, cwd = process.cwd(), timeout = ONE_HOUR) {
  const execPromise = promisify(exec)(command, {
    stdio: 'pipe',
    cwd,
    timeout,
  });
  return await execPromise;
}

module.exports = { runInDir };
