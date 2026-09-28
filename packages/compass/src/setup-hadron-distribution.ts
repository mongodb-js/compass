import path from 'path';
import { app, protocol, net } from 'electron';
import { setupHadronDistributionForRenderer } from './setup-hadron-distribution-renderer';
/**
 * This function is used to setup the Hadron distribution.
 * It's used to inject the process.env vars into the runtime.
 * It's meant to be called at the beginning of the bootstrap, since it sets
 * process.env vars and electron app properties that are used by Compass, and in
 * particular it sets up paths for file system operations.
 */
export function setupHadronDistribution() {
  setupHadronDistributionForRenderer();

  if (
    // type `browser` indicates that we are in the main electron process
    process.type === 'browser'
  ) {
    // Name and version are setup outside of Application and before anything else
    // so that if uncaught exception happens we already show correct name and
    // version
    app.setName(
      process.env.HADRON_PRODUCT_NAME_OVERRIDE ??
        process.env.HADRON_PRODUCT_NAME
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error setVersion is not a public method
    app.setVersion(process.env.HADRON_APP_VERSION);

    // When NODE_ENV is dev, we are probably running the app unpackaged directly
    // with Electron binary which causes user dirs to be just `Electron` instead
    // of app name that we want here
    if (process.env.NODE_ENV === 'development') {
      app.setPath('userData', path.join(app.getPath('appData'), app.getName()));

      // @ts-expect-error this seems to work but not exposed as public path and so
      // is not available in d.ts files. As this is a dev-only path change and
      // seemingly nothing is using this path anyway, we probably can ignore an
      // error here
      app.setPath('userCache', path.join(app.getPath('cache'), app.getName()));

      // TODO(COMPASS-8269): even with `webSecurity` disabled for local dev,
      // file:// requests for shell worker are silently getting canceled by the
      // browser, adding explicit protocol handler for it that just does the same
      // request using electron network stack works around the issue
      void app.whenReady().then(() => {
        protocol.handle('file', (req) => {
          return net.fetch(req, { bypassCustomProtocolHandlers: true });
        });
      });
    }

    app.setPath(
      'crashDumps',
      path.join(app.getPath('userData'), 'CrashReporter')
    );
  }

}
