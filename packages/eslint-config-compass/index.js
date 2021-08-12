const jsConfigurations = ["eslint:recommended"];

const tsConfigurations = [
  ...jsConfigurations,
  "plugin:@typescript-eslint/recommended",
  "plugin:@typescript-eslint/recommended-requiring-type-checking",
];

const reactConfigurations = [
  "plugin:react/recommended",
  "plugin:jsx-a11y/recommended",
];

const testConfigurations = ["plugin:mocha/recommended"];

module.exports = {
  plugins: ["@typescript-eslint", "jsx-a11y", "mocha", "react"],
  env: { node: true },
  overrides: [
    {
      parserOptions: {
        ecmaVersion: 2018,
      },
      files: ["**/*.js"],
      env: { node: true, es6: true },
      extends: [...jsConfigurations, "prettier"],
    },
    {
      parser: "@typescript-eslint/parser",
      files: ["**/*.ts"],
      extends: [...tsConfigurations, "prettier"],
    },
    {
      parserOptions: {
        ecmaVersion: 2018,
      },
      files: ["**/*.jsx"],
      env: { node: true, browser: true, es6: true },
      extends: [...jsConfigurations, ...reactConfigurations, "prettier"],
    },
    {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      files: ["**/*.tsx"],
      env: { node: true, browser: true },
      extends: [...tsConfigurations, ...reactConfigurations, "prettier"],
    },
    {
      files: ["**/*.spec.js", "**/*.spec.jsx", "**/*.spec.ts", "**/*.spec.tsx"],
      env: { mocha: true },
      extends: [...testConfigurations],
    },
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
};
