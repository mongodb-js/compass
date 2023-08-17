/* eslint-disable @typescript-eslint/no-var-requires */

function getElectronApp() {
  let app;

  try {
    app = require('@electron/remote').app;
  } catch (e1: any) {
    try {
      app = require('electron').app;
    } catch (e2: any) {
      // eslint-disable-next-line no-console
      console.log('Could not load @electron/remote', e1.message, e2.message);
    }
  }

  return app;
}

export function getAppName(): string | undefined {
  return getElectronApp()?.getName();
}

export function getStoragePath() {
  const basepath = getElectronApp()?.getPath('userData');
  if (!basepath) {
    throw new Error('The storage path is not defined.');
  }
  return basepath as string;
}
