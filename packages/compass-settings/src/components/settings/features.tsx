import React from 'react';
import { connect } from 'react-redux';
import { Body } from '@mongodb-js/compass-components';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type { SettingsListProps } from './settings-list';
import { SettingsList } from './settings-list';
import { pick } from '../../utils/pick';

const featuresFields = [
  'readOnly',
  'enableShell',
  'protectConnectionStrings',
  'showKerberosPasswordField',
  'maxTimeMS',
] as const;
type FeaturesFields = typeof featuresFields[number];
type FeaturesSettingsProps = Omit<SettingsListProps<FeaturesFields>, 'fields'>;

export const FeaturesSettings: React.FunctionComponent<
  FeaturesSettingsProps
> = ({ ...props }) => {
  return (
    <div data-testid="features-settings">
      <Body>
        To enhance the user experience, Compass can enable or disable particular
        features. Please choose from the settings below:
      </Body>

      <SettingsList fields={featuresFields} {...props} />
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  currentValues: pick(settings, featuresFields),
  preferenceStates: pick(preferenceStates, featuresFields),
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(FeaturesSettings);
