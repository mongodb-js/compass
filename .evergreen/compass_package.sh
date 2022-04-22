#! /usr/bin/env bash
if [[ "$OSTYPE" == "cygwin" ]]; then
  # If not possible to remove this hack, we should find a better way
  # to do this instead of directly referencing node_module paths,
  # but first figure out what exactly was changed in our fork of
  # electron-wix-msi
  #
  # TODO: https://jira.mongodb.org/browse/COMPASS-4888

  echo "Fetching signtool -> notary-service hack..."
  # curl -fs \
  #   -o "signtool.exe" \
  #   --url "https://s3.amazonaws.com/boxes.10gen.com/build/signtool.exe"
  cl .evergreen/signtool.c
  rm -f node_modules/electron-winstaller/vendor/signtool.exe
  rm -f node_modules/@mongodb-js/electron-wix-msi/vendor/signtool.exe
  chmod +x signtool.exe
  cp signtool.exe node_modules/@mongodb-js/electron-wix-msi/vendor/signtool.exe
  cp signtool.exe node_modules/electron-winstaller/vendor/signtool.exe

  echo "Starting Installer Service..."
  net start MSIServer
fi

echo "Creating signed release build..."
npm run package-compass $COMPASS_DISTRIBUTION;

ls -la packages/compass/dist
