export type FeatureFlagDefinition = {
  /**
   * Defines the feature flag behavior depending on its stage.
   *
   * - 'development': the feature flag is disabled by default and only shown in settings in Local Development and Dev Packages.
   * - 'preview': the feature flag is disabled by default but shown under the Feature Preview settings.
   * - 'released': the feature flag is always enabled, is not read from disk and cannot be disabled from settings.
   */
  stage: 'development' | 'preview' | 'released';
  description: {
    short: string;
    long?: string;
  };
};

export type FeatureFlags = {
  enableLgDarkmode: boolean;
  enableOidc: boolean; // Not capitalized "OIDC" for spawn arg casing.
  enableStageWizard: boolean;
  newExplainPlan: boolean;
  showInsights: boolean;
  enableAtlasSearchIndexManagement: boolean;
};

export const featureFlags: Required<{
  [K in keyof FeatureFlags]: FeatureFlagDefinition;
}> = {
  /**
   * Currently Compass uses `darkreader` to globally change the views of
   * Compass to a dark theme. Turning on this feature flag stops darkreader
   * from being used and instead components which have darkMode
   * support will listen to the theme to change their styles.
   */
  enableLgDarkmode: {
    stage: 'released',
    description: {
      short: 'Modern Dark Mode',
    },
  },

  /**
   * Feature flag for enabling OIDC authentication.
   * Epic: COMPASS-5955
   */
  enableOidc: {
    stage: 'released',
    description: {
      short: 'Enable OIDC Authentication',
    },
  },

  /**
   * Feature flag for enabling the use of Stage Wizard
   * in the Pipeline Builder. Epic: COMPASS-5817
   */
  enableStageWizard: {
    stage: 'released',
    description: {
      short: 'Stage Wizard',
      long: 'Create aggregation stages using Wizard.',
    },
  },

  newExplainPlan: {
    stage: 'released',
    description: {
      short: 'Access explain plan from query bar',
      long: 'Explain plan is now accessible right from the query bar. To view a query’s execution plan, click “Explain” as you would on an aggregation pipeline.',
    },
  },

  showInsights: {
    stage: 'released',
    description: {
      short: 'Show performance insights',
      long: 'Surface visual signals in the Compass interface to highlight potential performance issues and anti-patterns.',
    },
  },

  /**
   * Feature flag for Atlas Search Index Management.
   * Epic: COMPASS-6599
   */
  enableAtlasSearchIndexManagement: {
    stage: 'development',
    description: {
      short: 'Enables Atlas Search Index management.',
      long: 'Allows listing, creating, updating and deleting Atlas Search indexes.',
    },
  },
};
