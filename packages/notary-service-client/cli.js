#!/usr/bin/env node

const path = require('path');
const pkg = require(path.join(__dirname, 'package.json'));
const program = require('commander');
const cli = require('mongodb-js-cli')(pkg.name);
const Table = require('cli-table');
const _ = require('lodash');

const notary = require('./');

function logs() {
  cli.spinner('fetch logs');
  return notary.logs()
    .then(res => {
      cli.stopSpinner();

      cli.ok(`## ${res.length} logs`);
      var t = new Table({
        head: [
          '_id',
          'action',
          'file',
          'key',
          'time',
          'comment'
        ]
      });

      res.forEach((row) => {
        t.push(_.values(row));
      });

      console.log(t.toString());
    })
    .catch(err => {
      cli.error('failed to fetch logs', err);
    });
}

program
  .version(pkg.version)
  .option('--debug', 'show debug output');

program
  .command('sign [files...]')
  .description('sign one or more files')
  .action((files, opts) => {
    if (opts.debug) require('debug').enable('*');

    Promise.all(files.map((src) => {
      return notary(src);
    }));
  });

program
  .command('check')
  .description('check configuration')
  .action((opts) => {
    if (opts.debug) require('debug').enable('*');

    const config = notary.configure();
    if (!config.configured) {
      cli.error(`Bad configuration: ${config.message}`);
      return;
    }
    cli.ok('environment configured correctly');
    logs();
  });

program
  .command('logs')
  .description('get log from notary-service')
  .action((opts) => {
    if (opts.debug) require('debug').enable('*');
    logs();
  });

program.parse(process.argv);
