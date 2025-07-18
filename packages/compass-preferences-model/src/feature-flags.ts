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
  enableExportSchema: boolean;
  enableRenameCollectionModal: boolean;
  enableProxySupport: boolean;
  enableRollingIndexes: boolean;
  showDisabledConnections: boolean;
  enableGlobalWrites: boolean;
  enableDataModeling: boolean;
  enableIndexesGuidanceExp: boolean;
  showIndexesGuidanceVariant: boolean;
  enableContextMenus: boolean;
  enableSearchActivationProgramP1: boolean;
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
   * Feature flag for explicit proxy configuration support.
   */
  enableProxySupport: {
    stage: 'released',
    description: {
      short: 'Enables support for explicit proxy configuration.',
      long: 'Allows users to specify proxy configuration for the entire Compass application.',
    },
  },

  showDisabledConnections: {
    stage: 'released',
    description: {
      short:
        'Show clusters that are not in a "connectable" state in Atlas Cloud',
    },
  },

  enableRollingIndexes: {
    stage: 'released',
    description: {
      short: 'Enable creating indexes with the rolling build in Atlas Cloud',
    },
  },

  enableGlobalWrites: {
    stage: 'released',
    description: {
      short: 'Enable Global Writes tab in Atlas Cloud',
    },
  },

  /**
   * Feature flag for export schema. Epic: COMPASS-6862.
   */
  enableExportSchema: {
    stage: 'released',
    description: {
      short: 'Enable schema export',
    },
  },

  /**
   * https://jira.mongodb.org/browse/INIT-592
   */
  enableDataModeling: {
    stage: 'development',
    description: {
      short: 'Design, Visualize, and Evolve your Data Model',
    },
  },

  /**
   * Feature flags for Early Journey Indexes Guidance & Awareness  | Jira Epic: CLOUDP-239367
   * These are passed from MMS and not editable by user
   */
  enableIndexesGuidanceExp: {
    stage: 'development',
    description: {
      short: 'Enable Indexes Guidance Experiment',
    },
  },

  showIndexesGuidanceVariant: {
    stage: 'development',
    description: {
      short:
        'Used to check if user is in the Indexes Guidance Experiment Variant',
    },
  },

  enableContextMenus: {
    stage: 'development',
    description: {
      short: 'Enable context (right-click) menus',
    },
  },

  /**
   * Feature flag for CLOUDP-308952.
   */
  enableSearchActivationProgramP1: {
    stage: 'development',
    description: {
      short: 'Enable interface to view and modify search indexes',
    },
  },
};
