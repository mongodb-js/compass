#!/usr/bin/env node

var yargs = require('yargs');

yargs
  .usage('$0 <command> [options]')
  .command(require('./commands/clean'))
  .command('develop [options]',
    'Run the app in development mode.',
    require('./commands/develop'))
  .command('test [options]',
    'Run app tests.',
    require('./commands/test'))
  .command('ui [options]',
    'Compile the app UI.',
    require('./commands/ui'))
  .command('verify [options]',
    'Verify the current environment meets the app\'s requirements.',
    require('./commands/verify'))
  .demand(1, 'Please specify a command.')
  .help();
