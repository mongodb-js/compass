import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type { SettingsListProps } from './settings-list';
import { SettingsList } from './settings-list';
import { pick } from '../../utils/pick';
import preferences, {
  usePreference,
  featureFlags,
} from 'compass-preferences-model';

const featureFlagFields = Object.keys(
  featureFlags
) as (keyof typeof featureFlags)[];

const previewFeatureFlagFields = featureFlagFields.filter(
  (k: keyof typeof featureFlags) => featureFlags[k].stage === 'preview'
);

const developmentFeatureFlagFields = featureFlagFields.filter(
  (k: keyof typeof featureFlags) => featureFlags[k].stage === 'development'
);

type FeatureFlagFields = typeof featureFlagFields[number];
type FeaturePreviewSettingsProps = Omit<
  SettingsListProps<FeatureFlagFields>,
  'fields'
>;

// Lets us call `setShowDevFeatureFlags(true | false)` from DevTools.
(globalThis as any).setShowDevFeatureFlags = async (
  showDevFeatureFlags = true
) => {
  await preferences.savePreferences({ showDevFeatureFlags });
};

function useShouldShowDevFeatures(): boolean {
  const showDevFeatureFlags =
    usePreference('showDevFeatureFlags', React) ?? false;

  // Dev feature flags are always shown as preview settings
  // in local development and in Compass Dev
  const isDevEnvironment = process.env.HADRON_CHANNEL === 'dev';
  return (
    (isDevEnvironment || showDevFeatureFlags) &&
    developmentFeatureFlagFields.length > 0
  );
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

export const FeaturePreviewSettings: React.FunctionComponent<
  FeaturePreviewSettingsProps
> = ({ ...props }) => {
  const showPreviewFeatures = useShouldShowPreviewFeatures();
  const showDevFeatures = useShouldShowDevFeatures();

  return (
    <div data-testid="feature-flag-settings">
      <div>
        These settings control experimental behavior of Compass. Use them at
        your own risk!
      </div>

      {showPreviewFeatures && (
        <SettingsList fields={previewFeatureFlagFields} {...props} />
      )}

      {showDevFeatures && (
        <SettingsList fields={developmentFeatureFlagFields} {...props} />
      )}
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  currentValues: pick(settings, featureFlagFields),
  preferenceStates: pick(preferenceStates, featureFlagFields),
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(FeaturePreviewSettings);
