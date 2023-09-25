import React from 'react';
import SettingsList from './settings-list';

export const OIDCSettings: React.FunctionComponent = () => {
  return (
    <div data-testid="oidc-settings">
      <div>
        Change the behavior of the OIDC authentication mechanism for server
        connection and Atlas Login in Compass.
      </div>
      <SettingsList fields={['browserCommandForOIDCAuth']} />
      <div>
        <strong>MongoDB server OIDC Authentication options</strong>
      </div>
      <SettingsList fields={['showOIDCDeviceAuthFlow', 'persistOIDCTokens']} />
    </div>
  );
};

export default OIDCSettings;
