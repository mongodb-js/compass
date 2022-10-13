import type { THEMES } from 'compass-preferences-model';
import preferences from 'compass-preferences-model';
import * as darkreader from 'darkreader';
import * as remote from '@electron/remote';

const darkreaderOptions = { brightness: 100, contrast: 90, sepia: 10 };

const compassThemeToElectronTheme: Record<THEMES, typeof remote.nativeTheme.themeSource> = {
  DARK: 'dark',
  LIGHT: 'light',
  OS_THEME: 'system'
} as const;

function onNativeThemeUpdated () {
  if (!preferences.getPreferences().lgDarkmode) {
    if (remote.nativeTheme.shouldUseDarkColors) {
      darkreader.enable(darkreaderOptions);
    } else {
      darkreader.disable();
    }
  }
}

export function setupTheme() {
  preferences.onPreferenceValueChanged('theme', value => {
    const electronThemeSource = compassThemeToElectronTheme[value];
    remote.nativeTheme.themeSource = electronThemeSource;
  });

  remote.nativeTheme.on('updated', onNativeThemeUpdated);
  onNativeThemeUpdated();
}
