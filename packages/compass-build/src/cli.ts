import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import debugCommand from './commands/debug';
import generateExpansionsCommand from './commands/evergreen-expansions';
import releaseCommand from './commands/release';
import uploadCommand from './commands/upload';
import downloadCommand from './commands/download';

async function main() {
  const program = yargs(hideBin(process.argv))
    .command(debugCommand)
    .command(generateExpansionsCommand)
    .command(releaseCommand)
    .command(uploadCommand)
    .command(downloadCommand)
    .demandCommand(1, 'Please specify a command.')
    .strict()
    .version(false)
    .showHelpOnFail(false)
    .help();

  await program.parse();
}

void main();
