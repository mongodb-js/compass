import React from 'react';
import { THEMES } from 'compass-preferences-model';
import { connect } from 'react-redux';

import {
  Body,
  Checkbox,
  Label,
  Description,
  css,
  spacing,
  RadioGroup,
  Radio,
} from '@mongodb-js/compass-components';
import { changeFieldValue } from '../../stores/settings';
import type { RootState } from '../../stores';

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const themeSelectorStyles = css({
  display: 'flex',
});

const radioContainer = css({
  margin: spacing[2],
  display: 'flex',
  flexDirection: 'column',
});

type ThemeSettingsProps = {
  changeTheme: (value: string) => void;
  theme?: string;
};

const ThemeSettings: React.FunctionComponent<ThemeSettingsProps> = ({
  theme,
  changeTheme,
}) => {
  const handleCheckboxChange = ({
    target: { checked },
  }: React.ChangeEvent<HTMLInputElement>) => {
    changeTheme(checked ? THEMES.OS_THEME : THEMES.LIGHT);
  };
  return (
    <div>
      <Body>Change the apperance of Compass.</Body>
      <Checkbox
        className={checkboxStyles}
        name="os-theme"
        id="os-theme"
        data-hook="auto-updates-checkbox"
        data-test-id="auto-updates-checkbox"
        onChange={handleCheckboxChange}
        label={
          <>
            <Label htmlFor="os-theme">Sync with OS</Label>
            <Description>
              Automatically switch between light and dark themes based on your
              OS settings
            </Description>
          </>
        }
        checked={theme === THEMES.OS_THEME}
      />
      <RadioGroup
        className={themeSelectorStyles}
        onChange={(event) => changeTheme(event.target.value)}
        value={theme}
        name="theme"
      >
        <Radio value={THEMES.LIGHT} disabled={theme === THEMES.OS_THEME}>
          <div className={radioContainer}>
            <svg
              width="171"
              height="119"
              viewBox="0 0 171 119"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.5"
                y="0.5"
                width="170"
                height="118"
                rx="5.5"
                stroke="#E8EDEB"
              />
            </svg>
            Light
          </div>
        </Radio>
        <Radio value={THEMES.DARK} disabled={theme === THEMES.OS_THEME}>
          <div className={radioContainer}>
            <svg
              width="171"
              height="119"
              viewBox="0 0 171 119"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="171" height="119" rx="6" fill="#3D4F58" />
            </svg>
            Dark
          </div>
        </Radio>
      </RadioGroup>
    </div>
  );
};

const mapState = ({ settings: { theme } }: RootState) => ({
  theme,
});

const mapDispatch = {
  changeTheme: (value: string) => changeFieldValue('theme', value),
};

export default connect(mapState, mapDispatch)(ThemeSettings);
