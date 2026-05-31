#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import createCLI from 'mongodb-js-cli';
import { info, release, upload, download } from './commands';

const cli = createCLI('hadron-build');

const yargsInstance = yargs(hideBin(process.argv))
  .wrap(120)
  .version(false)
  .usage('$0 <command> [options]')
  .command(release.command, release.describe, release.builder, release.handler)
  .command(info.command, info.describe, info.builder, info.handler)
  .command(upload.command, upload.describe, upload.builder, upload.handler)
  .command(
    download.command,
    download.describe,
    download.builder,
    download.handler
  )
  .demandCommand(1, 'Please specify a command.')
  .strict()
  .fail(function (msg: string, err: Error) {
    cli.abortIfError(err);
    cli.error(`${msg}\n\n`);
    yargsInstance.showHelp();
  });

cli.debug('parsed argv', yargsInstance.argv);
