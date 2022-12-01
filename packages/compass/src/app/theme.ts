import preferences from 'compass-preferences-model';
import * as darkreader from 'darkreader';
import * as remote from '@electron/remote';

const darkreaderOptions = { brightness: 100, contrast: 90, sepia: 10 };

function onNativeThemeUpdated() {
  if (!preferences.getPreferences().lgDarkmode) {
    if (remote.nativeTheme.shouldUseDarkColors) {
      darkreader.enable(darkreaderOptions);
    } else {
      darkreader.disable();
    }
  }
}

export function setupTheme() {
  remote.nativeTheme.on('updated', onNativeThemeUpdated);
  onNativeThemeUpdated();
}
