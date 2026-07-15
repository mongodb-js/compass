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
  /**
   * Feature flag for enabling OIDC authentication.
   * Epic: COMPASS-5955
   */
  {
    name: 'enableOidc', // Not capitalized "OIDC" for spawn arg casing.
    stage: 'released',
    description: {
      short: 'Enable OIDC Authentication',
    },
  },

  {
    name: 'newExplainPlan',
    stage: 'released',
    description: {
      short: 'Access explain plan from query bar',
      long: 'Explain plan is now accessible right from the query bar. To view a query’s execution plan, click “Explain” as you would on an aggregation pipeline.',
    },
  },

  {
    name: 'showInsights',
    stage: 'released',
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
    description: {
      short: 'Enables support for explicit proxy configuration.',
      long: 'Allows users to specify proxy configuration for the entire Compass application.',
    },
  },

  {
    name: 'showDisabledConnections',
    stage: 'released',
    description: {
      short:
        'Show clusters that are not in a "connectable" state in Atlas Cloud',
    },
  },

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
   * Feature flag for export schema. Epic: COMPASS-6862.
   */
  {
    name: 'enableExportSchema',
    stage: 'released',
    description: {
      short: 'Enable schema export',
    },
  },

  /**
   * https://jira.mongodb.org/browse/INIT-592
   */
  {
    name: 'enableDataModeling',
    stage: 'released',
    description: {
      short: 'Design, Visualize, and Evolve your Data Model',
    },
  },

  /**
   * Feature flag for Data Modeling Collapse / Expand functionality. Epic COMPASS-9625
   */
  {
    name: 'enableDataModelingCollapse',
    stage: 'released',
    description: {
      short: 'Enable Collapse / Expand functionality in Data Modeling',
    },
  },

  {
    name: 'enableContextMenus',
    stage: 'released',
    description: {
      short: 'Enable context (right-click) menus',
    },
  },

  {
    name: 'enableUnauthenticatedGenAI',
    stage: 'released',
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
    description: {
      short: 'Enable restoring previous workspace tabs on startup',
    },
  },

  {
    name: 'enableAutomaticRelationshipInference',
    stage: 'released',
    description: {
      short:
        'Enable automatic relationship inference during data model generation',
    },
  },
  {
    name: 'enableChatbotEndpointForGenAI',
    stage: 'released',
    description: {
      short: 'Enable Chatbot API for Generative AI',
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
