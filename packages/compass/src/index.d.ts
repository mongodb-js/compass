declare module '*.png' {
  declare const assetPath: string;
  export default assetPath;
}

declare module '*LICENSE' {
  declare const src: string;
  export default src;
}

declare module 'process' {
  declare global {
    namespace NodeJS {
      interface ProcessEnv {
        HADRON_APP_VERSION: string;
        HADRON_DISTRIBUTION:
          | 'compass'
          | 'compass-readonly'
          | 'compass-isolated';
        HADRON_PRODUCT:
          | 'mongodb-compass'
          | 'mongodb-compass-readonly'
          | 'mongodb-isolated';
        HADRON_PRODUCT_NAME:
          | 'MongoDB Compass'
          | 'MongoDB Compass Readonly'
          | 'MongoDB Compass Isolated Edition';
        HADRON_READONLY: 'true' | 'false';
        HADRON_ISOLATED: 'true' | 'false';
        HADRON_CHANNEL: 'stable' | 'beta' | 'dev';
        HADRON_METRICS_BUGSNAG_KEY?: string;
        HADRON_METRICS_INTERCOM_APP_ID?: string;
        HADRON_METRICS_STITCH_APP_ID?: string;
        HADRON_METRICS_SEGMENT_API_KEY?: string;
        HADRON_METRICS_SEGMENT_HOST?: string;
        HADRON_AUTO_UPDATE_ENDPOINT: string;

        // Feature flags.
        USE_NEW_CONNECT_FORM?: 'true' | 'false';

        /**
         * Enables new tab in the instance workspace that shows saved
         * aggregations and queries in a list. Behind a feature flag while in
         * development
         */
        COMPASS_SHOW_YOUR_QUERIES_TAB?: 'true';

        /**
         * Enable new aggregation pipeline toolbar
         */
        COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR?: 'true',
      }
    }
  }
}
