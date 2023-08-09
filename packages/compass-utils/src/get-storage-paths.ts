/* eslint-disable @typescript-eslint/no-var-requires */
export interface StoragePaths {
  appName: string;
  basepath: string;
}

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

export function getAppPath(): string | undefined {
  return getElectronApp()?.getPath('userData');
}

// todo: remove this and rename the file
export function getStoragePaths(): StoragePaths | undefined {
  const app = getElectronApp();
  if (!app) return undefined;

  const appName = app.getName();
  const basepath = app.getPath('userData');

  return { appName, basepath };
}
