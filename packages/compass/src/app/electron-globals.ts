import type { WebFrame, WebUtils } from 'electron';

/**
 * `webFrame` and `webUtils` reach the renderer through the preload script
 * rather than a direct `import 'electron'`, which is unavailable once
 * `nodeIntegration` is off.
 */
const provided = (
  globalThis as typeof globalThis & {
    __COMPASS_ELECTRON__?: { webFrame: WebFrame; webUtils: WebUtils };
  }
).__COMPASS_ELECTRON__;

export const webFrame = provided?.webFrame as WebFrame;
export const webUtils = provided?.webUtils as WebUtils;

/**
 * Stand-in for `@electron/remote`, which needs `nodeIntegration`.
 *
 * `app.getName()`/`getVersion()` are answered from the build-time environment
 * that `setupHadronDistributionForRenderer` puts back on `process.env`, so
 * those are exact. The window and dialog APIs are genuine main-process calls
 * with no renderer equivalent, so they throw until they move behind IPC --
 * this breaks the native file picker, not startup.
 *
 * TODO(COMPASS-10808): replace with a main-process dialog channel.
 */
function notAvailable(name: string): never {
  throw new Error(
    `@electron/remote.${name} is not available in the renderer yet (COMPASS-10808)`
  );
}

export const remote = {
  app: {
    getName: () => process.env.HADRON_PRODUCT_NAME ?? 'MongoDB Compass',
    getVersion: () => process.env.HADRON_APP_VERSION ?? '',
  },
  getCurrentWindow: () => notAvailable('getCurrentWindow'),
  get dialog(): never {
    return notAvailable('dialog');
  },
};
