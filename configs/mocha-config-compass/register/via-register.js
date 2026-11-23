'use strict';
const Module = require('node:module');

// Same as the `graphql-language-service` alias in webpack-config-compass: Via
// (@via-ds/components) only uses it for GraphQL highlighting in its code block,
// and imports it through extensionless subpaths that Node's strict ESM
// resolution refuses, so tests can't even load Via without this.
const EMPTY_MODULE = `data:text/javascript,${encodeURIComponent(
  'export default undefined;'
)}`;

// `registerHooks` is not available in older Node.js versions, and nothing
// loads Via there anyway
if (typeof Module.registerHooks === 'function') {
  Module.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (
        specifier === 'graphql-language-service' ||
        specifier.startsWith('graphql-language-service/')
      ) {
        return { url: EMPTY_MODULE, format: 'module', shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
}
