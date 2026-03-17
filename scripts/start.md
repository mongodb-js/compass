# Start Script Help

Usage: start.mts [-h/--help] [targets... [targetOptions...]]

## Options

- `-h, --help` Show this help message

## Targets

- `desktop` Start MongoDB Compass Desktop (default if no targets specified)
- `sandbox` Start MongoDB Compass Web Sandbox, useful for UI-only changes
- `sync` Start Cloud Sync, in combination with redirector/redwood can be used to test data explorer changes
  - `--no-mms` can be passed to the sync subcommand to not run MMS's dev server.

**Note:** `sandbox` must be run alone and cannot be combined with other targets.

## Port Configuration

The `desktop` and `sandbox` targets both use the same webpack dev server port (4242) by design. When running both targets simultaneously, the sandbox will automatically detect that the desktop target's webpack dev server is already running and will skip starting its own, sharing the same webpack dev server instance.

Since `sync` must run alone, there are no port conflicts with other targets.

### Well-Known Ports

| Port | Service                | Target               | Description                                     |
| ---- | ---------------------- | -------------------- | ----------------------------------------------- |
| 4242 | Webpack Dev Server     | `desktop`, `sandbox` | Serves compiled frontend assets with hot reload |
| 7777 | HTTP Proxy Server      | `sandbox`            | Express proxy server for Atlas API requests     |
| 1337 | WebSocket Proxy Server | `sandbox`            | WebSocket proxy for MongoDB connections         |
| 8080 | Atlas Local Backend    | `sync`               | Local MMS backend server (when MMS_HOME is set) |
| 8081 | MMS Dev Server         | `sync`               | Local MMS development server                    |
