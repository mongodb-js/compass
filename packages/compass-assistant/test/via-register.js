'use strict';
const Module = require('node:module');

// @via-ds/components is strict ESM but imports extensionless subpaths of
// packages without an `exports` map (graphql-language-service/esm/...), which
// Node refuses to resolve (and so does that package's own ESM build). Same bug the webpack `viaDsResolveLoader` works
// around; retry those specifiers with the extension so tests can load Via.
Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (
        err.code === 'ERR_MODULE_NOT_FOUND' &&
        !specifier.endsWith('.js') &&
        (specifier.startsWith('graphql-language-service/esm/') ||
          context.parentURL?.includes('/graphql-language-service/esm/'))
      ) {
        return nextResolve(`${specifier}.js`, context);
      }
      throw err;
    }
  },
});
