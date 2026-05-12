#!/usr/bin/env node
import createCLI from 'mongodb-js-cli';
import * as release from './commands/release';
import * as info from './commands/info';
import * as upload from './commands/upload';
import * as download from './commands/download';

const cli = createCLI('hadron-build');

// TODO: Bump yargs to v17 and remove this
// yargs v4 API does not match @types/yargs (v17), cast to any
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const yargs = require('yargs') as any;

const yargsInstance = yargs
  .wrap(120)
  .usage('$0 <command> [options]')
  .command(release)
  .command(info)
  .command(upload)
  .command(download)
  .demand(1, 'Please specify a command.')
  .strict()
  .env()
  .help('help')
  .fail(function (msg: string, err: Error) {
    cli.abortIfError(err);
    cli.error(`${msg}\n\n`);
    yargsInstance.showHelp();
  });

cli.debug('parsed argv', yargsInstance.argv);
