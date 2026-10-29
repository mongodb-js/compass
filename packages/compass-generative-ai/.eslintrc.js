'use strict';
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass/plugin'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      // Files in this directory run outside the renderer: in the AI assistant
      // utility process on desktop, and in the page for compass-web. Renderer
      // entries (the provider subpaths, the design system) would drag the UI
      // stack into the utility bundle, so utility-side code takes its
      // cross-world dependencies via config instead.
      files: ['src/tools/infrastructure/**'],
      excludedFiles: ['**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '@mongodb-js/compass-logging/provider',
                  '@mongodb-js/compass-telemetry/provider',
                  '@mongodb-js/compass-components',
                  '@mongodb-js/compass-app-registry',
                ],
                message:
                  'Utility-side code must not import renderer entries; take what it needs via config.',
              },
            ],
          },
        ],
      },
    },
  ],
};
