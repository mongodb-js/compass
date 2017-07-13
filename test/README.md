# Test directory structure

Tests are now split into these test suites:

- `unit`: Fast unit tests of individual functions / methods
- `enzyme`: React component tests using the Enzyme framework
- `main`: Electron-specific tests run in the main process
- `renderer`: Electron-specific tests run in the renderer process
- `functional`: Slow functional test using Spectron (launches the application). 
For more details, see our [functional test README](functional/README.md).

You can run any subset of tests with command line flags, for example:

```
npm test -- --unit
npm test -- --functional
npm test -- --unit --enzyme --renderer
```
