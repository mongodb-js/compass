#! /usr/bin/env bash

set -e

ARTIFACTS_DIR="packages/compass/dist"
echo "Verifying artifacts at $ARTIFACTS_DIR"
ls -l $ARTIFACTS_DIR

TMP_FILE=$(mktemp)
trap_handler() {
  local code=$?
  if [ $code -eq 0 ]; then
    echo "Verification successful"
  else
    echo "Verification failed with exit code $code"
    cat "$TMP_FILE"
  fi
  rm -f "$TMP_FILE"
  exit $code
}

trap trap_handler ERR EXIT

verify_using_gpg() {
  echo "Verifying $1 using gpg"
  gpg --verify $ARTIFACTS_DIR/$1.sig $ARTIFACTS_DIR/$1 > "$TMP_FILE" 2>&1
}

verify_using_powershell() {
  echo "Verifying $1 using powershell"
  powershell Get-AuthenticodeSignature -FilePath $ARTIFACTS_DIR/$1 > "$TMP_FILE" 2>&1
}

verify_using_codesign() {
  echo "Verifying $1 using codesign"
  codesign -dv --verbose=4 $ARTIFACTS_DIR/$1 > "$TMP_FILE" 2>&1
}

# For Windows
if [ "$IS_WINDOWS" = true ]; then
  verify_using_powershell $WINDOWS_EXE_NAME
  verify_using_powershell $WINDOWS_MSI_NAME

  echo "Skipping verification for Windows artifacts using gpg: $WINDOWS_ZIP_NAME, $WINDOWS_NUPKG_NAME"
  exit 0
fi


echo "Importing Compass public key"
curl https://pgp.mongodb.com/compass.asc | gpg --import > "$TMP_FILE" 2>&1

if [ "$IS_UBUNTU" = true ]; then
  verify_using_gpg $LINUX_DEB_NAME
  verify_using_gpg $LINUX_TAR_NAME
fi

if [ "$IS_RHEL" = true ]; then
  verify_using_gpg $RHEL_RPM_NAME
  verify_using_gpg $RHEL_TAR_NAME
fi

if [ "$IS_OSX" = true ]; then
  verify_using_gpg $OSX_ZIP_NAME
  verify_using_codesign $OSX_DMG_NAME
fi