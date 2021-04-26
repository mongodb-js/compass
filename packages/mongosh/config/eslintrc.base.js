const typescriptEslintEslintPlugin = require('@typescript-eslint/eslint-plugin');

// ovrerrides do not work with extends
const ruleOverridesForJs = Object.keys(typescriptEslintEslintPlugin.rules).reduce(
  (overrides, rule) => ({ ...overrides, [`@typescript-eslint/${rule}`]: 0 }), {}
);

module.exports = {
  plugins: ['mocha'],
  extends: [
    'eslint-config-mongodb-js/react',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    'object-curly-spacing': [2, 'always'],
    'no-empty-function': 0,
    'valid-jsdoc': 0,
    'react/sort-comp': 0, // does not seem work as expected with typescript
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-var-requires': 0, // seems necessary to import less files
    '@typescript-eslint/no-unused-vars': 2,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/ban-types': 0,
    'mocha/no-skipped-tests': 1,
    'mocha/no-exclusive-tests': 2,
    'semi': 0,
    '@typescript-eslint/semi': [2, 'always'],
    'no-console': [1, { allow: ['warn', 'error', 'info'] }],
    'no-shadow': 0,
    'no-use-before-define': 0,
    'no-cond-assign': [2, 'except-parens']
  },
  overrides: [{
    files: ['**/*.js'],
    rules: {
      ...ruleOverridesForJs,
      semi: [2, 'always']
    }
  }]
};
