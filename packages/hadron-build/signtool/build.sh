#!/usr/bin/env bash

set -e

go install
GOOS=windows GOARCH=amd64 go build -o signtool.exe

echo "signtool.exe built successfully"