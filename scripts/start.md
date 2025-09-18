# Start Script Help

Usage: start.mts [-h/--help] [targets... [targetOptions...]]

## Options

- `-h, --help` Show this help message

## Targets (can be used in any combination)

- `desktop` Start MongoDB Compass Desktop (default if no targets specified)
- `sandbox` Start MongoDB Compass Web Sandbox, useful for UI-only changes
- `sync` Start Cloud Sync, in combination with redirector/redwood can be used to test data explorer changes

## Examples

start.mts # Start desktop (default)
start.mts desktop --production # Start desktop explicitly
start.mts web # Start web sandbox only
start.mts desktop web # Start both desktop and web
start.mts sync --flagA -b web -c # Start mms-sync and web
