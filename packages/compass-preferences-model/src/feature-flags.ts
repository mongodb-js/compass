import { z } from '@mongodb-js/compass-user-data';
import type {
  PreferenceDefinition,
  PreferenceState,
} from './preferences-schema';

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
   * Optional field that is used to specify the scope of the
   * feature flag for Atlas Cloud. Supply this when the feature flag is intended
   * to be set in Atlas and not scoped to Compass.
   */
  atlasCloudFeatureScope?: 'group' | 'organization';
  description: {
    short: string;
    long?: string;
  };
};

export const FEATURE_FLAG_DEFINITIONS = [
  {
    name: 'enableRollingIndexes',
    stage: 'released',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Enable creating indexes with the rolling build in Atlas Cloud',
    },
  },

  {
    name: 'enableGlobalWrites',
    stage: 'released',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Enable Global Writes tab in Atlas Cloud',
    },
  },

  /**
   * Feature flag for CLOUDP-308952.
   */
  {
    name: 'enableSearchActivationProgramP1',
    stage: 'development',
    description: {
      short: 'Enable interface to view and modify search indexes',
    },
  },

  /**
   * Feature flag for CLOUDP-331931.
   */
  {
    name: 'enableSearchActivationProgramP2',
    stage: 'development',
    description: {
      short: 'Enable AI-powered features for pipeline and query results',
    },
  },

  /**
   * Feature flag for AI Assistant.
   */
  {
    name: 'enableAIAssistant',
    stage: 'released',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Enable AI Assistant',
    },
  },

  /*
   * Feature flag for AI Assistant's tool calling feature.
   */
  {
    name: 'enableToolCalling',
    stage: 'released',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Enable tool calling in the AI Assistant',
    },
  },

  {
    name: 'enableRestoreWorkspaces',
    stage: 'development',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Enable restoring previous workspace tabs on startup',
    },
  },

  {
    name: 'enableRerank',
    stage: 'released',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Enable $rerank stage UI in Aggregation Pipeline Builder',
    },
  },

  /*
   * Feature flag for auto embedding public preview UI changes.
   */
  {
    name: 'enableAutoEmbeddingPublicPreview',
    stage: 'preview',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Adds UI for auto-embedded vector search indexes',
    },
  },

  /*
   * Feature flag for auto embedding private preview UI changes.
   */
  {
    name: 'enableAutoEmbeddingPrivatePreview',
    stage: 'preview',
    atlasCloudFeatureScope: 'group',
    description: {
      short:
        'Adds UI for auto-embedded vector search indexes (private preview)',
    },
  },

  /*
   * Feature flag for sorted search indexes.
   */
  {
    name: 'enableSortedSearchIndexes',
    stage: 'preview',
    atlasCloudFeatureScope: 'group',
    description: {
      short: 'Enable sorted syntax for search indexes schema',
    },
  },
] as const satisfies ReadonlyArray<FeatureFlagDefinition>;

type FeatureFlagDefinitions = typeof FEATURE_FLAG_DEFINITIONS;

export type FeatureFlags = Record<
  FeatureFlagDefinitions[number]['name'],
  boolean
>;

function isDerivedFromCloudFeatureFlag(prefState: PreferenceState) {
  return (
    prefState === 'set-cloud-org' ||
    prefState === 'set-cloud-project' ||
    prefState === 'set-cloud-user'
  );
}

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
    omitFromHelp: featureFlag.stage !== 'preview',
    // if a feature flag is 'released' it will always return true
    // regardless of any persisted value.
    deriveValue: (getValue, getState) => {
      if (
        featureFlag.stage === 'released' &&
        !isDerivedFromCloudFeatureFlag(getState(featureFlag.name))
      ) {
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
