import React from 'react';
import { connect } from 'react-redux';
import { Body, Link } from '@mongodb-js/compass-components';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type { SettingsListProps } from './settings-list';
import { SettingsList } from './settings-list';
import { pick } from '../../utils/pick';

const privacyFields = [
  'autoUpdates',
  'enableMaps',
  'trackErrors',
  'trackUsageStatistics',
  'enableFeedbackPanel',
] as const;
type PrivacyFields = typeof privacyFields[number];
type PrivacySettingsProps = Omit<SettingsListProps<PrivacyFields>, 'fields'>;

export const PrivacySettings: React.FunctionComponent<PrivacySettingsProps> = ({
  ...props
}) => {
  return (
    <div data-testid="privacy-settings">
      <Body>
        To enhance the user experience, Compass can integrate with 3rd party
        services, which requires external network requests. Please choose from
        the settings below:
      </Body>

      <SettingsList fields={privacyFields} {...props} />

      <Body>
        With any of these options, none of your personal information or stored
        data will be submitted.
        <br />
        Learn more:&nbsp;
        <Link href="https://www.mongodb.com/legal/privacy-policy">
          MongoDB Privacy Policy
        </Link>
      </Body>
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  currentValues: pick(settings, privacyFields),
  preferenceStates: pick(preferenceStates, privacyFields),
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(PrivacySettings);
