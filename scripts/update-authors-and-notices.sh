#!/usr/bin/env bash

echo "Updating AUTHORS and THIRD-PARTY-NOTICES"

npm run update-authors
npm run update-third-party-notices
git commit --no-allow-empty -m "chore: update THIRD-PARTY-NOTICES" THIRD-PARTY-NOTICES.md || true
git commit --no-allow-empty -m "chore: update AUTHORS" AUTHORS || true
