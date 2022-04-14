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
- [**@mongodb-js/compass-connections**](packages/compass-connections): Connection Screen
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
- [**@mongodb-js/connection-form**](packages/connection-form): A form for specifying information needed to connect to a MongoDB instance
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
- [**hadron-document**](packages/hadron-document): Hadron Document
- [**hadron-ipc**](packages/hadron-ipc): Simplified IPC for electron apps.
- [**hadron-react-bson**](packages/hadron-react-bson): Hadron React BSON Components
- [**hadron-react-buttons**](packages/hadron-react-buttons): Hadron React Button Components
- [**hadron-react-components**](packages/hadron-react-components): Hadron React Components
- [**hadron-reflux-store**](packages/reflux-store): Hadron Reflux Stores
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
- [**mongodb-security**](packages/security): Portable business logic of MongoDB security model
- [**storage-mixin**](packages/storage-mixin): Ampersand model mixin to persist data via various storage backends

### Shared Configuration Files

- [**@mongodb-js/eslint-config-compass**](configs/eslint-config-compass): Shared eslint configuration used in Compass packages.
- [**@mongodb-js/mocha-config-compass**](configs/mocha-config-compass): Shared mocha configuration used in Compass packages.
- [**@mongodb-js/prettier-config-compass**](configs/prettier-config-compass): Shared prettier configurations used in Compass packages.
- [**@mongodb-js/tsconfig-compass**](configs/tsconfig-compass): Shared basic TypeScript configurations used in Compass packages.

## Contributing

For contributing, please refer to [CONTRIBUTING.md](CONTRIBUTING.md)

For issues, please create a ticket in our [JIRA Project](https://jira.mongodb.org/browse/COMPASS).

Is there anything else you’d like to see in Compass? Let us know by submitting suggestions in out [feedback forum](https://feedback.mongodb.com/forums/924283-compass).

## License

[SSPL](LICENSE)
