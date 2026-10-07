/**
 * The parts of the Hadron distribution setup that the renderer needs.
 *
 * Split out from `./setup-hadron-distribution` because that module calls
 * main-only Electron APIs (`app.setPath`, `protocol.handle`, `net.fetch`)
 * and so cannot be imported from renderer code.
 */
export function setupHadronDistributionForRenderer() {
  // Clean-up deprecated platform features that can cause various issues when
  // used in the runtime
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Deprecated_and_obsolete_features
  for (const deprecated of [
    '__proto__',
    '__defineGetter__',
    '__lookupGetter__',
    '__defineSetter__',
    '__lookupSetter__',
  ]) {
    delete (Object.prototype as any)[deprecated];
  }

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
      HADRON_METRICS_INTERCOM_APP_ID:
        process.env.HADRON_METRICS_INTERCOM_APP_ID,
      HADRON_METRICS_SEGMENT_API_KEY:
        process.env.HADRON_METRICS_SEGMENT_API_KEY,
      HADRON_METRICS_SEGMENT_HOST: process.env.HADRON_METRICS_SEGMENT_HOST,
      HADRON_AUTO_UPDATE_ENDPOINT: process.env.HADRON_AUTO_UPDATE_ENDPOINT,
    }).filter(([, val]) => !!val)
  );

  Object.assign(process.env, env);

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
}
