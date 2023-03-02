import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type { SettingsListProps } from './settings-list';
import { SettingsList } from './settings-list';
import { pick } from '../../utils/pick';
import preferences, { usePreference } from 'compass-preferences-model';

const devFeatureFlagFields = [
  'showDevFeatureFlags',
  'debugUseCsfleSchemaMap',
  'useNewExportBackend',
] as const;

export const publicFeatureFlagFields = ['lgDarkmode'] as const;

const featureFlagFields = [
  ...publicFeatureFlagFields,
  ...devFeatureFlagFields,
] as const;
type FeatureFlagFields = typeof featureFlagFields[number];
type FeatureFlagSettingsProps = Omit<
  SettingsListProps<FeatureFlagFields>,
  'fields'
>;

(globalThis as any).setShowDevFeatureFlags = async (
  showDevFeatureFlags = true
) => {
  await preferences.savePreferences({ showDevFeatureFlags });
};

export function useShouldShowDevFeatureFlags(): boolean {
  return (
    usePreference('showDevFeatureFlags', React) ??
    process.env.NODE_ENV === 'development'
  );
}

export function useShouldShowFeatureFlagsSettings(): boolean {
  return useShouldShowDevFeatureFlags() || publicFeatureFlagFields.length > 0;
}

export const FeatureFlagSettings: React.FunctionComponent<
  FeatureFlagSettingsProps
> = ({ ...props }) => {
  const showDevFeatureFlags = useShouldShowDevFeatureFlags();
  return (
    <div data-testid="feature-flag-settings">
      <div>
        These settings control experimental behavior of Compass. Use them at
        your own risk!
      </div>
      <SettingsList
        fields={
          showDevFeatureFlags ? featureFlagFields : publicFeatureFlagFields
        }
        {...props}
      />
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

export default connect(mapState, mapDispatch)(FeatureFlagSettings);
