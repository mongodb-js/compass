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
        HADRON_METRICS_SEGMENT_API_KEY?: string;
        HADRON_METRICS_SEGMENT_HOST?: string;
        HADRON_AUTO_UPDATE_ENDPOINT: string;

        // Feature flags.
        /**
         * Currently Compass uses `darkreader` to globally change the views of
         * Compass to a dark theme. Turning on this feature flag stops darkreader
         * from being used and instead components which have darkMode
         * support will listen to the theme to change their styles.
         */
        COMPASS_LG_DARKMODE?: 'true' | 'false';

        COMPASS_CSFLE_SUPPORT?: 'true' | 'false';

        /**
         * Enable new aggregation pipeline toolbar
         */
        COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR?: 'true';
      }
    }
  }
}
