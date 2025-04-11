import { promises as fs } from 'fs';
import os from 'os';
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
  return process.env.HADRON_PRODUCT_NAME ?? 'MongoDB Compass';
}

async function renameShortcuts(from: string, to: string) {
  const folders: string[] = [];

  if (process.env.APPDATA) {
    // start menu shortcut
    // NOTE: This includes the non-ideal "MongoDB Inc" folder name as opposed to
    // "MongoDB".
    folders.push(
      path.join(
        process.env.APPDATA,
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs',
        'MongoDB Inc'
      )
    );
  }

  // desktop shortcut
  folders.push(path.join(os.homedir(), 'Desktop'));

  for (const folder of folders) {
    const source = path.join(folder, from);
    const destination = path.join(folder, to);
    try {
      // only rename the shortcut if it exists at the standard, expected location
      if (await fs.stat(source)) {
        debug('renaming shortcut from %s to %s', source, destination);
        await fs.rename(source, destination);
      } else {
        debug('shortcut %s does not exist, skipping rename', source);
      }
    } catch (err: unknown) {
      debug(
        'error renaming shortcut from %s to %s: %s',
        source,
        destination,
        err
      );
    }
  }
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

  // This has to be an executable that was packaged up with the app. There's no
  // way to control what the shortcut name will be - it is always the same as
  // the executable.
  const exeName = path.basename(process.execPath);

  // We want the desktop and start menu shortcuts to be named with spaces in
  // them so that when the user searches for "compass" in the start menu it will
  // find it.
  const correctShortcutName = getShortcutName() + '.lnk';
  const wrongShortcutName = getShortcutName().replace(/ /g, '') + '.lnk';

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
      await runUpdateExe([`--createShortcut=${exeName}`]);
      // Rename the shortcut that was just created to be what we want it to be.
      await renameShortcuts(wrongShortcutName, correctShortcutName);
      debug(`${cmd} handled sucessfully`);
      return true;

    case '--squirrel-uninstall':
      // Rename the shortcut back to the original name so it can be removed as
      // usual.
      await renameShortcuts(correctShortcutName, wrongShortcutName);
      await runUpdateExe([`--removeShortcut=${exeName}`]);
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
