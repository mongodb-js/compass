# Start Script Help

Usage: start.mts [-h/--help] [targets... [targetOptions...]]

## Options

- `-h, --help` Show this help message

## Targets

- `desktop` Start MongoDB Compass Desktop (default if no targets specified)
- `sandbox` Start MongoDB Compass Web Sandbox, useful for UI-only changes

**Note:** `sandbox` must be run alone and cannot be combined with other targets.

## Port Configuration

### Well-Known Ports

| Port | Service                | Target    | Description                                     |
| ---- | ---------------------- | --------- | ----------------------------------------------- |
| 4242 | Webpack Dev Server     | `desktop` | Serves compiled frontend assets with hot reload |
| 7777 | HTTP Proxy Server      | `sandbox` | Express proxy server for Atlas API requests     |
| 1337 | WebSocket Proxy Server | `sandbox` | WebSocket proxy for MongoDB connections         |
