import { useEffect, useState } from 'react';

type AtlasPreferences = {
  enableGenAIFeaturesAtlasProject: boolean;
  enableGenAISampleDocumentPassingOnAtlasProject: boolean;
  enableGenAIFeaturesAtlasOrg: boolean;
  optInDataExplorerGenAIFeatures: boolean;
};

type AtlasPreferencesReturnValue =
  | {
      status: 'loading';
      preferences: null;
    }
  | { status: 'loaded'; preferences: AtlasPreferences };

export function useAtlasPreferences({
  projectId,
}: {
  projectId?: string;
}): AtlasPreferencesReturnValue {
  const [preferences, setAtlasPreferences] = useState<AtlasPreferences | null>(
    null
  );

  const overrideGenAIEnablement =
    process.env.COMPASS_WEB_GEN_AI_ENABLEMENT === 'true';

  useEffect(() => {
    if (!projectId || overrideGenAIEnablement) {
      return;
    }

    const fetchPreferences = async () => {
      if (
        process.env.E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT !== undefined &&
        process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG === 'false'
      ) {
        try {
          // When we're running e2e tests and want to customize these preferences on the fly
          // we make a request to the server to override the preferences.
          const {
            enableGenAIFeaturesAtlasProject,
            enableGenAISampleDocumentPassingOnAtlasProject,
            enableGenAIFeaturesAtlasOrg,
            optInDataExplorerGenAIFeatures,
          } = await fetch(
            `http://localhost:${process.env.E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT}/atlas-preferences`
          ).then((res) => res.json());

          setAtlasPreferences({
            enableGenAIFeaturesAtlasProject,
            enableGenAISampleDocumentPassingOnAtlasProject,
            enableGenAIFeaturesAtlasOrg,
            optInDataExplorerGenAIFeatures,
          });
        } catch (e) {
          /** no-op when the server isn't up. */
        }
      }

      const {
        appUser: { isOptedIntoDataExplorerGenAIFeatures },
        currentOrganization: { genAIFeaturesEnabled },
        featureFlags: { groupEnabledFeatureFlags },
      } = await fetch(`/cloud-mongodb-com/v2/${projectId}/params`).then(
        (res) => {
          return res.json();
        }
      );

      setAtlasPreferences({
        optInDataExplorerGenAIFeatures: isOptedIntoDataExplorerGenAIFeatures,
        enableGenAIFeaturesAtlasOrg: genAIFeaturesEnabled,
        enableGenAISampleDocumentPassingOnAtlasProject:
          groupEnabledFeatureFlags.includes(
            'ENABLE_DATA_EXPLORER_GEN_AI_SAMPLE_DOCUMENT_PASSING'
          ),
        enableGenAIFeaturesAtlasProject: groupEnabledFeatureFlags.includes(
          'ENABLE_DATA_EXPLORER_GEN_AI_FEATURES'
        ),
      });
    };

    void fetchPreferences();
  }, [projectId, overrideGenAIEnablement]);

  if (overrideGenAIEnablement) {
    return {
      status: 'loaded',
      preferences: {
        enableGenAIFeaturesAtlasProject: true,
        enableGenAISampleDocumentPassingOnAtlasProject: true,
        enableGenAIFeaturesAtlasOrg: true,
        optInDataExplorerGenAIFeatures: true,
      },
    };
  }

  if (!preferences) {
    return {
      status: 'loading',
      preferences: null,
    };
  }

  return {
    status: 'loaded',
    preferences,
  };
}
