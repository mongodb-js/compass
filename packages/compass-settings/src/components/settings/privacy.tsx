import React from 'react';
import { Link } from '@mongodb-js/compass-components';
import SettingsList from './settings-list';

const privacyFields = [
  'autoUpdates',
  'enableAI',
  'enableMaps',
  'trackUsageStatistics',
  'enableFeedbackPanel',
] as const;

export const PrivacySettings: React.FunctionComponent = () => {
  return (
    <div data-testid="privacy-settings">
      <div>
        To enhance the user experience, Compass can integrate with 3rd party
        services, which requires external network requests. Please choose from
        the settings below:
      </div>
      <SettingsList fields={privacyFields} />
      <div>
        With any of these options, none of your personal information or stored
        data will be submitted.
        <br />
        Learn more:&nbsp;
        <Link href="https://www.mongodb.com/legal/privacy-policy">
          MongoDB Privacy Policy
        </Link>
      </div>
    </div>
  );
};

export default PrivacySettings;
