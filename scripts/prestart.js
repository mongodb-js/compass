#!/usr/bin/env node

var cli = require('mongodb-js-cli')('mongodb-compass:scripts:prestart');
cli.yargs.usage('$0 [options]')
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  });

if (cli.argv.verbose) {
  process.env.DEBUG = '*';
}

var cp = require('cp-file');

// cli.spinner('Copying font-awesome\'s assets so they\'re properly includable');
// cp('../node_modules/font-awesome/fonts/fontawesome-webfont*', '../src/fonts/').then(function() {
//   console.log('Result', arguments);
//   cli.ok('Fonts copied')
// });
