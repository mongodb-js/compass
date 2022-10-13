import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Checkbox,
  Label,
  Description,
  css,
  spacing,
  RadioBoxGroup,
  RadioBox,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/updated-fields';
import type {
  PreferenceStateInformation,
  THEMES,
} from 'compass-preferences-model';
import { settingStateLabels } from './state-labels';

type ThemeSettingsProps = {
  handleChange: (field: 'theme', value: THEMES) => void;
  preferenceStates: PreferenceStateInformation;
  themeValue: THEMES;
};

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

export const ThemeSettings: React.FunctionComponent<ThemeSettingsProps> = ({
  themeValue,
  preferenceStates,
  handleChange,
}) => {
  const handleOSCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange('theme', event.target.checked ? 'OS_THEME' : 'LIGHT');
    },
    [handleChange]
  );
  const handleSelectorChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange('theme', event.target.value as THEMES);
    },
    [handleChange]
  );

  return (
    <div data-testid="theme-settings">
      <Body>Change the appearance of Compass.</Body>

      <div>
        <Checkbox
          className={checkboxStyles}
          name="use-os-theme"
          id="use-os-theme"
          data-testid="use-os-theme"
          label={
            <>
              <Label htmlFor="use-os-theme">Sync with OS</Label>
              <Description>
                Automatically switch between light and dark themes based on your
                OS settings
              </Description>
            </>
          }
          onChange={handleOSCheckboxChange}
          checked={themeValue === 'OS_THEME'}
          disabled={!!preferenceStates.theme}
        />
        {settingStateLabels[preferenceStates.theme ?? '']}
      </div>

      <RadioBoxGroup
        id="theme-selector"
        onChange={handleSelectorChange}
        value={themeValue}
      >
        <RadioBox
          id="theme-selector-light"
          data-testid="theme-selector-light"
          value="LIGHT"
          disabled={!!preferenceStates.theme || themeValue === 'OS_THEME'}
        >
          Light Theme
        </RadioBox>
        <RadioBox
          id="theme-selector-dark"
          data-testid="theme-selector-dark"
          value="DARK"
          disabled={!!preferenceStates.theme || themeValue === 'OS_THEME'}
        >
          Dark Theme
        </RadioBox>
      </RadioBoxGroup>
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  themeValue: settings.theme ?? 'OS_THEME',
  preferenceStates,
});

const mapDispatch = {
  handleChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(ThemeSettings);
