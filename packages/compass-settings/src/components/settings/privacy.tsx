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
} from '@mongodb-js/compass-components';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';

type PrivacySettingsProps = {
  handleChange: (field: string, value: boolean) => void;
  autoUpdates?: boolean;
  enableMaps?: boolean;
  trackErrors?: boolean;
  trackUsageStatistics?: boolean;
  enableFeedbackPanel?: boolean;
};

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const PrivacySettings: React.FunctionComponent<PrivacySettingsProps> = ({
  autoUpdates,
  enableMaps,
  trackErrors,
  trackUsageStatistics,
  enableFeedbackPanel,
  handleChange,
}) => {
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(event.target.name, event.target.checked);
  };
  return (
    <div>
      <Body>
        To enhance the user experience, Compass can integrate with 3rd party
        services, which requires external network requests. Please choose from
        the settings below:
      </Body>

      <Checkbox
        className={checkboxStyles}
        name="autoUpdates"
        id="autoUpdates"
        data-hook="auto-updates-checkbox"
        data-test-id="auto-updates-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="autoUpdates">Enable Automatic Updates</Label>
            <Description>
              Allow Compass to periodically check for new updates.
            </Description>
          </>
        }
        checked={autoUpdates}
      />

      <Checkbox
        className={checkboxStyles}
        name="enableMaps"
        id="enableMaps"
        data-hook="enable-maps-checkbox"
        data-test-id="enable-maps-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="enableMaps">Enable Geographic Visualizations</Label>
            <Description>
              Allow Compass to make requests to a 3rd party mapping service.
            </Description>
          </>
        }
        checked={enableMaps}
      />

      <Checkbox
        className={checkboxStyles}
        name="trackErrors"
        id="trackErrors"
        data-hook="track-errors-checkbox"
        data-test-id="track-errors-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="trackErrors">Enable Crash Reports</Label>
            <Description>
              Allow Compass to send crash reports containing stack traces and
              unhandled exceptions.
            </Description>
          </>
        }
        checked={trackErrors}
      />

      <Checkbox
        className={checkboxStyles}
        name="trackUsageStatistics"
        id="trackUsageStatistics"
        data-hook="usage-stats-checkbox"
        data-test-id="usage-stats-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="trackUsageStatistics">
              Enable Usage Statistics
            </Label>
            <Description>
              Allow Compass to send anonymous usage statistics.
            </Description>
          </>
        }
        checked={trackUsageStatistics}
      />

      <Checkbox
        className={checkboxStyles}
        name="enableFeedbackPanel"
        id="enableFeedbackPanel"
        data-hook="product-feedback-checkbox"
        data-test-id="product-feedback-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="enableFeedbackPanel">Give Product Feedback</Label>
            <Description>
              Enables a tool that our Product team can use to occasionally reach
              out for feedback about Compass.
            </Description>
          </>
        }
        checked={enableFeedbackPanel}
      />

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

const mapState = ({
  settings: {
    autoUpdates,
    enableMaps,
    trackErrors,
    trackUsageStatistics,
    enableFeedbackPanel,
  },
}: RootState) => ({
  autoUpdates,
  enableMaps,
  trackErrors,
  trackUsageStatistics,
  enableFeedbackPanel,
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(PrivacySettings);
