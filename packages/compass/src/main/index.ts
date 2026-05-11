// THIS IMPORT SHOULD ALWAYS BE THE FIRST ONE FOR THE APPLICATION ENTRY POINT
import { setupHadronDistribution } from '../setup-hadron-distribution';
setupHadronDistribution();
// ------------------------------------------------------------

// Dispatcher between the regular Compass app and the MCP stdio bridge.
//
// We MUST decide which one to load before any of the main-app's modules
// evaluate, otherwise the bridge process — which is spawned cold by external
// AI clients (Claude Desktop, Cursor, ...) without webpack-dev-server / HMR
// access — will fail when transitive imports such as `icon.ts` try to call
// Electron APIs that aren't fully available in that context.
//
// Static `import` statements are hoisted, so we use `require()` here to keep
// module loading lazy and conditional. Webpack will still bundle both
// branches; only the one we actually require will have its factories
// executed at runtime.

if (process.argv.includes('--mcp-stdio')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bridge = require('@mongodb-js/compass-mcp-server/stdio-bridge') as {
    runStdioBridge: () => Promise<void>;
  };
  void bridge.runStdioBridge();
} else {
  // Side-effect import: requiring this file kicks off the full Compass GUI
  // startup chain.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./main-app');
}
