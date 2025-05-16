# Contributing

## Getting Started

You'll need node `^22` and npm `^10` installed on your machine to work with the repository locally.
After your environment is ready, navigate to the repository and run `npm run bootstrap`, this will install dependencies and will compile all packages.

After bootstrap is finished, you should be able to run `npm run start` and see Compass application running locally. Alternatively you can start a web version of the app by running `npm run start-web`.

Compass uses a monorepo is powered by [`npm workspaces`](https://docs.npmjs.com/cli/v7/using-npm/workspaces) and [`lerna`](https://github.com/lerna/lerna#readme), although not necessary, it might be helpful to have a high level understanding of those tools.

## Submitting a Change

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

This repository includes a few recommended plugins for your convenience:

- Prettier extension helps to format your code following this repository code style.
  > ⚠️&nbsp;&nbsp;If you install the [Prettier VSCode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) please make sure to set the `prettier.requireConfig` option for the workspace! This will ensure only packages that have `prettier` enabled will get formatted.
- ESLint extension highlights possible issues in your code following our common eslint configuration.
- ANTLR4 grammar support extension helps to work with the `bson-transpilers` package that is implemented with the help of antlr (.g and .g4 files).

## Enabling Chrome DevTools

To enable the Chrome DevTools for the Electron renderer processes, click "Settings" under "MongoDB Compass Dev Local" in the top menu (or press <kbd>⌘</kbd> + <kbd>,</kbd>) and click "Enable DevTools" followed by "Save", which will enable a "Toggle DevTools" item in the "View" top menu. Click this to toggle the DevTools panel (or press <kbd>⌥</kbd> + <kbd>⌘</kbd> + <kbd>I</kbd>).

## Working on Plugins

> [!NOTE]
> For documentation regarding how to write plugin packages, check out the
> [hadron-app-registry](./packages/hadron-app-registry/README.md) documentation.

To run npm scripts inside specific workspaces in the monorepo you can use either `lerna --scope` or `npm --workspace` command line arguments. As an example, to run all tests in one plugin that you are working on such as the `compass-aggregations` plugin, you can run `npm run test --workspace packages/compass-aggregation` or `lerna run test --scope @mongodb-js/compass-aggregations` commands

When running the application locally and changing any code in the monorepo, webpack will take care of automatically rebuilding the modules. In some cases, like changing styles or React component code, webpack might be able to hot-reload the code, but in most cases a page refresh is required to see the changes.

In addition to running lerna commands directly, there are a few convenient npm scripts for working with packages:

- `npm run compile-changed` will compile all plugins and their dependants changed since `origin/HEAD`
- `npm run test-changed` will run tests in all packages and their dependants changed since `origin/HEAD`.
- `npm run check-changed` will run `eslint` and `depcheck` validation in all packages (ignoring dependants) changed since `origin/HEAD`

## Building Compass Locally

To build compass you can run `package-compass` script:

```sh
HADRON_DISTRIBUTION='compass' npm run package-compass
```

It is required to provide `HADRON_DISTRIBUTION` env variable explicitly. You can change the type of distribution you are building by setting a different `HADRON_DISTRIBUTION` value:

```sh
HADRON_DISTRIBUTION='compass-readonly' npm run package-compass
```

Available options are:

- `compass` (default): Your usual Compass build with all functionality available
- `compass-readonly`: Build that doesn't allow any modifications for server data
- `compass-isolated`: Doesn't establish any connections except for the database

Build process can take a while and a bit quiet by default. You can use `DEBUG` env variable to make it more verbose:

```sh
DEBUG=hadron* npm run package-compass
```

To speed up the process you might want to disable creating installer for the application. To do that you can set `HADRON_SKIP_INSTALLER` environmental variable to `true` when running the script

```sh
HADRON_SKIP_INSTALLER=true npm run package-compass
```

## Publishing Packages

Compass is built out of a number of different NPM packages. Since all the relevant code is bundled in the packaged version of Compass with webpack, it is not necessary to publish any package to build and run the Compass application.

Some of the packages, however, are used externally by other MongoDB products and by the javascript community. These packages are published through CI workflows.

In particular each change to the `main` branch is analyzed to calculate a new version based on changes since the last time it was published. A pr with the new versions of each changed package is opened and updated on each new change.

Merging that PR will trigger another CI job that will publish to NPM any package which version is not yet present on the registry.

The version of packages is calculated following conventional bumps: See https://github.com/mongodb-js/devtools-shared/tree/main/packages/monorepo-tools for details.

## Add / Update / Remove Dependencies in Packages

To add, remove, or update a dependency in any workspace you can use the usual `npm install` with a `--workspace` argument added, e.g. to add `react-aria` dependency to compass-aggregations and compass-query-bar plugins you can run `npm install --save react-aria --workspace @mongodb-js/compass-aggregations --workspace @mongodb-js/compass-query-bar`.

Additionally if you want to update a version of an existing dependency, but don't want to figure out the scope manually, you can use `npm run where` helper script. To update `webpack` in every package that has it as a dev dependency you can run `npm run where "devDependencies['webpack']" -- install --save-dev webpack@latest`

## Creating a New Workspace / Package

To create a new package please use the `create-workspace` npm script:

```sh
npm run create-workspace [workspace name]
```

This will do all the initial workspace bootstrapping for you, ensuring that your package has all the standard configs set up and ready, and all the npm scripts aligned with other packages in the monorepo, which is important to get the most out of all the provided helpers in this repository (like `npm run check-changed` commands or to make sure that your tests will not immediately fail in CI because of the test timeout being too small)

## Using Github Actions

Github actions offers an easy way to create workflows that run various automated checks. While our main CI system is Evergreen, we have a number of auxiliary workflows configured to run using github actions. While adding new workflows or updating existing ones, it's important that we follow [the security hardening guidelines](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) by Github. Those can change over time, so be sure to periodically review them to make sure we're not using insecure workflows. Some notable highlights to pay special attention to are:

1. Avoid using tag or branch refs for untrusted 3rd party actions. Those can easily be recreated by malicious actors and introduce supply chain attacks. As a rule of thumb, first party actions are considered actions by MongoDB, Github, Microsoft, or the primary maintainer of a particular ecosystem - e.g. Amazon for AWS. When using a 3rd party action, always use the full git commit sha as the ref to checkout.
2. Be extra vigilant when using user-supplied data, such as branch name or PR title in scripts as that opens up the possibility of script injection attacks. Instead, prefer to use js actions to achieve the same result or sanitize the input before using it in a script.
3. Never commit secrets in the workflow file directly - instead use github secrets to store them securely at the repo/org level.
4. Avoid using repo-level secrets that grant access to deployment/publishing resources. Instead prefer to store these as environment secrets and ensure the correct environments protections are in place.

## Caveats

### `hdiutil: couldn't unmount "diskn" - Resource busy` or Similar `hdiutil` Errors

<!-- TODO: might go away after https://jira.mongodb.org/browse/COMPASS-4947 -->

Sometimes when trying to package compass on macOS you can run into the said error. There doesn't seems to be any common solution to it and the reasons are probably related to the outdated versions of some electron packages we are currently using (but will eventually update). If you are running into that issue, you can disable creating an installer during the packaging process by setting `HADRON_SKIP_INSTALLER` env variable to `true`:

```sh
HADRON_SKIP_INSTALLER=true npm run test-package-compass
```

### `Module did not self-register` or `Module '<path>' was compiled against a different Node.js version` Errors

<!-- TODO: should go away after https://jira.mongodb.org/browse/COMPASS-4896 -->

When running Compass application or tests suites locally, you might run into errors like the following:

```
Error: Module did not self-register: '/path/to/native/module.node'.
```

```
Error: The module '/path/to/native/module.node' was compiled against a different Node.js version using NODE_MODULE_VERSION $XYZ. This version of Node.js requires NODE_MODULE_VERSION $ABC.
```

The root cause is native modules compiled for a different version of the runtime (either Node.js or Electron) that tries to import the module. In our case this is usually caused by combination of two things:

1. Modules have to be recompiled for the runtime they will be used in
1. Due to npm workspaces hoisting all shared dependencies to the very root of the monorepo, all packages use the same modules imported from the same location

This means that if you e.g., start Compass application locally it will recompile all native modules to work in Electron runtime, if you would try to run tests for `@mongodb-js/connection-storage` library right after that, tests would fail due to `keytar` library not being compatible with Node.js environment that the tests are running in.

If you run into this issue, make sure that native modules are rebuilt for whatever runtime you are planning to use at the moment. To help with that we provide two npm scripts: `npm run electron-rebuild` will recompile native modules to work with Electron and `npm run node-rebuild` will recompile them to work with Node.js.

### The React Developer Tools extension is not working?

To inspect the React component hierarchies in the Chrome DevTools panel, use the [React Developer Tools](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi), which is already installed when running a local development build. For a reason, yet to be determined, you must reload (<kbd>⌘</kbd> + <kbd>R</kbd>) the DevTools window to see the "⚛️ Components" and "⚛️ Profiler" tabs.
