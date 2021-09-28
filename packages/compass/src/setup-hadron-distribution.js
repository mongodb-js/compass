/**
 * Compass plugins depend on some of those variables being available during
 * runtime. This is not easy to set up with webpack as it will inline env
 * variables during compilation, so we can't just `process.env.VAR = ...` here
 * without doing some weird things with the way we provide those variables to
 * the compilation during the build step, so this Object.assign just works
 * around Webpack detection.
 *
 * TODO: This is just a temporary workaround that can go away when Compass and
 * all its plugins are processed by the same compilation
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
    HARDRON_METRICS_BUGSNAG_KEY: process.env.HARDRON_METRICS_BUGSNAG_KEY,
    HARDRON_METRICS_INTERCOM_APP_ID:
      process.env.HARDRON_METRICS_INTERCOM_APP_ID,
    HARDRON_METRICS_STITCH_APP_ID: process.env.HARDRON_METRICS_STITCH_APP_ID
  }).filter(([, val]) => !!val)
);

Object.assign(process.env, env);
