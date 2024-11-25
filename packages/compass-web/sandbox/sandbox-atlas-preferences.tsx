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

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const fetchPreferences = async () => {
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
  }, [projectId]);

  const overrideGenAIEnablement =
    process.env.COMPASS_WEB_GEN_AI_ENABLEMENT === 'true';
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
