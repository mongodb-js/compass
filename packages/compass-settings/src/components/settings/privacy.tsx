import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@mongodb-js/compass-components';
import SettingsList from './settings-list';

const privacyFields = [
  'autoUpdates',
  'enableMaps',
  'trackUsageStatistics',
  'enableFeedbackPanel',
] as const;

export const PrivacySettings: React.FunctionComponent = () => {
  const { t } = useTranslation('compassSettings');
  return (
    <div data-testid="privacy-settings">
      <div>{t('privacyIntro')}</div>
      <SettingsList fields={privacyFields} />
      <div>
        {t('privacyOutro')}
        <br />
        {t('privacyLearnMore')}&nbsp;
        <Link href="https://www.mongodb.com/legal/privacy-policy">
          {t('privacyPolicy')}
        </Link>
      </div>
    </div>
  );
};

export default PrivacySettings;
