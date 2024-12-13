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
      // console.log('111');
      // if (
      //   process.env.E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT !== undefined &&
      //   process.env.E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT !== 'false'
      // ) {
      //   console.log('22222');

      //   try {
      //     // When we're running e2e tests and want to customize these preferences on the fly
      //     // we make a request to the server to override the preferences.
      //     const {
      //       enableGenAIFeaturesAtlasProject,
      //       enableGenAISampleDocumentPassingOnAtlasProject,
      //       enableGenAIFeaturesAtlasOrg,
      //       optInDataExplorerGenAIFeatures,
      //     } = await fetch(
      //       `http://localhost:${process.env.E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT}`
      //     ).then((res) => res.json());
      //     console.log('4444');

      //     setAtlasPreferences({
      //       enableGenAIFeaturesAtlasProject,
      //       enableGenAISampleDocumentPassingOnAtlasProject,
      //       enableGenAIFeaturesAtlasOrg,
      //       optInDataExplorerGenAIFeatures,
      //     });
      //     return;
      //   } catch (e) {
      //     /** no-op when the server isn't up. */        console.log('77777');

      //   }
      // }

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
