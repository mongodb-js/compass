# Compass Web Type Tests

Type tests for `@mongodb-js/compass-web` using [tsd](https://github.com/SamVerschueren/tsd).

## Why a separate package?

This directory is structured as its own npm package to **simulate an external consumer environment**. The main `compass-web` package has access to all internal dependencies, but real consumers only get the bundled `compass-web.d.ts` file.

This setup ensures our type definitions are truly standalone and don't accidentally depend on internal types that consumers won't have access to.

## Running tests

From main compass-web directory:

```bash
npm run test-types
```

Also runs after: `npm run check`

Tests validate that the bundled types work correctly for external consumers without requiring internal Compass dependencies.
