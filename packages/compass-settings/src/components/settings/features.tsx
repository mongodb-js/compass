import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Checkbox,
  Label,
  Description,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/updated-fields';
import { getSettingDescription } from 'compass-preferences-model';
import type {
  PreferenceStateInformation,
  UserConfigurablePreferences,
} from 'compass-preferences-model';
import { settingStateLabels } from './state-labels';

type FeaturesSettingsProps = {
  handleChange: (field: FeaturesFields, value: boolean) => void;
  preferenceStates: PreferenceStateInformation;
  checkboxValues: Pick<UserConfigurablePreferences, FeaturesFields>;
};

const featuresFields = ['readOnly', 'enableShell'] as const;
type FeaturesFields = typeof featuresFields[number];

type CheckboxItem = {
  name: FeaturesFields;
  label: JSX.Element;
};

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const checkboxItems: CheckboxItem[] = featuresFields.map((name) => {
  const { short, long } = getSettingDescription(name);
  return {
    name,
    label: (
      <>
        <Label htmlFor={name}>{short}</Label>
        {long && <Description>{long}</Description>}
      </>
    ),
  };
});

export const FeaturesSettings: React.FunctionComponent<
  FeaturesSettingsProps
> = ({ checkboxValues, preferenceStates, handleChange }) => {
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(event.target.name as FeaturesFields, event.target.checked);
  };

  return (
    <div data-testid="features-settings">
      <Body>
        To enhance the user experience, Compass can enable or disable particular
        features. Please choose from the settings below:
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
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  checkboxValues: {
    readOnly: !!settings.readOnly,
    enableShell: !!settings.enableShell,
  },
  preferenceStates,
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(FeaturesSettings);
