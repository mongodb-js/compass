const execa = require('execa');
const chalk = require('chalk');

function manualAction(...message) {
  return [
    '👉\t',
    chalk.yellow(
      chalk.bold('MANUAL ACTION REQUIRED!: ')
    ),
    '\n',
    ...message.join('').split('\n').map((m) => `\t${m}`).join('\n')
  ].join('');
}

function link(string) {
  return chalk.bold(chalk.blue(string));
}

function command(string) {
  return chalk.bold(chalk.magenta(string));
}

function waitForEnter() {
  if (!process.stdin.isTTY) {
    return;
  }

  execa.sync('read _ ', {shell: true, stdin: 'inherit'});
}

module.exports = {
  manualAction,
  link,
  command,
  waitForEnter
};

