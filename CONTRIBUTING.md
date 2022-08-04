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

This repository includes a few recommended plugins for your convenience:

- Prettier extension helps to format your code following this repository code style.
  > ⚠️&nbsp;&nbsp;If you install the [Prettier VSCode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) please make sure to set the `prettier.requireConfig` option for the workspace! This will ensure only packages that have `prettier` enabled will get formatted.
- ESLint extension highlights possible issues in your code following our common eslint configuration.
- ANTLR4 grammar support extension helps to work with the `bson-transpilers` package that is implemented with the help of antlr (.g and .g4 files).

## Working With the Monorepo

You'll need node `^16` and npm `^8` installed on your machine to work with the repository locally. After your environment is ready, navigate to the repository and run `npm run bootstrap`, this will install dependencies and will compile all packages.

After bootstrap is finished, you should be able to run `npm run start` and see Compass application running locally.

This monorepo is powered by [`npm workspaces`](https://docs.npmjs.com/cli/v7/using-npm/workspaces) and [`lerna`](https://github.com/lerna/lerna#readme), although not necessary, it might be helpful to have a high level understanding of those tools.

### Working on Plugins

Most of the plugins have their own development environment so you can work on them in isolation. If you want to work on a plugin without running the whole Compass application, you can run `npm run start` in the plugin directory (such as at the top of the `compass/packages/compass-aggregations` directory), either with the help of `lerna` or `npm workspaces`. For example, to start `compass-aggregations` plugin locally, you can either run `npm run start --workspace @mongodb-js/compass-aggregations` from the top of `compass` directory, run `npx lerna run start --scope @mongodb-js/compass-aggregations --stream` from anywhere in the `compass` directory, or run `npm run start` from the top of the `compass/packages/compass-aggregations` directory. Same approaches will work for any other workspace-specific script. If you want to run commands like `test` or `check` only for one specific workspace in the repository, you can use any of the methods described above. As an example, to run all tests in one plugin that you are working on such as the `compass-aggregations` plugin, you can run `npm run test` from the top of the `compass/packages/compass-aggregations` directory.

If you want to see your changes applied in Compass, you might need to rebuild plugins that you changed with the `compile` command. Instead of manually writing out the `scope` you might want to use `lerna --since` filter to rebuild everything since your local or origin `HEAD` of the git history: `npx lerna run compile --stream --since origin/HEAD`. Restarting or hard-reloading (Shift+CMD+R) Compass after compilation is finished should apply your changes.

In addition to running lerna commands directly, there are a few convenient npm scripts for working with packages:

- `npm run compile-changed` will compile all plugins and their dependants changed since `origin/HEAD`
- `npm run test-changed` will run tests in all packages and their dependants changed since `origin/HEAD`.
- `npm run check-changed` will run `eslint` and `depcheck` validation in all packages (ignoring dependants) changed since `origin/HEAD`

### Building Compass Locally

To build compass you can run `package-compass` script:

```sh
npm run package-compass
```

You can change the type of distribution you are building with `HADRON_DISTRIBUTION` environmental variable:

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
HADRON_SKIP_INSTALLER=true npm run test-package-compass
```

### Publishing Packages

For package changes to be applied in Compass beta or GA releases they need to be published first. The whole publish process happens from the main branch with the following command in order:

1. `npm run packages-version [semver bump]`: updates package versions for everything that was changed since the last release, updates package-lock file at the root of the repository, commits and tags the changes. See lerna docs to learn more about optional [`semver bump`](https://github.com/lerna/lerna/tree/main/commands/version#semver-bump) argument.
1. `npm run packages-publish`: publishes packages to the registry, if your npm account uses OTP publishing protection get ready to enter the code a few times, as an alternative you might want to use [npm automation authorization tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens) locally if OTP gets in the way too much (in that case add a [`--no-verify-access`](https://github.com/lerna/lerna/tree/main/commands/publish#--no-verify-access) flag to the publish command). Publish command can be re-run safely multiple times, so if something bad happens mid-release (e.g., your internet goes out), you should be able to safely fiinish the process. After publish finishes successfully the script will push version update commit and tags created in step 1. We do it automatically only post-release so that when evergreen picks up a commit in the main branch, all the tasks can run with the packages already published.

### Add / Update / Remove Dependencies in Packages

To add, remove, or update a dependency in any workspace you can use the usual `npm install` with a `--workspace` argument added, e.g. to add `react-aria` dependency to compass-aggregations and compass-query-bar plugins you can run `npm install --save react-aria --workspace @mongodb-js/compass-aggregations --workspace @mongodb-js/compass-query-bar`.

Additionally if you want to update a version of an existing dependency, but don't want to figure out the scope manually, you can use `npm run where` helper script. To update `webpack` in every package that has it as a dev dependency you can run `npm run where "devDependencies['webpack']" -- install --save-dev webpack@latest`

### Creating a New Workspace / Package

To create a new package please use the `create-workspace` npm script:

```sh
npm run create-workspace [workspace name]
```

This will do all the initial workspace bootstrapping for you, ensuring that your package has all the standard configs set up and ready, and all the npm scripts aligned with other packages in the monorepo, which is important to get the most out of all the provided helpers in this repository (like `npm run check-changed` commands or to make sure that your tests will not immediately fail in CI because of the test timeout being too small)

### Caveats

#### `hdiutil: couldn't unmount "diskn" - Resource busy` or Similar `hdiutil` Errors

<!-- TODO: might go away after https://jira.mongodb.org/browse/COMPASS-4947 -->

Sometimes when trying to package compass on macOS you can run into the said error. There doesn't seems to be any common solution to it and the reasons are probably related to the outdated versions of some electron packages we are currently using (but will eventually update). If you are running into that issue, you can disable creating an installer during the packaging process by setting `HADRON_SKIP_INSTALLER` env variable to `true`:

```sh
HADRON_SKIP_INSTALLER=true npm run test-package-compass
```

#### `Module did not self-register` or `Module '<path>' was compiled against a different Node.js version` Errors

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

This means that if you e.g., start Compass application locally it will recompile all native modules to work in Electron runtime, if you would try to run tests for `mongodb-connection-model` library right after that, tests would fail due to `keytar` library not being compatible with Node.js environment that the tests are running in.

If you run into this issue, make sure that native modules are rebuilt for whatever runtime you are planning to use at the moment. To help with that we provide two npm scripts: `npm run electron-rebuild` will recompile native modules to work with Electron and `npm run node-rebuild` will recompile them to work with Node.js.
