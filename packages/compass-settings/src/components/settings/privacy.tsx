import React from 'react';
import { Link, useTranslation } from '@mongodb-js/compass-components';
import SettingsList from './settings-list';

export const privacyFields = [
  'autoUpdates',
  'enableMaps',
  'trackUsageStatistics',
  'enableFeedbackPanel',
] as const;

export const PrivacySettings: React.FunctionComponent = () => {
  const t = useTranslation();
  return (
    <div data-testid="privacy-settings">
      <div>
        {t(
          'settings.privacy.intro',
          'To enhance the user experience, Compass can integrate with 3rd party services, which requires external network requests. Please choose from the settings below:'
        )}
      </div>
      <SettingsList fields={privacyFields} />
      <div>
        {t(
          'settings.privacy.footer',
          'With any of these options, none of your personal information or stored data will be submitted.'
        )}
        <br />
        {t('settings.privacy.learnMore', 'Learn more:')}&nbsp;
        <Link href="https://www.mongodb.com/legal/privacy-policy">
          {t('settings.privacy.policy', 'MongoDB Privacy Policy')}
        </Link>
      </div>
    </div>
  );
};

export default PrivacySettings;
