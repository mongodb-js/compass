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
  enableOidc: boolean; // Not capitalized "OIDC" for spawn arg casing.
  newExplainPlan: boolean;
  showInsights: boolean;
  enableRenameCollectionModal: boolean;
  enableQueryHistoryAutocomplete: boolean;
  enableProxySupport: boolean;
  enableRollingIndexes: boolean;
};

export const featureFlags: Required<{
  [K in keyof FeatureFlags]: FeatureFlagDefinition;
}> = {
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
   * Feature flag for the rename collection modal.
   */
  enableRenameCollectionModal: {
    stage: 'released',
    description: {
      short: 'Enables renaming a collection',
      long: 'Allows users to rename a collection from the sidebar',
    },
  },

  /**
   * Feature flag for adding query history items to the query bar autocompletion. COMPASS-8096
   */
  enableQueryHistoryAutocomplete: {
    stage: 'released',
    description: {
      short:
        'Enables showing query history items in the query bar autocomplete.',
    },
  },

  /**
   * Feature flag for explicit proxy configuration support.
   */
  enableProxySupport: {
    stage: 'released',
    description: {
      short: 'Enables support for explicit proxy configuration.',
      long: 'Allows users to specify proxy configuration for the entire Compass application.',
    },
  },

  enableRollingIndexes: {
    stage: 'development',
    description: {
      short: 'Enable creating indexes with the rolling build in Atlas Cloud',
    },
  },
};
