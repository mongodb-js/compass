import React from 'react';
import { useTranslation } from '@mongodb-js/compass-components';
import SettingsList from './settings-list';
import type { FeatureFlagDefinition } from 'compass-preferences-model/provider';
import {
  usePreference,
  featureFlags,
} from 'compass-preferences-model/provider';

export const previewFeatureFlagFields = featureFlags
  .filter((definition) => {
    return (definition as FeatureFlagDefinition).stage === 'preview'; // asserting to a more generic type as we don't currently have `preview` flags
  })
  .map((definition) => {
    return definition.name;
  });

export const developmentFeatureFlagFields = featureFlags
  .filter((definition) => {
    return definition.stage === 'development';
  })
  .map((definition) => {
    return definition.name;
  });

function useShouldShowDevFeatures(): boolean {
  const showDevFeatureFlags = usePreference('showDevFeatureFlags') ?? false;

  return showDevFeatureFlags && developmentFeatureFlagFields.length > 0;
}

function useShouldShowPreviewFeatures(): boolean {
  return previewFeatureFlagFields.length > 0;
}

export function useShouldShowFeaturePreviewSettings(): boolean {
  // We want show the feature preview settings tab if:
  // - there are feature flags in preview stage
  // - or if:
  //   - we are in a development environment or 'showDevFeatureFlags' is explicitly enabled
  //   - and there are feature flags in 'development' stage.
  const showDevFeatures = useShouldShowDevFeatures();
  const showPreviewFeatures = useShouldShowPreviewFeatures();

  return showPreviewFeatures || showDevFeatures;
}

export const FeaturePreviewSettings: React.FunctionComponent = () => {
  const t = useTranslation();
  const showPreviewFeatures = useShouldShowPreviewFeatures();
  const showDevFeatures = useShouldShowDevFeatures();

  return (
    <div data-testid="feature-flag-settings">
      <div>
        {t(
          'settings.preview.intro',
          'These settings control experimental behavior of Compass. Use them at your own risk!'
        )}
      </div>
      <div>
        {showPreviewFeatures && (
          <SettingsList fields={previewFeatureFlagFields} />
        )}
        {showDevFeatures && (
          <SettingsList fields={developmentFeatureFlagFields} />
        )}
      </div>
    </div>
  );
};

export default FeaturePreviewSettings;
