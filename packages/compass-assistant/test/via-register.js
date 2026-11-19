'use strict';
const Module = require('node:module');

// Same as the `graphql-language-service` alias in webpack-config-compass: Via
// only uses it for GraphQL highlighting in its code block, and imports it
// through extensionless subpaths that Node's strict ESM resolution refuses.
const EMPTY_MODULE = `data:text/javascript,${encodeURIComponent(
  'export default undefined;'
)}`;

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
