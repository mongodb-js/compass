/* eslint-disable @typescript-eslint/no-require-imports */

// TODO(COMPASS-11354): renderer user data moves behind a bridge to main, after
// which only main needs this and can call app.getPath directly.
export function getStoragePath(): string {
  const { app } =
    process.type === 'browser'
      ? (require('electron') as typeof import('electron'))
      : (require('@electron/remote') as typeof import('@electron/remote'));
  const storagePath = app.getPath('userData');
  if (!storagePath) {
    throw new Error('The storage path is not defined.');
  }
  return storagePath;
}
