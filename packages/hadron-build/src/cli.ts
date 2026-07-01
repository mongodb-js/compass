#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import createCLI from 'mongodb-js-cli';
import {
  infoCommand,
  releaseCommand,
  uploadCommand,
  downloadCommand,
} from './commands';

const cli = createCLI('hadron-build');

const yargsInstance = yargs(hideBin(process.argv))
  .wrap(120)
  .version(false)
  .usage('$0 <command> [options]')
  .command(releaseCommand)
  .command(infoCommand)
  .command(uploadCommand)
  .command(downloadCommand)
  .demandCommand(1, 'Please specify a command.')
  .strict()
  .fail(function (msg: string, err: Error) {
    cli.abortIfError(err);
    cli.error(`${msg}\n\n`);
    yargsInstance.showHelp();
  });

cli.debug('parsed argv', yargsInstance.argv);
