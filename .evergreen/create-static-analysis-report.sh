#!/usr/bin/env bash
set -e
set -x

npm run create-static-analysis-report
(cd .sbom && tar czvf ../static-analysis-report.tgz codeql.md codeql.sarif.json)
