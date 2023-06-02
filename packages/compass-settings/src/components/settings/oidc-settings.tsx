import React from 'react';
import { connect } from 'react-redux';

import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type { SettingsListProps } from './settings-list';
import { SettingsList } from './settings-list';
import { pick } from '../../utils/pick';

const oidcFields = [
  'browserCommandForOIDCAuth',
  'showOIDCDeviceAuthFlow',
] as const;
type OIDCFields = typeof oidcFields[number];
type OIDCSettingsProps = Omit<SettingsListProps<OIDCFields>, 'fields'>;

export const OIDCSettings: React.FunctionComponent<OIDCSettingsProps> = ({
  ...props
}) => {
  return (
    <div data-testid="oidc-settings">
      <div>
        Change the behavior of the OIDC authentication mechanism in Compass.
      </div>
      <SettingsList fields={oidcFields} {...props} />
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  currentValues: pick(settings, oidcFields),
  preferenceStates: pick(preferenceStates, oidcFields),
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(OIDCSettings);
