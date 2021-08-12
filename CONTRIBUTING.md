# Contributing

## Workflow

MongoDB welcomes community contributions! If you’re interested in making a contribution to MongoDB Compass, please follow the steps below before you start writing any code:

1. Sign the [contributor's agreement](http://www.mongodb.com/contributor). This will allow us to review and accept contributions.
1. Fork the repository on GitHub
1. Create a branch with a name that briefly describes your feature
1. Implement your feature or bug fix
1. Add new cases to the relevant `./<package>/tests` folder that verify your bug fix or make sure no one unintentionally breaks your feature in the future and run them with `npm test`
1. Add comments around your new code that explain what's happening
1. Commit and push your changes to your branch then submit a pull request

## Bugs

You can report new bugs by [creating a new issue](https://jira.mongodb.org/browse/COMPASS/). Please include as much information as possible about your environment.

## VSCode Setup
Make sure to have the following steps completed to get the best development experience:
1. Install the [prettier VSCode plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and make sure to set the `prettier.requireConfig` option for the workspace! This will ensure only packages that have `prettier` enabled will get formatted.

## Creating a new package

To create a new package, follow the outlined steps:

1. Set up a basic NPM package in the `packages/` directory.
2. To configure TypeScript:
   1. Add the `@mongodb-js/tsconfig-compass` package as a `devDependency`.
   2. Add the required `typescript` dependency.
   3. Add a `tsconfig.json`, make it extend from `@mongodb-js/tsconfig-compass/tsconfig.react.json` if you plan on using React or extend from `@mongodb-js/tsconfig-compass/tsconfig.common.json` otherwise, and modify additional settings as follows:
      ```
      {
        "extends": "@mongodb-js/tsconfig-compass/tsconfig.<common|react>.json",
        "compilerOptions": {
            "outDir": "lib",
        },
        "include": [
            "src/**/*"
        ],
        "exclude": [
            "src/**/*.spec.*"
        ]
      }
      ```
      _Note that you **must** set the `outDir` explicitly as it is always relative to the config file it is declared in!_
   4. For linting purposes, add another `tsconfig-lint.json` to include all source files:
      ```
      {
        "extends": "./tsconfig.json",
        "include": ["**/*"],
        "exclude": ["node_modules", "lib"]
      }
      ```
3. To configure `eslint`:
   1. Add the `@mongodb-js/eslint-config-compass` package as a `devDependency`.
   2. Set up an `.eslintrc.js` with the following content:
      ```
      module.exports = {
        root: true,
        extends: [
            '@mongodb-js/eslint-config-compass'
        ],
        parserOptions: {
            tsconfigRootDir: __dirname,
            project: ['./tsconfig-lint.json']
        }
      }
      ```
  3. Add an `.eslintignore` with the following content:
     ```
     lib/
     ```
4. To configure `prettier`:
   1. Add the `prettier` package as a `devDependency`.
   2. Set up a `.prettierignore` file with the following content:
      ```
      lib
      .nyc_output
      ```
   3. Add an `.prettierrc.json` file with just `{}` as contents to make sure `prettier` will be triggered in VSCode.
5. For setting up typical packages tasks and depcheck refer to existing packages like [`compass-components`](./packages/compass-components). Make sure to add `@mongodb-js/tsconfig-compass` to the ignored packages in `.depcheckrc`.
