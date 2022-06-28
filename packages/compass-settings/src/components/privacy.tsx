import React from 'react';

import {
  Body,
  Checkbox,
  Label,
  Description,
  css,
  spacing,
} from '@mongodb-js/compass-components';

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const PrivacySettings: React.FunctionComponent = () => {
  const handleCheckboxChange = (
    event: React.ChangeEventHandler<HTMLInputElement>
  ) => {
    console.log(event);
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
        data-hook="auto-updates-checkbox"
        data-test-id="auto-updates-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="useSystemCA-input">Enable Automatic Updates</Label>
            <Description>
              Allow Compass to periodically check for new updates.
            </Description>
          </>
        }
        checked={true}
      />

      <Checkbox
        className={checkboxStyles}
        name="enableMaps"
        data-hook="enable-maps-checkbox"
        data-test-id="enable-maps-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="useSystemCA-input">
              Enable Geographic Visualizations
            </Label>
            <Description>
              Allow Compass to make requests to a 3rd party mapping service.
            </Description>
          </>
        }
        checked={true}
      />

      <Checkbox
        className={checkboxStyles}
        name="trackErrors"
        data-hook="track-errors-checkbox"
        data-test-id="track-errors-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="useSystemCA-input">Enable Crash Reports</Label>
            <Description>
              Allow Compass to send crash reports containing stack traces and
              unhandled exceptions.
            </Description>
          </>
        }
        checked={true}
      />

      <Checkbox
        className={checkboxStyles}
        name="trackUsageStatistics"
        data-hook="usage-stats-checkbox"
        data-test-id="usage-stats-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="useSystemCA-input">Enable Usage Statistics</Label>
            <Description>
              Allow Compass to send anonymous usage statistics.
            </Description>
          </>
        }
        checked={true}
      />

      <Checkbox
        className={checkboxStyles}
        name="enableFeedbackPanel"
        data-hook="product-feedback-checkbox"
        data-test-id="product-feedback-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="useSystemCA-input">Give Product Feedback</Label>
            <Description>
              Enables a tool that our Product team can use to occasionally reach
              out for feedback about Compass.
            </Description>
          </>
        }
        checked={true}
      />
    </div>
  );
};

export default PrivacySettings;
