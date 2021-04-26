/* eslint-disable no-console */
import chalk from 'chalk';

function quiet(...msg: string[]) {
  console.log(
    chalk.dim.white('...', ...msg)
  );
}

function note(...msg: string[]) {
  console.log(
    chalk.white('...', ...msg)
  );
}

function info(...msg: string[]) {
  console.log(
    'ℹ️ ',
    chalk.bold.cyan(...msg)
  );
}

function success(...msg: string[]) {
  console.log(
    '✅',
    chalk.bold.green(...msg)
  );
}

function warning(...msg: string[]) {
  console.warn(
    '⚠️',
    chalk.bold.yellow(...msg)
  );
}

function error(...msg: string[]) {
  console.error(
    '❌',
    chalk.bold.red(...msg)
  );
}

function fatal(...msg: string[]) {
  error(...msg);
  process.exit(1);
}

export {
  quiet,
  note,
  info,
  success,
  warning,
  error,
  fatal
};
