#!/usr/bin/env node
/* eslint no-unused-expressions: 0 */
require('yargs')
  .wrap(120)
  .usage('$0 <command> [options]')
  .command('release [options]',
    ':shipit:',
    require('./commands/release'))
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
  .strict()
  .help()
  .argv;
