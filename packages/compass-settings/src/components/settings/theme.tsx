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
import { changeFieldValue } from '../../stores/settings';
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

function LightThemePreview() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="none"
      viewBox="0 0 171 119"
    >
      <rect width="171" height="119" fill="#fff" rx="6" />
      <rect width="42" height="119" fill="#F9FBFA" rx="6" />
      <rect width="117" height="7" x="48" y="34" fill="#F9FBFA" rx="3.5" />
      <rect width="28" height="7" x="48" y="21" fill="#F9FBFA" rx="3.5" />
      <rect width="28" height="7" x="82" y="21" fill="#F9FBFA" rx="3.5" />
      <rect width="28" height="7" x="116" y="21" fill="#F9FBFA" rx="3.5" />
      <rect width="117" height="7" x="48" y="47" fill="#F9FBFA" rx="3.5" />
      <rect width="117" height="7" x="48" y="60" fill="#F9FBFA" rx="3.5" />
      <rect width="117" height="7" x="48" y="73" fill="#F9FBFA" rx="3.5" />
      <rect width="170" height="118" x=".5" y=".5" stroke="#E8EDEB" rx="5.5" />
    </svg>
  );
}

function DarkThemePreview() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="none"
      viewBox="0 0 171 119"
    >
      <rect width="171" height="119" fill="#3D4F58" rx="6" />
      <rect width="42" height="119" fill="#1C2D38" rx="6" />
      <rect width="117" height="7" x="48" y="34" fill="#1C2D38" rx="3.5" />
      <rect width="28" height="7" x="48" y="21" fill="#1C2D38" rx="3.5" />
      <rect width="28" height="7" x="82" y="21" fill="#1C2D38" rx="3.5" />
      <rect width="28" height="7" x="116" y="21" fill="#1C2D38" rx="3.5" />
      <rect width="117" height="7" x="48" y="47" fill="#1C2D38" rx="3.5" />
      <rect width="117" height="7" x="48" y="60" fill="#1C2D38" rx="3.5" />
      <rect width="117" height="7" x="48" y="73" fill="#1C2D38" rx="3.5" />
    </svg>
  );
}

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
              <Label htmlFor="use-os-theme">Sync with OS (Preview)</Label>
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
          <LightThemePreview />
          Light Theme
        </RadioBox>
        <RadioBox
          id="theme-selector-dark"
          data-testid="theme-selector-dark"
          value="DARK"
          disabled={!!preferenceStates.theme || themeValue === 'OS_THEME'}
        >
          <DarkThemePreview />
          Dark Theme (Preview)
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
