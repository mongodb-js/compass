import type { THEMES } from 'compass-preferences-model';
import { nativeTheme } from 'electron';
import preferences from 'compass-preferences-model';

const compassThemeToElectronTheme: Record<
  THEMES,
  typeof nativeTheme.themeSource
> = {
  DARK: 'dark',
  LIGHT: 'light',
  OS_THEME: 'system',
} as const;

export function setupTheme() {
  const listener = () => {
    const value = preferences.getPreferences().theme;
    const electronThemeSource = compassThemeToElectronTheme[value];
    nativeTheme.themeSource = electronThemeSource;
  };
  preferences.onPreferenceValueChanged('theme', listener);
  listener(); // call once for initial setup
}
