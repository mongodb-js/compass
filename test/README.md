# Test directory structure

Tests are now split into these test suites:

- `unit`: Fast unit tests of individual functions / methods
- `main`: Electron-specific tests run in the main process
- `connectivity`: Connectivity integration tests

You can run any subset of tests with command line flags, for example:

```
npm test -- --unit
npm test -- --connectivity
npm test -- --unit --connectivity
```
