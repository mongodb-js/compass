'use strict';

const baseConfig = require('./index');

function restrictedProviderImport(servicePkg) {
  return {
    name: servicePkg,
    message: `Use '${servicePkg}/provider' instead.`,
    allowTypeImports: true,
  };
}

// node built-ins with meaningful polyfills in web environment
const allowedNodeJSBuiltinModules = ['stream', 'events', 'crypto'];

module.exports = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    'no-restricted-imports': 'off',
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        paths: [
          restrictedProviderImport('@mongodb-js/compass-logging'),
          restrictedProviderImport('@mongodb-js/compass-telemetry'),
          restrictedProviderImport('@mongodb-js/compass-app-stores'),
          restrictedProviderImport('@mongodb-js/my-queries-storage'),
          restrictedProviderImport('@mongodb-js/atlas-service'),
          restrictedProviderImport('compass-preferences-model'),
          ...require('module')
            .builtinModules.filter((module) => {
              return (
                !module.startsWith('_') &&
                !allowedNodeJSBuiltinModules.includes(module)
              );
            })
            .flatMap((name) => {
              const config = {
                message:
                  'Using Node.js built-in modules in plugins is not allowed.',
                allowTypeImports: true,
              };

              return [
                { name, ...config },
                { name: `node:${name}`, ...config },
              ];
            }),
          ...['electron', '@electron/remote'].map((name) => {
            return {
              name,
              message: 'Using electron modules in plugins is not allowed.',
              allowTypeImports: false,
            };
          }),
        ],
      },
    ],
  },
};
