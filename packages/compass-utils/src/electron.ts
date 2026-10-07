type ElectronAppBridge = {
  getName: () => string;
  getVersion: () => string;
  getPath: (name: 'userData') => string;
};

/**
 * The preload script exposes the handful of Electron `app` accessors the
 * renderer needs. Previously this reached for `@electron/remote` (falling back
 * to `electron`) inside a try/catch, which pulled both into the renderer
 * bundle even though neither resolves once `nodeIntegration` is off.
 */
function getElectronApp(): ElectronAppBridge | undefined {
  return (
    globalThis as typeof globalThis & {
      __COMPASS_ELECTRON__?: { app?: ElectronAppBridge };
    }
  ).__COMPASS_ELECTRON__?.app;
}

export function getAppName(): string | undefined {
  return getElectronApp()?.getName();
}

export function getAppVersion(): string | undefined {
  return getElectronApp()?.getVersion();
}

export function getStoragePath(): string {
  const basepath = getElectronApp()?.getPath('userData');
  if (!basepath) {
    // throw new Error('The storage path is not defined.');
  }
  return basepath ?? '';
}
