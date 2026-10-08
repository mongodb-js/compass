import React from 'react';
import { useTranslation } from '@mongodb-js/compass-components';
import SettingsList from './settings-list';

export const oidcFields = [
  'browserCommandForOIDCAuth',
  'showOIDCDeviceAuthFlow',
  'persistOIDCTokens',
] as const;

export const OIDCSettings: React.FunctionComponent = () => {
  const t = useTranslation();
  return (
    <div data-testid="oidc-settings">
      <div>
        {t(
          'settings.oidc.intro',
          'Change the behavior of the OIDC authentication mechanism for server connection and Atlas Login in Compass.'
        )}
      </div>
      <SettingsList fields={['browserCommandForOIDCAuth']} />
      <div>
        <strong>
          {t(
            'settings.oidc.serverOptions',
            'MongoDB server OIDC Authentication options'
          )}
        </strong>
      </div>
      <SettingsList fields={['showOIDCDeviceAuthFlow', 'persistOIDCTokens']} />
    </div>
  );
};

export default OIDCSettings;
