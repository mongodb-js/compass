# compass-utils

This is a package containing utilities that are useful across Compass.

Before adding something to this package, please consider whether there is a more appropriate location!

Examples of items that do _not_ belong in this package:

- Code that depends on other Compass packages
- Code that depends on packages which require a specific execution environment
- React Components, CSS templates, etc. (→ `compass-components`)
- Code for working with MongoDB BSON documents (→ `hadron-document`)
- Debugging utilities (→ `compass-logging`)
- Scripts for working with the Compass monorepo
- …

Examples of items that _could_ belong in this package:

- lodash-style helpers for working with JS objects (which are not provided by lodash itself)
- Helpers for promisifying legacy dependencies that are used across packages
- Types for legacy dependencies that are used across packages
