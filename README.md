# MongoDB Compass Monorepo

This repository contains the source code and build tooling used in [MongoDB Compass](https://compass.mongodb.com).

![Aggregation Pipeline Builder Tab in Compass](packages/compass/compass-screenshot.png)

## Packages Overview

- [**mongodb-compass**](packages/compass): MongoDB Compass Application

### Compass Plugins

- [**@mongodb-js/compass-aggregations**](packages/compass-aggregations): Compass Aggregation Pipeline Builder
- [**@mongodb-js/compass-app-stores**](packages/compass-app-stores): The external stores repo for compass
- [**@mongodb-js/compass-auto-updates**](packages/compass-auto-updates): Compass Auto Updates Plugin
- [**@mongodb-js/compass-collection**](packages/compass-collection): Compass Collection Plugin
- [**@mongodb-js/compass-collection-stats**](packages/compass-collection-stats): Compass Collection Stats Plugin
- [**@mongodb-js/compass-connect**](packages/compass-connect): Connection Screen Plugin that supports Compass
- [**@mongodb-js/compass-crud**](packages/compass-crud): Compass Plugin for CRUD Operations
- [**@mongodb-js/compass-database**](packages/compass-database): Compass Database Plugin
- [**@mongodb-js/compass-databases-collections**](packages/databases-collections): Plugin for viewing the list of, creating, and dropping databases and collections
- [**@mongodb-js/compass-deployment-awareness**](packages/compass-deployment-awareness): Compass Deployment Awareness Plugin
- [**@mongodb-js/compass-explain-plan**](packages/compass-explain-plan): Evaluate the performance of your quer
- [**@mongodb-js/compass-export-to-language**](packages/compass-export-to-language): export to language modal
- [**@mongodb-js/compass-field-store**](packages/compass-field-store): FieldStore keeps track of available fields in a collection.
- [**@mongodb-js/compass-find-in-page**](packages/compass-find-in-page): cmd-f UI for compass
- [**@mongodb-js/compass-home**](packages/compass-home): Home
- [**@mongodb-js/compass-import-export**](packages/compass-import-export): Compass Import/Export Plugin
- [**@mongodb-js/compass-indexes**](packages/compass-indexes): Indexes support for Compass
- [**@mongodb-js/compass-instance**](packages/compass-instance): compass instance plugin
- [**@mongodb-js/compass-loading**](packages/compass-loading): Compass Loading Screen
- [**@mongodb-js/compass-metrics**](packages/compass-metrics): Compass Metrics Plugin
- [**@mongodb-js/compass-plugin-info**](packages/compass-plugin-info): Compass Plugin Information Plugin
- [**@mongodb-js/compass-query-bar**](packages/compass-query-bar): Renders a component for executing MongoDB queries through a GUI.
- [**@mongodb-js/compass-query-history**](packages/compass-query-history): The query history sidebar.
- [**@mongodb-js/compass-schema**](packages/compass-schema): Compass Schema Tab Plugin
- [**@mongodb-js/compass-schema-validation**](packages/compass-schema-validation): Compass plugin for document JSON schema validation
- [**@mongodb-js/compass-server-version**](packages/compass-server-version): Compass Server Version
- [**@mongodb-js/compass-serverstats**](packages/compass-serverstats): Compass Real Time Server Stats Component.
- [**@mongodb-js/compass-shell**](packages/compass-shell): Compass Shell Plugin
- [**@mongodb-js/compass-sidebar**](packages/compass-sidebar): Sidebar external plugin
- [**@mongodb-js/compass-ssh-tunnel-status**](packages/compass-ssh-tunnel-status): Compass SSH Tunnel Status
- [**@mongodb-js/compass-status**](packages/compass-status): Compass Status Plugin

### Shared Libraries and Build Tools

- [**@mongodb-js/compass-components**](packages/compass-components): A set of React Components used in Compass
- [**@mongodb-js/hadron-plugin-manager**](packages/hadron-plugin-manager): Hadron Plugin Manager
- [**@mongodb-js/mongodb-notary-service-client**](packages/notary-service-client): A client for our notary-service: an API for codesigning.
- [**@mongodb-js/mongodb-redux-common**](packages/redux-common): Common Redux Modules for mongodb-js
- [**app-migrations**](packages/app-migrations): Helper for application schema migrations.
- [**compass-preferences-model**](packages/compass-preferences-model): Compass preferences model.
- [**compass-user-model**](packages/compass-user-model): MongoDB user model.
- [**electron-license**](packages/electron-license): Tools for electron apps to work with licenses
- [**hadron-app**](packages/hadron-app): Hadron Application Singleton
- [**hadron-app-registry**](packages/hadron-app-registry): Hadron App Registry
- [**hadron-auto-update-manager**](packages/hadron-auto-update-manager): Atoms AutoUpdateManager class as a standalone module.
- [**hadron-build**](packages/hadron-build): Tooling for Hadron apps.
- [**hadron-compile-cache**](packages/hadron-compile-cache): Hadron Compile Cache
- [**hadron-document**](packages/hadron-document): Hadron Document
- [**hadron-ipc**](packages/hadron-ipc): Simplified IPC for electron apps.
- [**hadron-module-cache**](packages/module-cache): Hadron Module Cache
- [**hadron-react-bson**](packages/hadron-react-bson): Hadron React BSON Components
- [**hadron-react-buttons**](packages/hadron-react-buttons): Hadron React Button Components
- [**hadron-react-components**](packages/hadron-react-components): Hadron React Components
- [**hadron-reflux-store**](packages/reflux-store): Hadron Reflux Stores
- [**hadron-style-manager**](packages/hadron-style-manager): Hadron Style Manager
- [**hadron-type-checker**](packages/hadron-type-checker): Hadron Type Checker
- [**mongodb-ace-mode**](packages/ace-mode): MongoDB Mode for the ACE Editor
- [**mongodb-ace-theme**](packages/ace-theme): MongoDB Theme for the ACE Editor
- [**mongodb-ace-theme-query**](packages/ace-theme-query): MongoDB Theme for the ACE Editor in the Query Bar
- [**mongodb-collection-model**](packages/collection-model): MongoDB collection model.
- [**mongodb-connection-model**](packages/connection-model): MongoDB connection model.
- [**mongodb-data-service**](packages/data-service): MongoDB Data Service
- [**mongodb-database-model**](packages/database-model): MongoDB database model.
- [**mongodb-explain-compat**](packages/mongodb-explain-compat): Convert mongodb SBE explain output to 4.4 explain output
- [**mongodb-explain-plan-model**](packages/explain-plan-model): Ampersand model abstraction for MongoDB explain plans (3.0+)
- [**mongodb-index-model**](packages/index-model): MongoDB index model.
- [**mongodb-instance-model**](packages/instance-model): MongoDB instance model.
- [**mongodb-js-metrics**](packages/metrics): Shareable metric recording.
- [**mongodb-language-model**](packages/mongodb-language-model): Parses MongoDB query language and returns an abstract syntax tree
- [**mongodb-security**](packages/security): Portable business logic of MongoDB security model
- [**storage-mixin**](packages/storage-mixin): Ampersand model mixin to persist data via various storage backends

## Working With the Monorepo

You'll need node ^12.22.4 and npm 7 installed on your machine to work with the repository locally. After your environment is ready, navigate to the repository and run `npm run bootstrap`, this will install dependencies and will compile all packages.

After bootstrap is finished, you should be able to run `npm run start` and see Compass application running locally.

This monorepo is powered by [`npm workspaces`](https://docs.npmjs.com/cli/v7/using-npm/workspaces) an [`lerna`](https://github.com/lerna/lerna#readme), although not necessary, it might be helpful to have a high level understanding of those tools.

### Working on Plugins

Most of the plugins have their own development environment so you can work on them in isolation. If you want to work on a plugin without running the whole Compass application, you can run `npm run start` in the plugin directory (such as at the top of the `compass/packages/compass-connect` directory), either with the help of `lerna` or `npm workspaces`. For example, to start `compass-connect` plugin locally, you can either run `npm run start --workspace @mongodb-js/compass-connect` from the top of `compass` directory, run `npx lerna run start --scope @mongodb-js/compass-connect --stream` from anywhere in the `compass` directory, or run `npm run start` from the top of the `compass/packages/compass-connect` directory. Same approaches will work for any other workspace-specific script. If you want to run commands like `test` or `check` only for one specific workspace in the repository, you can use any of the methods described above. As an example, to run all tests in one plugin that you are working on such as the `compass-connect` plugin, you can run `npm run test` from the top of the `compass/packages/compass-connect` directory.

If you want to see your changes applied in Compass, you might need to rebuild plugins that you changed with the `compile` command. Instead of manually writing out the `scope` you might want to use `lerna --since` filter to rebuild everything since your local or origin `HEAD` of the git history: `npx lerna run compile --stream --since origin/HEAD`. Restarting or hard-reloading (Shift+CMD+R) Compass after compilation is finished should apply your changes.

In addition to running lerna commands directly, there are a few convenient npm scripts for working with packages:

- `npm run compile-changed` will compile all plugins and their dependants changed since `origin/HEAD`
- `npm run test-changed` will run tests in all packages and their dependants changed since `origin/HEAD`.
- `npm run check-changed` will run `eslint` and `depcheck` validation in all packages (ignoring dependants) changed since `origin/HEAD`

### Building Compass Locally

To build compass you can run `package-compass` script in the scope of `mongodb-compass` workspace:

```sh
npm run package-compass --workspace mongodb-compass
```

This command requires a bunch of environment variables provided (`HADRON_PRODUCT`, `HADRON_PRODUCT_NAME`, `HADRON_DISTRIBUTION`, etc) so for your convenience there is a script provided that sets all those vars to some default values and will take care of generating a required package-lock.json file for the compass workspace

```sh
npm run test-package-compass
```

To speed up the process you might want to disable creating installer for the application. To do that you can set `HADRON_SKIP_INSTALLER` environmental variable to `true` when running the script

```sh
HADRON_SKIP_INSTALLER=true npm run test-package-compass
```

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

### Publishing Packages

For package changes to be applied in Compass beta or GA releases they need to be published first. The whole publish process happens from the main branch with the following command in order:

1. `npm run packages-version [semver bump]`: updates package versions for everything that was changed since the last release, updates package-lock file at the root of the repository, commits and tags the changes. See lerna docs to learn more about optional [`semver bump`](https://github.com/lerna/lerna/tree/main/commands/version#semver-bump) argument.
1. `npm run packages-publish`: publishes packages to the registry, if your npm account uses OTP publishing protection get ready to enter the code a few times, as an alternative you might want to use [npm automation authorization tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens) locally if OTP gets in the way too much (in that case add a [`--no-verify-access`](https://github.com/lerna/lerna/tree/main/commands/publish#--no-verify-access) flag to the publish command). Publish command can be re-run safely multiple times, so if something bad happens mid-release (e.g., your internet goes out), you should be able to safely fiinish the process. After publish finishes successfully the script will push version update commit and tags created in step 1. We do it automatically only post-release so that when evergreen picks up a commit in the main branch, all the tasks can run with the packages already published.

### Add / Update / Remove Dependencies in Packages

To add, remove, or update a dependency in any workspace you can use the usual `npm install` with a `--workspace` argument added, e.g. to add `react-aria` dependency to compass-connect and compass-query-bar plugins you can run `npm install --save react-aria --workspace @mongodb-js/compass-connect --workspace @mongodb-js/compass-query-bar`.

Additionally if you want to update a version of an existing dependency, but don't want to figure out the scope manually, you can use `npm run where` helper script. To update `webpack` in every package that has it as a dev dependency you can run `npm run where "devDependencies['webpack']" -- install --save-dev webpack@latest`

## Contributing

For issues, please create a ticket in our [JIRA Project](https://jira.mongodb.org/browse/COMPASS).

For contributing, please refer to [CONTRIBUTING.md](CONTRIBUTING.md)

Is there anything else you’d like to see in Compass? Let us know by submitting suggestions in out [feedback forum](https://feedback.mongodb.com/forums/924283-compass).

## License

[SSPL](LICENSE)
