'use strict';

const baseConfig = require('./index');

function restrictedProviderImport(servicePkg) {
  try {
    require.resolve(servicePkg);
  } catch {
    throw new Error(
      `Invalid configuration for the 'no-restricted-imports' rule: package for the service ${servicePkg} doesn't exist`
    );
  }
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
      restrictedProviderImport('mongodb-data-service'),
      restrictedProviderImport('@mongodb-js/compass-logging'),
      restrictedProviderImport('@mongodb-js/compass-app-stores'),
      // TODO(COMPASS-7411): enable when possible
      // restrictedProviderImport('@mongodb-js/my-queries-storage'),
      // TODO(COMPASS-7412): enable when possible
      // restrictedProviderImport('@mongodb-js/atlas-service'),
      // TODO(COMPASS-7559): enable when possible
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
