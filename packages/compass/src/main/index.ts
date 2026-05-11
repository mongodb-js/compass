// In dev mode (`npm start`), webpack-dev-server injects an HMR client into
// the bundle that logs lines like `[HMR] Waiting for update signal from
// WDS...` to stdout. The MCP stdio protocol owns stdout — anything that
// isn't a newline-delimited JSON-RPC message corrupts the client's parser
// (Claude Desktop surfaces it as "Unexpected token 'H', '[HMR] Waiti'..."). So
// in `--mcp-stdio` mode we install a stdout filter as the very first thing
// in the entry: writes that don't begin with `{` (a JSON object) or `\n`
// (a newline trailing a previous chunk) are redirected to stderr.
//
// This MUST run before any other code that could produce stdout output —
// including the HMR client, which schedules its logs asynchronously after
// the WDS connection is established. Static imports below resolve before
// this statement at the bytecode level, but those imports only declare
// modules; their async-callback writes happen after this guard installs.
if (process.argv.includes('--mcp-stdio')) {
  const realStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (
    chunk: string | Uint8Array,
    encoding?: BufferEncoding | ((err?: Error) => void),
    cb?: (err?: Error) => void
  ): boolean {
    const firstByte =
      typeof chunk === 'string'
        ? chunk.charCodeAt(0)
        : chunk.length > 0
        ? chunk[0]
        : 0;
    // 0x7B = '{', 0x0A = '\n'. JSON-RPC messages start with `{` (object);
    // chunked writes that continue a previous JSON line may begin at any
    // byte. We accept a leading newline as a trailing terminator for a
    // previously sent JSON object.
    if (firstByte === 0x7b || firstByte === 0x0a) {
      return realStdoutWrite(chunk, encoding as never, cb as never);
    }
    return process.stderr.write(chunk, encoding as never, cb as never);
  };
}

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
