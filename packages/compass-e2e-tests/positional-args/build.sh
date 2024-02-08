#!/usr/bin/env bash

set -e

GOOS=windows GOARCH=amd64 go build -ldflags -H=windowsgui -o positional-args.exe
