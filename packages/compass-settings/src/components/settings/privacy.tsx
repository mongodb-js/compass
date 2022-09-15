import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Checkbox,
  Label,
  Description,
  css,
  spacing,
  Link,
  Banner,
  BannerVariant,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/updated-fields';
import type {
  PreferenceStateInformation,
  UserConfigurablePreferences,
} from 'compass-preferences-model';

type PrivacySettingsProps = {
  handleChange: (field: PrivacyFields, value: boolean) => void;
  preferenceStates: PreferenceStateInformation;
  checkboxValues: Pick<UserConfigurablePreferences, PrivacyFields>;
};

type PrivacyFields =
  | 'autoUpdates'
  | 'enableMaps'
  | 'trackErrors'
  | 'trackUsageStatistics'
  | 'enableFeedbackPanel';

type CheckboxItem = {
  name: PrivacyFields;
  label: JSX.Element;
};

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const checkboxItems: CheckboxItem[] = [
  {
    name: 'autoUpdates',
    label: (
      <>
        <Label htmlFor="autoUpdates">Enable Automatic Updates</Label>
        <Description>
          Allow Compass to periodically check for new updates.
        </Description>
      </>
    ),
  },
  {
    name: 'enableMaps',
    label: (
      <>
        <Label htmlFor="enableMaps">Enable Geographic Visualizations</Label>
        <Description>
          Allow Compass to make requests to a 3rd party mapping service.
        </Description>
      </>
    ),
  },
  {
    name: 'trackErrors',
    label: (
      <>
        <Label htmlFor="trackErrors">Enable Crash Reports</Label>
        <Description>
          Allow Compass to send crash reports containing stack traces and
          unhandled exceptions.
        </Description>
      </>
    ),
  },
  {
    name: 'trackUsageStatistics',
    label: (
      <>
        <Label htmlFor="trackUsageStatistics">Enable Usage Statistics</Label>
        <Description>
          Allow Compass to send anonymous usage statistics.
        </Description>
      </>
    ),
  },
  {
    name: 'enableFeedbackPanel',
    label: (
      <>
        <Label htmlFor="enableFeedbackPanel">Give Product Feedback</Label>
        <Description>
          Enables a tool that our Product team can use to occasionally reach out
          for feedback about Compass.
        </Description>
      </>
    ),
  },
];

const settingStateLabels = {
  'set-cli': (
    <Banner variant={BannerVariant.Info} data-testid="set-cli-banner">
      This setting cannot be modified as it has been set at Compass startup.
    </Banner>
  ),
  'set-global': (
    <Banner variant={BannerVariant.Info} data-testid="set-global-banner">
      This setting cannot be modified as it has been set in the global Compass
      configuration file.
    </Banner>
  ),
  '': <></>,
};

export const PrivacySettings: React.FunctionComponent<PrivacySettingsProps> = ({
  checkboxValues,
  preferenceStates,
  handleChange,
}) => {
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(event.target.name as PrivacyFields, event.target.checked);
  };

  return (
    <div data-testid="privacy-settings">
      <Body>
        To enhance the user experience, Compass can integrate with 3rd party
        services, which requires external network requests. Please choose from
        the settings below:
      </Body>

      <div>
        {checkboxItems.map(({ name, label }) => (
          <div data-testid={`setting-${name}`} key={`setting-${name}`}>
            <Checkbox
              key={name}
              className={checkboxStyles}
              name={name}
              id={name}
              data-testid={name}
              onChange={handleCheckboxChange}
              label={label}
              checked={checkboxValues[name]}
              disabled={!!preferenceStates[name]}
            />
            {settingStateLabels[preferenceStates[name] ?? '']}
          </div>
        ))}
      </div>
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
  checkboxValues: {
    autoUpdates: !!settings.autoUpdates,
    enableMaps: !!settings.enableMaps,
    trackErrors: !!settings.trackErrors,
    trackUsageStatistics: !!settings.trackUsageStatistics,
    enableFeedbackPanel: !!settings.enableFeedbackPanel,
  },
  preferenceStates,
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(PrivacySettings);
