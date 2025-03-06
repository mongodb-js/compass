# MongoDB Compass Monorepo

This repository contains the source code and build tooling used in [MongoDB Compass](https://www.mongodb.com/products/compass).

![Aggregation Pipeline Builder Tab in Compass](packages/compass/compass-screenshot.png)

## Contributing

For contributing, please refer to [CONTRIBUTING.md](CONTRIBUTING.md)

For issues, please create a ticket in our [JIRA Project](https://jira.mongodb.org/browse/COMPASS).

Is there anything else you’d like to see in Compass? Let us know by submitting suggestions in out [feedback forum](https://feedback.mongodb.com/forums/924283-compass).

## Packages Overview

- [**mongodb-compass**](packages/compass): The MongoDB GUI

### Compass Plugins

- [**@mongodb-js/compass-aggregations**](packages/compass-aggregations): Compass Aggregation Pipeline Builder
- [**@mongodb-js/compass-app-stores**](packages/compass-app-stores): The external stores repo for compass
- [**@mongodb-js/compass-collection**](packages/compass-collection): Compass Collection
- [**@mongodb-js/compass-crud**](packages/compass-crud): Compass Plugin for CRUD Operations
- [**@mongodb-js/compass-databases-collections**](packages/databases-collections): Plugin for viewing the list of, creating, and dropping databases and collections
- [**@mongodb-js/compass-explain-plan**](packages/compass-explain-plan): Evaluate the performance of your query
- [**@mongodb-js/compass-export-to-language**](packages/compass-export-to-language): Export MongoDB queries and aggregations to various languages
- [**@mongodb-js/compass-field-store**](packages/compass-field-store): FieldStore keeps track of available fields in a collection
- [**@mongodb-js/compass-find-in-page**](packages/compass-find-in-page): cmd-f UI for Compass
- [**@mongodb-js/compass-import-export**](packages/compass-import-export): Import/Export feature for Compass
- [**@mongodb-js/compass-indexes**](packages/compass-indexes): Collection index management for Compass
- [**@mongodb-js/compass-query-bar**](packages/compass-query-bar): Renders a component for executing MongoDB queries through a GUI
- [**@mongodb-js/compass-saved-aggregations-queries**](packages/compass-saved-aggregations-queries): Instance tab plugin that shows saved queries and aggregations
- [**@mongodb-js/compass-schema**](packages/compass-schema): Compass Schema Tab Plugin
- [**@mongodb-js/compass-schema-validation**](packages/compass-schema-validation): Compass plugin for document JSON schema validation
- [**@mongodb-js/compass-serverstats**](packages/compass-serverstats): Compass Real Time
- [**@mongodb-js/compass-shell**](packages/compass-shell): Compass Shell Plugin
- [**@mongodb-js/compass-sidebar**](packages/compass-sidebar): The sidebar of Compass

### Shared Libraries and Build Tools

- [**@mongodb-js/atlas-service**](packages/atlas-service): Service to handle Atlas sign in and API requests
- [**@mongodb-js/compass-components**](packages/compass-components): React Components used in Compass
- [**@mongodb-js/compass-connection-import-export**](packages/compass-connection-import-export): UI for Compass connection import/export
- [**@mongodb-js/compass-connections**](packages/compass-connections): Manage your MongoDB connections and connect in Compass
- [**@mongodb-js/compass-connections-navigation**](packages/compass-connections-navigation): Databases and collections sidebar navigation tree
- [**@mongodb-js/compass-editor**](packages/compass-editor): Reusable Compass editor component based on codemirror editor, themes, and autocompleters
- [**@mongodb-js/compass-generative-ai**](packages/compass-generative-ai): Generative AI aspects for Compass
- [**@mongodb-js/compass-intercom**](packages/compass-intercom): Intercom scripts and utils for Compass
- [**@mongodb-js/compass-logging**](packages/compass-logging): Shared helpers for logging in Compass packages
- [**@mongodb-js/compass-maybe-protect-connection-string**](packages/compass-maybe-protect-connection-string): Utility for protecting connection strings if requested
- [**@mongodb-js/compass-settings**](packages/compass-settings): Settings for compass
- [**@mongodb-js/compass-telemetry**](packages/compass-telemetry): Compass telemetry
- [**@mongodb-js/compass-schema-analysis**](packages/compass-schema-analysis): Compass schema analysis
- [**@mongodb-js/compass-test-server**](packages/compass-test-server): Wrapper around mongodb-runner to manage test servers for Compass
- [**@mongodb-js/compass-user-data**](packages/compass-user-data): undefined
- [**@mongodb-js/compass-utils**](packages/compass-utils): Utilities for MongoDB Compass Development
- [**@mongodb-js/compass-web**](packages/compass-web): Compass application packaged for the browser environment
- [**@mongodb-js/compass-welcome**](packages/compass-welcome): The welcome modal
- [**@mongodb-js/compass-workspaces**](packages/compass-workspaces): Compass plugin responsible for rendering and managing state of current namespace / workspace
- [**@mongodb-js/connection-form**](packages/connection-form): A form for specifying information needed to connect to a MongoDB instance
- [**@mongodb-js/connection-info**](packages/connection-info): Types and utilites for connections agnostic of backend
- [**@mongodb-js/connection-storage**](packages/connection-storage): Compass connection storage
- [**@mongodb-js/databases-collections-list**](packages/databases-collections-list): List view for the databases and collections
- [**@mongodb-js/explain-plan-helper**](packages/explain-plan-helper): Explain plan utility methods for MongoDB Compass
- [**@mongodb-js/my-queries-storage**](packages/my-queries-storage): Saved aggregations and queries storage
- [**@mongodb-js/reflux-state-mixin**](packages/reflux-state-mixin): Reflux stores mixin adding 'state' syntax similar to React components
- [**bson-transpilers**](packages/bson-transpilers): Source to source compilers using ANTLR
- [**compass-e2e-tests**](packages/compass-e2e-tests): E2E test suite for Compass app that follows smoke tests / feature testing matrix
- [**compass-preferences-model**](packages/compass-preferences-model): Compass preferences model
- [**hadron-app-registry**](packages/hadron-app-registry): Hadron App Registry
- [**hadron-build**](packages/hadron-build): Tooling for Hadron apps like Compass
- [**hadron-document**](packages/hadron-document): Hadron Document
- [**hadron-ipc**](packages/hadron-ipc): Simplified IPC for electron apps.
- [**hadron-type-checker**](packages/hadron-type-checker): Hadron Type Checker
- [**mongodb-collection-model**](packages/collection-model): MongoDB collection model
- [**mongodb-data-service**](packages/data-service): MongoDB Data Service
- [**mongodb-database-model**](packages/database-model): MongoDB database model
- [**mongodb-explain-compat**](packages/mongodb-explain-compat): Convert mongodb SBE explain output to 4.4 explain output
- [**mongodb-instance-model**](packages/instance-model): MongoDB instance model
- [**mongodb-query-util**](packages/mongodb-query-util): Utilty Functions for MongoDB Query Functionality

### Shared Configuration Files

- [**@mongodb-js/eslint-config-compass**](configs/eslint-config-compass): Shared Compass eslint configuration
- [**@mongodb-js/eslint-plugin-compass**](configs/eslint-plugin-compass): Custom eslint rules for Compass monorepo
- [**@mongodb-js/mocha-config-compass**](configs/mocha-config-compass): Shared mocha mocha configuration for Compass packages
- [**@mongodb-js/prettier-config-compass**](configs/prettier-config-compass): Shared Compass prettier configuration
- [**@mongodb-js/testing-library-compass**](configs/testing-library-compass): Compass unit testing utils
- [**@mongodb-js/tsconfig-compass**](configs/tsconfig-compass): Shared Compass Typescript configuration
- [**@mongodb-js/webpack-config-compass**](configs/webpack-config-compass): Shared webpack configuration for Compass application and plugins

## License

[SSPL](LICENSE)
