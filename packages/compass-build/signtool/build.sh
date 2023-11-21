#!/usr/bin/env bash

set -e

GOOS=windows GOARCH=amd64 go build -o signtool.exe
