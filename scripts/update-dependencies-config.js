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
  typescript: [
    '@microsoft/api-extractor',
    'typescript@6', // TODO: update to 7+ (latest) when its more stable and feature complete
    'ts-node',
  ],
  leafygreen: [
    '@emotion/*',
    '@leafygreen-ui/*',
    '@lg-chat/*',
    '@mongodb-js/diagramming',
    '@lg-tools/*',
  ],
  mongosh: [
    // mongosh and driver dependencies
    '@mongosh/*',
    '@mongodb-js/devtools-connect',
    '@mongodb-js/devtools-proxy-support',
    'mongodb',
    'bson',
    'kerberos',
    'socks',
    'mongodb-client-encryption',
  ],
  'devtools-shared-prod': [
    '@mongodb-js/get-os-info',
    '@mongodb-js/mongodb-constants',
    '@mongodb-js/device-id',
    '@mongodb-js/shell-bson-parser',
    'mongodb-cloud-info',
    'mongodb-query-parser',
  ],
  'devtools-shared-dev': [
    '@mongodb-js/dl-center',
    '@mongodb-js/mongodb-downloader',
    '@mongodb-js/monorepo-tools',
    '@mongodb-js/sbom-tools',
    '@mongodb-js/signing-utils',
    'mongodb-runner',
  ],
  'webpack-config': [
    '@babel/core',
    '@babel/plugin-proposal-decorators',
    '@babel/plugin-transform-runtime',
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
    '@babel/runtime',
    'core-js',
  ],
};
