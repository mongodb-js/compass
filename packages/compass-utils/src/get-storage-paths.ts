/* eslint-disable @typescript-eslint/no-var-requires */
export interface StoragePaths {
  appName: string;
  basepath: string;
}

export function getStoragePaths(): StoragePaths | undefined {
  let app;

  try {
    app = require('@electron/remote').app;
  } catch (e1: any) {
    try {
      app = require('electron').app;
    } catch (e2: any) {
      console.log('Could not load @electron/remote', e1.message, e2.message);
      return undefined;
    }
  }

  const appName = app.getName();
  const basepath = app.getPath('userData');

  return { appName, basepath };
}