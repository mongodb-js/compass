import type * as Electron from 'electron';

// TODO(COMPASS-11354): renderer user data moves behind a bridge to main, after
// which only main needs this and can call app.getPath directly.
export function getStoragePath(): string {
  const storagePath =
    process.type === 'browser'
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('electron') as typeof Electron).app.getPath('userData')
      : // Set by Compass's preload script
        (globalThis as { compassApp?: { userDataPath?: string } }).compassApp
          ?.userDataPath;
  if (!storagePath) {
    throw new Error('The storage path is not defined.');
  }
  return storagePath;
}
