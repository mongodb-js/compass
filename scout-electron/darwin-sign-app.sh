#!/bin/sh
#
# Use Apple's codesign(1) utility to ensure that users can run Scout immediately after downloading
#
# References:
# man 1 codesign
# https://developer.apple.com/library/mac/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html
# https://developer.apple.com/library/mac/technotes/tn2206/_index.html
#
# TODO: replace with native gulp tasks
# TODO: consider using productbuild(1) to build a .pkg. It takes care of invoking codesign
#

set -o errexit

if [ "$#" -ne "2" ]
then
  echo "Usage: darwin-sign-app.sh <identity> <path to .app>"
  exit 1
fi

# Assume two arguments; identity, path-to-app
IDENTITY="${1}"
APP_PATH="${2}"

test -d ${APP_PATH}

# IDENTITY is the SHA-1 signature of a Code Signing Identity obtained from Apple
# which must be accessible via the user/system keychain

(
  cd $(dirname "${APP_PATH}")
  APP=$(basename "${APP_PATH}")

  # Clean up ".cstemp" files from previous attempts
  find "${APP}" -name \*.cstemp -type f -delete

  for FRAMEWORK in "${APP}"/Contents/Frameworks/*
  do
    echo "• Signing framework: $FRAMEWORK"
    codesign -s ${IDENTITY} -vvv --deep --force "$FRAMEWORK"
  done

  echo "• Signing executable"
  codesign -s ${IDENTITY} -vvv --force "${APP}/Contents/MacOS/Scout"

  echo "• Signing app bundle"
  codesign -s ${IDENTITY} --deep -vvv --force "${APP}"

  echo
  echo "• Verify"
  codesign --verify -vvv "${APP}"
)
