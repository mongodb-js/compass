#! /usr/bin/env bash

set -e

ARTIFACTS_DIR="packages/compass/dist"
echo "Verifying artifacts at $ARTIFACTS_DIR"
ls -l $ARTIFACTS_DIR

# Use tmp directory for all gpg operations/the rpm database
GPG_HOME=$(mktemp -d)
TMP_FILE=$(mktemp)
COMPASS_KEY="https://pgp.mongodb.com/compass.asc"

trap_handler() {
  local code=$?
  if [ $code -eq 0 ]; then
    echo "Verification successful"
  else
    echo "Verification failed with exit code $code"
    cat "$TMP_FILE"
  fi
  rm -f "$TMP_FILE"
  rm -rf "$GPG_HOME"
  exit $code
}

trap trap_handler ERR EXIT

verify_using_gpg() {
  echo "Verifying $1 using gpg"
  gpg --homedir $GPG_HOME --verify $ARTIFACTS_DIR/$1.sig $ARTIFACTS_DIR/$1 > "$TMP_FILE" 2>&1
}

verify_using_powershell() {
  echo "Verifying $1 using powershell"
  powershell Get-AuthenticodeSignature -FilePath $ARTIFACTS_DIR/$1 > "$TMP_FILE" 2>&1
}

verify_using_codesign() {
  echo "Verifying $1 using codesign"
  codesign -dv --verbose=4 $ARTIFACTS_DIR/$1 > "$TMP_FILE" 2>&1
}

verify_using_rpm() {
  # RPM packages are signed using gpg and the signature is embedded in the package.
  # Here, we need to import the key in `rpm` and then verify the signature.
  echo "Importing key into rpm"
  rpm --dbpath "$GPG_HOME" --import $COMPASS_KEY > "$TMP_FILE" 2>&1
  # Even if the file is not signed, the command below will exit with 0 and output something like: digests OK
  # So we need to check the output of the command to see if the file is signed successfully.
  echo "Verifying $1 using rpm"
  output=$(rpm --dbpath "$GPG_HOME" -K $ARTIFACTS_DIR/$1)

  # Check if the output contains the string "pgp md5 OK"
  if [[ $output != *"digests signatures OK"* ]]; then
    echo "File $1 is not signed"
    exit 1
  fi
}

setup_gpg() {
  echo "Importing Compass public key"
  curl $COMPASS_KEY | gpg --homedir $GPG_HOME --import > "$TMP_FILE" 2>&1
}

if [ "$IS_WINDOWS" = true ]; then
  verify_using_powershell $WINDOWS_EXE_NAME
  verify_using_powershell $WINDOWS_MSI_NAME
  echo "Skipping verification for Windows artifacts using gpg: $WINDOWS_ZIP_NAME, $WINDOWS_NUPKG_NAME"
  DEBUG=compass* npm run -w mongodb-compass verify-package-contents

elif [ "$IS_UBUNTU" = true ]; then
  setup_gpg
  verify_using_gpg $LINUX_DEB_NAME
  verify_using_gpg $LINUX_TAR_NAME
  DEBUG=compass* npm run -w mongodb-compass verify-package-contents
elif [ "$IS_RHEL" = true ]; then
  setup_gpg
  verify_using_rpm $RHEL_RPM_NAME
  verify_using_gpg $RHEL_TAR_NAME
  DEBUG=compass* npm run -w mongodb-compass verify-package-contents
elif [ "$IS_OSX" = true ]; then
  setup_gpg
  verify_using_gpg $OSX_ZIP_NAME
  verify_using_codesign $OSX_DMG_NAME
  DEBUG=compass* npm run -w mongodb-compass verify-package-contents
else
  echo "Unknown OS, failed to verify file signing"
  exit 1
fi
