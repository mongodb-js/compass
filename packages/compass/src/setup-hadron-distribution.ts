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
