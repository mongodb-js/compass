# Driving Compass with Chrome DevTools MCP

Lets an MCP client (Claude Code, Gemini CLI, etc.) inspect and control the running Compass renderer: a11y snapshots, clicks, console, network, performance traces.

## 1. Start Compass with a debug port

```bash
ELECTRON_EXTRA_ARGS="--ignore-additional-command-line-flags --remote-debugging-port=9222 --inspect=9229" npm start
```

`--remote-debugging-port` exposes the renderer over CDP (for chrome-devtools-mcp, below). `--inspect` exposes the main process over the Node inspector protocol (for the VS Code debug MCP server, further down). Drop whichever port you don't need.

`ELECTRON_EXTRA_ARGS` is passed straight to the Electron binary by the dev server. `--ignore-additional-command-line-flags` is required or Compass rejects the Chromium flag as an unknown option.

Wait for `DevTools listening on ws://127.0.0.1:9222/...` in the output.

## 2. Add the MCP server

Add to your MCP client config (for Claude Code: `~/.claude.json` under `mcpServers`):

```json
"compass-devtools": {
  "command": "npx",
  "args": ["chrome-devtools-mcp@latest", "--browser-url=http://127.0.0.1:9222"]
}
```

Restart the client. `list_pages` should show `MongoDB Compass Dev Local (http://localhost:4242/index.html)`.

## 3. Debug the main process (VS Code debug MCP)

`--browser-url`/CDP only reaches the renderer. The main process is a separate Node process, debugged over the Node inspector protocol via VS Code's `debugmcp` server instead.

Add an attach config to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Compass main process",
      "port": 9229,
      "address": "127.0.0.1",
      "restart": true,
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

With Compass running (step 1, `--inspect=9229` included), attach:

- In VS Code: Run and Debug → "Attach to Compass main process" → Start.
- From the MCP client: `get_debug_status` reports the session once attached; `pause_execution` / breakpoints stop it; `evaluate_expression` / `get_variables_values` only work while paused.

Note: attaching pauses at Electron's own bootstrap (`default_app.asar/main.js`), before Compass's `packages/compass/src/main` code runs. Set a breakpoint in Compass main-process source and `continue_execution` to reach app code.

## Notes

- The debug port is open to any local process while Compass runs. Dev only.
