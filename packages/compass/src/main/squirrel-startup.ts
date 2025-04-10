import path from 'path';
import { spawn } from 'child_process';
import { createLogger } from '@mongodb-js/compass-logging';
const { debug } = createLogger('SQUIRREL-STARTUP');

function runUpdateExe(args: string[]): Promise<void> {
  return new Promise<void>(function (resolve) {
    const updateExe = path.resolve(
      path.dirname(process.execPath),
      '..',
      'Update.exe'
    );
    debug('Spawning `%s` with args `%s`', updateExe, args.join(' '));
    spawn(updateExe, args, {
      detached: true,
    }).on('close', () => resolve());
  });
}

function getShortcutName() {
  // The shortcut name is the app name plus the channel name if it is not
  // stable. ie. "MongoDB Compass Readonly Beta"

  const parts: string[] = [process.env.HADRON_PRODUCT_NAME];
  if (process.env.HADRON_CHANNEL !== 'stable') {
    parts.push(
      process.env.HADRON_CHANNEL.charAt(0).toUpperCase() +
        process.env.HADRON_CHANNEL.slice(1)
    );
  }
  return `"${parts.join(' ')}"`;
}

/*
Squirrel will spawn Compass with command line flags on first run, updates, and
uninstalls. It is very important that we handle these events as early as
possible, and quit immediately after handling them. Squirrel gives apps a short
amount of time (~15sec) to apply these operations and quit.
*/
export async function handleSquirrelWindowsStartup(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return false;
  }

  const shortcutName = getShortcutName();

  const cmd = process.argv[1];
  debug('processing squirrel command `%s`', cmd);

  /*
  For more detailed info on these commands, so Electron, electron-winstaller and Squirrel Windows'
  documentation:

  https://github.com/electron/windows-installer?tab=readme-ov-file#handling-squirrel-events
  https://github.com/electron-archive/grunt-electron-installer?tab=readme-ov-file#handling-squirrel-events
  https://github.com/Squirrel/Squirrel.Windows/blob/master/docs/using/custom-squirrel-events-non-cs.md
  https://github.com/Squirrel/Squirrel.Windows/blob/master/docs/using/install-process.md
  https://github.com/Squirrel/Squirrel.Windows/blob/master/docs/using/update-process.md#update-process
  */
  switch (cmd) {
    case '--squirrel-install':
    case '--squirrel-updated':
      await runUpdateExe([`--createShortcut=${shortcutName}`]);
      debug(`${cmd} handled sucessfully`);
      return true;

    case '--squirrel-uninstall':
      await runUpdateExe([`--removeShortcut=${shortcutName}`]);
      debug(`${cmd} handled sucessfully`);
      return true;

    case '--squirrel-obsolete':
      debug(`${cmd} handled sucessfully`);
      return true;

    default:
      debug(`Unknown squirrel command: ${cmd}. Continuing on.`);
  }

  return false;
}
