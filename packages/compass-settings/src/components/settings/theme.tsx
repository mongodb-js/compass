import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  FormFieldContainer,
  Checkbox,
  Label,
  Description,
  css,
  spacing,
  RadioBoxGroup,
  RadioBox,
  palette,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../stores';
import { changeFieldValue } from '../../stores/settings';
import type {
  PreferenceStateInformation,
  THEMES,
} from 'compass-preferences-model';
import { settingStateLabels } from './state-labels';

type ThemeSettingsProps = {
  onChange: (field: 'theme', value: THEMES) => void;
  preferenceStates: PreferenceStateInformation;
  themeValue: THEMES;
};

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const radioBoxStyles = css({
  div: {
    textAlign: 'left',
    padding: spacing[3],
    justifyContent: 'flex-start',
  },
});

const themePreviewStyles = css({
  marginRight: spacing[2],
  maxWidth: '50%',
});

const ThemeIcon: React.FunctionComponent<{ theme: 'DARK' | 'LIGHT' }> = ({
  theme,
}) => {
  const lightTheme = {
    fg: palette.gray.base,
    bg: palette.white,
  };

  const darkTheme = {
    fg: palette.black,
    bg: palette.gray.dark1,
  };

  const { fg, bg } = theme === 'DARK' ? darkTheme : lightTheme;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="none"
      viewBox="0 0 171 119"
      className={themePreviewStyles}
    >
      <defs>
        <clipPath id="sidebar-clip">
          <path d="M6 0 L42 0 Q48 0, 48 6 L48 113 Q48 119, 42 119 L6 119 Q0 119, 0 113 L0 6 Q0 0, 6 0 Z" />
        </clipPath>
      </defs>
      <rect width="171" height="119" fill={bg} rx="6" />
      <rect width="42" height="119" fill={fg} clipPath="url(#sidebar-clip)" />
      <rect width="117" height="7" x="48" y="34" fill={fg} rx="3.5" />
      <rect width="28" height="7" x="48" y="21" fill={fg} rx="3.5" />
      <rect width="28" height="7" x="82" y="21" fill={fg} rx="3.5" />
      <rect width="28" height="7" x="116" y="21" fill={fg} rx="3.5" />
      <rect width="117" height="7" x="48" y="47" fill={fg} rx="3.5" />
      <rect width="117" height="7" x="48" y="60" fill={fg} rx="3.5" />
      <rect width="117" height="7" x="48" y="73" fill={fg} rx="3.5" />
      <rect width="170" height="118" x=".5" y=".5" stroke={fg} rx="5.5" />
    </svg>
  );
};

export const ThemeSettings: React.FunctionComponent<ThemeSettingsProps> = ({
  themeValue,
  preferenceStates,
  onChange,
}) => {
  const handleOSCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange('theme', event.target.checked ? 'OS_THEME' : 'LIGHT');
    },
    [onChange]
  );
  const handleSelectorChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange('theme', event.target.value as THEMES);
    },
    [onChange]
  );

  return (
    <div data-testid="theme-settings">
      <div>Change the appearance of Compass.</div>

      <FormFieldContainer>
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
      </FormFieldContainer>
      <FormFieldContainer>
        <RadioBoxGroup
          id="theme-selector"
          onChange={handleSelectorChange}
          value={themeValue}
          size="full"
        >
          <RadioBox
            id="theme-selector-light"
            data-testid="theme-selector-light"
            className={radioBoxStyles}
            value="LIGHT"
            disabled={!!preferenceStates.theme || themeValue === 'OS_THEME'}
          >
            <ThemeIcon theme="LIGHT" />
            Light Theme
          </RadioBox>
          <RadioBox
            id="theme-selector-dark"
            data-testid="theme-selector-dark"
            className={radioBoxStyles}
            value="DARK"
            disabled={!!preferenceStates.theme || themeValue === 'OS_THEME'}
          >
            <ThemeIcon theme="DARK" />
            Dark Theme
          </RadioBox>
        </RadioBoxGroup>
      </FormFieldContainer>
    </div>
  );
};

const mapState = ({ settings: { settings, preferenceStates } }: RootState) => ({
  themeValue: settings.theme ?? 'OS_THEME',
  preferenceStates,
});

const mapDispatch = {
  onChange: changeFieldValue,
};

export default connect(mapState, mapDispatch)(ThemeSettings);
