'use strict';
module.exports = {
  electron: [
    '@electron/remote',
    '@electron/rebuild',
    'browserslist',
    // NB: We're always trying to update to latest major, this usually implies
    // breaking changes, but those rarely affect us. If it becomes a problem, we
    // can always change this code to lock it to whatever major version of
    // electron compass is currently at
    'electron',
    'electron-to-chromium',
    'node-abi',
  ],
  eslint: [
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'eslint@8', // TODO: update to flat config, switch to eslint 9, remove the fixed version
    'eslint-plugin-chai-friendly',
    'eslint-plugin-jsx-a11y',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
  ],
  // TODO(COMPASS-9443): Update update-* github actions to handle all groups as
  // a matrix inside one action instead of having separate action for every
  // group and add more groups following the ones in _dependabot
  // mongosh: [],
  // 'devtools-shared-prod': [],
};
