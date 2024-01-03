'use strict';

const baseConfig = require('./index');

function restrictedProviderImport(provider) {
  return {
    name: provider,
    message: `Use '${provider}/provider' instead`,
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
      restrictedProviderImport('data-service'),
      restrictedProviderImport('@mongodb-js/compass-logging'),
      restrictedProviderImport('@mongodb-js/compass-app-stores'),
      // restrictedProviderImport('@mongodb-js/atlas-service'),
      // restrictedProviderImport('compass-preferences-model'),
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
