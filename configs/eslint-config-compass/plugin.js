'use strict';

const baseConfig = require('./index');

function restrictedProviderImport(servicePkg) {
  return {
    name: servicePkg,
    message: `Use '${servicePkg}/provider' instead.`,
    allowTypeImports: true,
  };
}

module.exports = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    'no-restricted-imports': 'off',
    '@typescript-eslint/no-restricted-imports': [
      'error',
      restrictedProviderImport('@mongodb-js/compass-logging'),
      restrictedProviderImport('@mongodb-js/compass-telemetry'),
      restrictedProviderImport('@mongodb-js/compass-app-stores'),
      restrictedProviderImport('@mongodb-js/my-queries-storage'),
      restrictedProviderImport('@mongodb-js/atlas-service'),
      restrictedProviderImport('compass-preferences-model'),
      {
        paths: require('module').builtinModules,
        message: 'Using Node.js built-in modules in plugins is not allowed.',
        allowTypeImports: false,
      },
      {
        paths: ['electron', '@electron/remote'],
        message: 'Using electron modules in plugins is not allowed.',
        allowTypeImports: false,
      },
    ],
  },
};
