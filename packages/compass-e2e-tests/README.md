# Compass e2e test suites

A suite of compass end-to-end tests powered by webdriverio and mocha test runner.

## npm scripts

- `npm run test`: Runs tests against Compass source (unpackaged applicaiton, the one you see when running `npm run start` from the monorepo root).
- `npm run test-ci`: Runs tests against Compass source, similar to the previous command, but with a more aggressive clean up of running processes after tests are finished.
- `npm run test-packaged`: Runs tests against packaged Compass application. Expects the build to be present in `packages/compass/dist` and will throw otherwise.
- `npm run test-packaged-ci`: Similar to the previous command, but with a more aggressive clean up.
