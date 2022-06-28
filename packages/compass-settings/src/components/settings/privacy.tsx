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
  handleChange: (field: CheckboxName, value: boolean) => void;
  autoUpdates?: boolean;
  enableMaps?: boolean;
  trackErrors?: boolean;
  trackUsageStatistics?: boolean;
  enableFeedbackPanel?: boolean;
};

type CheckboxName =
  | 'autoUpdates'
  | 'enableMaps'
  | 'trackErrors'
  | 'trackUsageStatistics'
  | 'enableFeedbackPanel';

type CheckboxItem = {
  name: CheckboxName;
  checked: boolean;
  label: JSX.Element;
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
  const checkboxItems: CheckboxItem[] = [
    {
      name: 'autoUpdates',
      checked: !!autoUpdates,
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
      checked: !!enableMaps,
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
      checked: !!trackErrors,
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
      checked: !!trackUsageStatistics,
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
      checked: !!enableFeedbackPanel,
      label: (
        <>
          <Label htmlFor="enableFeedbackPanel">Give Product Feedback</Label>
          <Description>
            Enables a tool that our Product team can use to occasionally reach
            out for feedback about Compass.
          </Description>
        </>
      ),
    },
  ];

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(event.target.name as CheckboxName, event.target.checked);
  };

  return (
    <div>
      <Body>
        To enhance the user experience, Compass can integrate with 3rd party
        services, which requires external network requests. Please choose from
        the settings below:
      </Body>

      {checkboxItems.map(({ name, checked, label }) => (
        <Checkbox
          key={name}
          className={checkboxStyles}
          name={name}
          id={name}
          data-testid={name}
          onChange={handleCheckboxChange}
          label={label}
          checked={checked}
        />
      ))}
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
