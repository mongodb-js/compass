const ora = require('ora');

async function withProgress(text, fn, ...args) {
  const spinner = ora(text).start();
  try {
    const result = await fn.call(spinner, ...args);
    spinner.succeed();
    return result;
  } catch (e) {
    if (spinner.isSpinning) {
      spinner.fail();
    }
    throw e;
  }
}

exports.withProgress = withProgress;
