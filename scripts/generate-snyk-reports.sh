#!/usr/bin/env bash

mkdir -p .snyk-reports

electron_version=$(node -e "console.log(require('electron/package.json').version)")

npx lerna exec 'mkdir -p node_modules'

echo "Generating report for the electron version used (${electron_version}) ..."
npx snyk test "electron@${electron_version}" --json --severity-threshold=high > .snyk-reports/electron.json

echo "Generating report with prod deps only ..."
npx snyk test --all-projects --json --severity-threshold=high > .snyk-reports/prod-only.json

echo "Generating report with all deps ..."
npx snyk test --all-projects --severity-threshold=high --json --dev > .snyk-reports/all.json

echo "Generating html reports ..."
npx snyk-to-html -i .snyk-reports/electron.json -o .snyk-reports/electron.html
npx snyk-to-html -i .snyk-reports/prod-only.json -o .snyk-reports/prod-only.html
npx snyk-to-html -i .snyk-reports/all.json -o .snyk-reports/all.html
