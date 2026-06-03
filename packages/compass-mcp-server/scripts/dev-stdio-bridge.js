#!/usr/bin/env node
'use strict';

// Dev-only MCP stdio wrapper.
//
// External AI clients (Claude Desktop, Cursor, VS Code, Windsurf) spawn
// `Compass --mcp-stdio` and treat its stdout as the MCP wire (newline-
// delimited JSON-RPC). In a packaged Compass build that's clean.
//
// In a dev build, webpack-dev-server prepends an HMR client to the main
// bundle. The HMR client logs `[HMR] Waiting for update signal from
// WDS...` to stdout as soon as it boots — *before* anything inside the
// bundle has a chance to install a filter. That single line corrupts the
// MCP parser on the client side. We could install a filter from inside the
// bundle, but it always loses the race to the HMR module.
//
// Solution: in dev, the AI client config points at *this script* instead of
// Electron. We spawn Electron ourselves, then sit between the AI client
// and the dev build, scrubbing non-JSON-RPC lines out of the child's
// stdout before they reach the parent. Production builds bypass this
// wrapper entirely (see getBridgeInvocation in compass-mcp-server-manager).
//
// Plain CommonJS, no transpile, no transitive deps — runs straight from
// `node`.

const { spawn } = require('child_process');
const path = require('path');

const electronBinary = require('electron'); // resolves to the binary path
const mainBundle = path.resolve(
  __dirname,
  '..',
  '..',
  'compass',
  'build',
  'main.js'
);

const child = spawn(
  electronBinary,
  [mainBundle, '--mcp-stdio', ...process.argv.slice(2)],
  {
    stdio: ['pipe', 'pipe', 'pipe'],
    // Inherit env so the dev build sees the same shell as `npm start`.
    env: process.env,
  }
);

// stdin → child: pass through unmodified. The AI client's JSON-RPC
// requests need to reach the bundle byte-for-byte.
process.stdin.pipe(child.stdin);

// stderr → stderr: pass through. Useful diagnostics from the dev build
// should still be visible.
child.stderr.pipe(process.stderr);

// stdout → filter → stdout. Newline-split the stream; keep lines that
// look like JSON-RPC (start with `{`), redirect everything else (HMR
// logs, debug prints, console.log noise) to stderr.
let buffer = '';
child.stdout.on('data', (chunk) => {
  buffer += chunk.toString('utf8');
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 1);
    if (line.length === 0) {
      // Preserve blank lines on stdout — JSON-RPC framing may use them.
      process.stdout.write('\n');
      continue;
    }
    if (line.charCodeAt(0) === 0x7b /* '{' */) {
      process.stdout.write(line + '\n');
    } else {
      process.stderr.write(line + '\n');
    }
  }
});
child.stdout.on('end', () => {
  // Flush any trailing partial line. If it looks like JSON-RPC it's
  // surely incomplete; treat it as noise either way.
  if (buffer.length > 0) {
    process.stderr.write(buffer);
    buffer = '';
  }
});

// Forward common termination signals to the child so AI clients can stop
// us cleanly.
const forwardSignal = (signal) => {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
};
forwardSignal('SIGINT');
forwardSignal('SIGTERM');
forwardSignal('SIGHUP');

child.on('exit', (code, signal) => {
  if (signal) {
    // Re-raise the signal so our parent sees the same termination cause.
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  process.stderr.write(
    `[dev-stdio-bridge] failed to spawn Electron: ${err.message}\n`
  );
  process.exit(1);
});
