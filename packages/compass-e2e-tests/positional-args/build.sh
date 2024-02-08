#!/usr/bin/env bash

set -e

# https://stackoverflow.com/questions/36727740/how-to-hide-console-window-of-a-go-program-on-windows
GOOS=windows GOARCH=amd64 go build -ldflags -H=windowsgui -o positional-args.exe
