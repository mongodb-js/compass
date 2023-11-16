import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import infoCommand from './commands/info';
// import releaseCommand from './commands/release';
// import uploadCommand from './commands/upload';
// import downloadCommand from './commands/download';

async function main() {
  const program = yargs(hideBin(process.argv))
    .command(infoCommand)
    .demandCommand(1, 'Please specify a command.')
    .strict()
    .version(false)
    .help('help');

  await program.parse();
}

void main();
