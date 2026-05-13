#!/usr/bin/env node
import yargs, { type CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';
import createCLI from 'mongodb-js-cli';
import * as release from './commands/release';
import * as info from './commands/info';
import * as upload from './commands/upload';
import * as download from './commands/download';

const cli = createCLI('hadron-build');

const yargsInstance = yargs(hideBin(process.argv))
  .wrap(120)
  .usage('$0 <command> [options]')
  .command(release as unknown as CommandModule)
  .command(info as unknown as CommandModule)
  .command(upload as unknown as CommandModule)
  .command(download as unknown as CommandModule)
  .demandCommand(1, 'Please specify a command.')
  .strict()
  .fail(function (msg: string, err: Error) {
    cli.abortIfError(err);
    cli.error(`${msg}\n\n`);
    yargsInstance.showHelp();
  });

cli.debug('parsed argv', yargsInstance.argv);
