import React, { useMemo } from 'react';
import { Link } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { UserPreferences } from 'compass-preferences-model';
import { withPreferences } from 'compass-preferences-model';

import SettingsList from './settings-list';
import type { RootState } from '../../stores';

const privacyFields = [
  'autoUpdates',
  'enableMaps',
  'enableGenAIFeatures',
  'trackUsageStatistics',
  'enableFeedbackPanel',
] as const;

export const PrivacySettings: React.FunctionComponent<{
  isAIFeatureRolledOutToUser?: boolean;
}> = ({ isAIFeatureRolledOutToUser }) => {
  const privacyFieldsShown = useMemo(() => {
    return isAIFeatureRolledOutToUser
      ? privacyFields
      : privacyFields.filter((field) => field !== 'enableGenAIFeatures');
  }, [isAIFeatureRolledOutToUser]);

  return (
    <div data-testid="privacy-settings">
      <div>
        To enhance the user experience, Compass can integrate with 3rd party
        services, which requires external network requests. Please choose from
        the settings below:
      </div>
      <SettingsList fields={privacyFieldsShown} />
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

export default withPreferences(
  connect(
    (
      state: RootState,
      ownProps: {
        cloudFeatureRolloutAccess?: UserPreferences['cloudFeatureRolloutAccess'];
      }
    ) => {
      return {
        isAIFeatureRolledOutToUser:
          ownProps.cloudFeatureRolloutAccess?.GEN_AI_COMPASS,
      };
    }
  )(PrivacySettings),
  ['cloudFeatureRolloutAccess'],
  React
);
