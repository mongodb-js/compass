import path from 'path';
import { app } from 'electron';

/**
 * All these variables below are used by Compass and its plugins in one way or
 * another. These process.env vars are inlined in the code durng the build
 * process by webpack and are not accessible directly in the runtime by default.
 * It's helpful to have them though for debugging purposes, so that's why we are
 * adding them back to the runtime. It's done in this weird Object.assign way to
 * work around Webpack detection that would not allow us to just do the
 * assignment here
 */
const env = Object.fromEntries(
  Object.entries({
    HADRON_APP_VERSION: process.env.HADRON_APP_VERSION,
    HADRON_DISTRIBUTION: process.env.HADRON_DISTRIBUTION,
    HADRON_PRODUCT: process.env.HADRON_PRODUCT,
    HADRON_PRODUCT_NAME: process.env.HADRON_PRODUCT_NAME,
    HADRON_READONLY: process.env.HADRON_READONLY,
    HADRON_ISOLATED: process.env.HADRON_ISOLATED,
    HADRON_CHANNEL: process.env.HADRON_CHANNEL,
    HADRON_METRICS_INTERCOM_APP_ID: process.env.HADRON_METRICS_INTERCOM_APP_ID,
    HADRON_METRICS_SEGMENT_API_KEY: process.env.HADRON_METRICS_SEGMENT_API_KEY,
    HADRON_METRICS_SEGMENT_HOST: process.env.HADRON_METRICS_SEGMENT_HOST,
    HADRON_AUTO_UPDATE_ENDPOINT: process.env.HADRON_AUTO_UPDATE_ENDPOINT,
  }).filter(([, val]) => !!val)
);

Object.assign(process.env, env);

if (
  // type `browser` indicates that we are in the main electron process
  process.type === 'browser'
) {
  // Name and version are setup outside of Application and before anything else
  // so that if uncaught exception happens we already show correct name and
  // version
  app.setName(
    process.env.HADRON_PRODUCT_NAME_OVERRIDE ?? process.env.HADRON_PRODUCT_NAME
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
  }

  app.setPath(
    'crashDumps',
    path.join(app.getPath('userData'), 'CrashReporter')
  );
}

if (
  // type `renderer` is electron renderer process (browser window runtime)
  process.type === 'renderer'
) {
  if (process.env.NODE_ENV === 'development') {
    const ignoreLeafygreenWarnings = [
      // Not relevant
      /using the Leafygreen SearchInput/i,
      // We don't always use SegmentedControl as a view switcher, aria-controls
      // doesn't apply
      /The property `aria-controls` is required/i,
      // TODO(COMPASS-7046): Should go away after leafygreen update
      /For screen-reader accessibility, label or aria-labelledby/i,
    ];
    for (const method of ['warn', 'error'] as const) {
      /* eslint-disable no-console */
      const fn = console[method];
      console[method] = function (...args) {
        const [msg] = args;
        if (typeof msg === 'string') {
          if (
            ignoreLeafygreenWarnings.some((regex) => {
              return regex.test(msg);
            })
          ) {
            return;
          }
        }
        return fn.apply(this, args);
      };
      /* eslint-enable no-console */
    }
  }
}
