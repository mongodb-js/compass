import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type { SettingsListProps } from './settings-list';
import { SettingsList } from './settings-list';
import { pick } from '../../utils/pick';

const generalFields = [
  'readOnly',
  'enableShell',
  'protectConnectionStrings',
  'showKerberosPasswordField',
  'maxTimeMS',
  'enableDevTools',
  ...(['darwin', 'win32'].includes(process.platform)
    ? (['installURLHandlers'] as const)
    : []),
] as const;
type GeneralFields = typeof generalFields[number];
type GeneralSettingsProps = Omit<SettingsListProps<GeneralFields>, 'fields'>;

export const GeneralSettings: React.FunctionComponent<GeneralSettingsProps> = ({
  ...props
}) => {
  return (
    <div data-testid="general-settings">
      <div>
        To enhance the user experience, Compass can enable or disable particular
        features. Please choose from the settings below:
      </div>
      <SettingsList fields={generalFields} {...props} />
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  currentValues: pick(settings, generalFields),
  preferenceStates: pick(preferenceStates, generalFields),
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(GeneralSettings);
