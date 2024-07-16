#!/usr/bin/env node
'use strict';
/**
 * TODO (imlucas) Switch from yargs to http://npm.im/commander
 */
const cli = require('mongodb-js-cli')('hadron-build');
const yargs = require('yargs')
  .wrap(120)
  .usage('$0 <command> [options]')
  .command(require('./commands/release'))
  .command(require('./commands/info'))
  .command(require('./commands/upload'))
  .command(require('./commands/download'))
  .command(require('./commands/verify'))
  .demand(1, 'Please specify a command.')
  .strict()
  .env()
  .help('help')
  .fail(function(msg, err) {
    cli.abortIfError(err);
    cli.error(`${msg}\n\n`);
    yargs.showHelp();
  });

cli.debug('parsed argv', yargs.argv);
