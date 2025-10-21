import { z } from '@mongodb-js/compass-user-data';
import type { PreferenceDefinition } from './preferences-schema';

export type FeatureFlagDefinition = {
  /**
   * Resulting preference name to be used in Compass
   */
  name: string;
  /**
   * Defines the feature flag behavior depending on its stage.
   *
   * - 'development': the feature flag is disabled by default and only shown in settings in Local Development and Dev Packages.
   * - 'preview': the feature flag is disabled by default but shown under the Feature Preview settings.
   * - 'released': the feature flag is always enabled, is not read from disk and cannot be disabled from settings.
   */
  stage: 'development' | 'preview' | 'released';
  /**
   * Defines the feature flag name to be picked up from Atlas Cloud. If set to a
   * non-null value and Atlas Cloud feature flag exists and was passed to
   * compass-web, it will take precedence over the "release stage"
   * configuration, otherwise the `stage` logic will apply.
   */
  atlasCloudFeatureFlagName: string | null;
  description: {
    short: string;
    long?: string;
  };
};

export const FEATURE_FLAG_DEFINITIONS = [
  /**
   * Feature flag for enabling OIDC authentication.
   * Epic: COMPASS-5955
   */
  {
    name: 'enableOidc', // Not capitalized "OIDC" for spawn arg casing.
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable OIDC Authentication',
    },
  },

  {
    name: 'newExplainPlan',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Access explain plan from query bar',
      long: 'Explain plan is now accessible right from the query bar. To view a query’s execution plan, click “Explain” as you would on an aggregation pipeline.',
    },
  },

  {
    name: 'showInsights',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Show performance insights',
      long: 'Surface visual signals in the Compass interface to highlight potential performance issues and anti-patterns.',
    },
  },

  /**
   * Feature flag for the rename collection modal.
   */
  {
    name: 'enableRenameCollectionModal',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enables renaming a collection',
      long: 'Allows users to rename a collection from the sidebar',
    },
  },

  /**
   * Feature flag for explicit proxy configuration support.
   */
  {
    name: 'enableProxySupport',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enables support for explicit proxy configuration.',
      long: 'Allows users to specify proxy configuration for the entire Compass application.',
    },
  },

  {
    name: 'showDisabledConnections',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short:
        'Show clusters that are not in a "connectable" state in Atlas Cloud',
    },
  },

  {
    name: 'enableRollingIndexes',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable creating indexes with the rolling build in Atlas Cloud',
    },
  },

  {
    name: 'enableGlobalWrites',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable Global Writes tab in Atlas Cloud',
    },
  },

  /**
   * Feature flag for export schema. Epic: COMPASS-6862.
   */
  {
    name: 'enableExportSchema',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable schema export',
    },
  },

  /**
   * https://jira.mongodb.org/browse/INIT-592
   */
  {
    name: 'enableDataModeling',
    stage: 'development',
    atlasCloudFeatureFlagName: 'DATA_EXPLORER_COMPASS_WEB_ENABLE_DATA_MODELING',
    description: {
      short: 'Design, Visualize, and Evolve your Data Model',
    },
  },

  /**
   * Feature flags for Early Journey Indexes Guidance & Awareness  | Jira Epic: CLOUDP-239367
   * These are passed from MMS and not editable by user
   */
  {
    name: 'enableIndexesGuidanceExp',
    stage: 'development',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable Indexes Guidance Experiment',
    },
  },

  {
    name: 'showIndexesGuidanceVariant',
    stage: 'development',
    atlasCloudFeatureFlagName: null,
    description: {
      short:
        'Used to check if user is in the Indexes Guidance Experiment Variant',
    },
  },

  {
    name: 'enableContextMenus',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable context (right-click) menus',
    },
  },

  {
    name: 'enableUnauthenticatedGenAI',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable GenAI for unauthenticated users',
    },
  },

  /**
   * Feature flag for CLOUDP-308952.
   */
  {
    name: 'enableSearchActivationProgramP1',
    stage: 'development',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable interface to view and modify search indexes',
    },
  },

  /**
   * Feature flag for AI Assistant.
   */
  {
    name: 'enableAIAssistant',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable AI Assistant',
    },
  },

  /*
   * Feature flag for AI Assistant's performance insight entrypoints.
   */
  {
    name: 'enablePerformanceInsightsEntrypoints',
    stage: 'development',
    atlasCloudFeatureFlagName: null,
    description: {
      short: 'Enable the performance insights AI Assistant entrypoints',
    },
  },

  {
    name: 'enableAutomaticRelationshipInference',
    stage: 'released',
    atlasCloudFeatureFlagName: null,
    description: {
      short:
        'Enable automatic relationship inference during data model generation',
    },
  },
] as const satisfies ReadonlyArray<FeatureFlagDefinition>;

type FeatureFlagDefinitions = typeof FEATURE_FLAG_DEFINITIONS;

export const ATLAS_CLOUD_FEATURE_FLAGS = FEATURE_FLAG_DEFINITIONS.map(
  (definition) => {
    return definition.atlasCloudFeatureFlagName;
  }
).filter((name): name is NonNullable<typeof name> => {
  return !!name;
});

export type AtlasCloudFeatureFlags = Record<
  (typeof ATLAS_CLOUD_FEATURE_FLAGS)[number],
  boolean | undefined
>;

export type FeatureFlags = Record<
  FeatureFlagDefinitions[number]['name'],
  boolean
>;

// Helper to convert feature flag definitions to preference definitions
function featureFlagToPreferenceDefinition(
  featureFlag: FeatureFlagDefinitions[number]
): PreferenceDefinition<keyof FeatureFlags> {
  return {
    cli: true,
    global: true,
    ui: true,
    description: featureFlag.description,
    // Only show feature flags in 'preview' stage in --help output
    omitFromHelp:
      (featureFlag.stage as FeatureFlagDefinition['stage']) !== 'preview',
    // if a feature flag is 'released' it will always return true
    // regardless of any persisted value.
    deriveValue: (getValue, getState, atlasCloudFeatureFlags) => {
      if (featureFlag.atlasCloudFeatureFlagName) {
        const atlasCloudFeatureFlagValue =
          atlasCloudFeatureFlags[featureFlag.atlasCloudFeatureFlagName];
        if (atlasCloudFeatureFlagValue !== undefined) {
          return {
            value: atlasCloudFeatureFlagValue,
            state: 'derived',
          };
        }
      }
      if (featureFlag.stage === 'released') {
        return { value: true, state: 'hardcoded' };
      }
      return {
        value: getValue(featureFlag.name),
        state: getState(featureFlag.name),
      };
    },
    validator: z.boolean().default(false),
    type: 'boolean',
  };
}

// Preference definitions
export const FEATURE_FLAG_PREFERENCES = Object.fromEntries(
  FEATURE_FLAG_DEFINITIONS.map((definition) => {
    return [definition.name, featureFlagToPreferenceDefinition(definition)];
  })
) as Record<keyof FeatureFlags, PreferenceDefinition<keyof FeatureFlags>>;
