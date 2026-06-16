const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [
    'src/**/*.spec.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    'src/main/index.ts',
    'src/main/application.ts',
    'src/app/index.ts',
    '.mocharc.js',
    '.mocharc.renderer.js',
  ],
  project: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,js}'],
  ignoreUnresolved: [/mongo_crypt_v1/],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    '@types/minimatch',
    'ts-node',
    '@mongosh/node-runtime-worker-thread',
    'system-ca',
    '@electron/rebuild',
    'interruptor',
  ],
  ignoreBinaries: [
    ...base.ignoreBinaries,
    'depcheck',
    'hadron-build',
    'webpack-compass',
    'eslint-compass',
    'prettier',
    'electron',
    'tsc',
    'mongodb-sbom-tools',
  ],
};
