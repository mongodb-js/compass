const readline = require('readline');
const ora = require('ora');

function confirm(prompt) {
  return new Promise((resolve, reject) => {
    try {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(`${prompt} Y/[N]: `, (answer) => {
        rl.close();
        resolve(answer.match(/^[yY]$/));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function task(title, fn) {
  const spinner = ora(title).start();
  try {
    await fn();
    spinner.succeed();
  } catch (e) {
    spinner.fail();
    throw e;
  }
}

module.exports = { confirm, task };
