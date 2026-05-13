import React from 'react';
import { useTranslation } from 'react-i18next';
import SettingsList from './settings-list';

export const OIDCSettings: React.FunctionComponent = () => {
  const { t } = useTranslation('compassSettings');
  return (
    <div data-testid="oidc-settings">
      <div>{t('oidcIntro')}</div>
      <SettingsList fields={['browserCommandForOIDCAuth']} />
      <div>
        <strong>{t('oidcServerOptionsTitle')}</strong>
      </div>
      <SettingsList fields={['showOIDCDeviceAuthFlow', 'persistOIDCTokens']} />
    </div>
  );
};

export default OIDCSettings;
