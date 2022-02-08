const { THEMES } = require('compass-preferences-model');
const { Theme } = require('@mongodb-js/compass-components');
const ipc = require('hadron-ipc');
const darkreader = require('darkreader');
const { remote } = require('electron');

const darkreaderOptions = { brightness: 100, contrast: 90, sepia: 10 };

function enableDarkTheme() {
  // Compass-home initializes the theme and listens to these events
  // to update the theme in the react context.
  global.hadronApp.theme = Theme.Dark;
  global.hadronApp.appRegistry?.emit('darkmode-enable');

  darkreader.enable(darkreaderOptions);
}

function disableDarkTheme() {
  global.hadronApp.theme = Theme.Light;
  global.hadronApp.appRegistry?.emit('darkmode-disable');

  darkreader.disable();
}

function loadTheme(theme) {
  // Update main Compass when we've loaded the theme for setting app menus.
  ipc.call('window:theme-loaded', theme);

  if (theme === THEMES.OS_THEME
    && remote.nativeTheme.shouldUseDarkColors
  ) {
    enableDarkTheme();
    return;
  }

  // Update our view based on the provided theme.
  if (theme === THEMES.DARK) {
    enableDarkTheme();
    return;
  }

  disableDarkTheme();
}

module.exports = {
  enableDarkTheme,
  disableDarkTheme,
  loadTheme
};
