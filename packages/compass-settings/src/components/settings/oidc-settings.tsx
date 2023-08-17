import React from 'react';
import SettingsList from './settings-list';

const oidcFields = [
  'browserCommandForOIDCAuth',
  'showOIDCDeviceAuthFlow',
  'persistOIDCTokens',
] as const;

export const OIDCSettings: React.FunctionComponent = () => {
  return (
    <div data-testid="oidc-settings">
      <div>
        Change the behavior of the OIDC authentication mechanism in Compass.
      </div>
      <SettingsList fields={oidcFields} />
    </div>
  );
};

export default OIDCSettings;
