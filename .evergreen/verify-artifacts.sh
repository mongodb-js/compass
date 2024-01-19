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

# For Windows
if [ "$IS_WINDOWS" = true ]; then
  echo "Verifying $WINDOWS_EXE_NAME"
  powershell Get-AuthenticodeSignature -FilePath $ARTIFACTS_DIR/$WINDOWS_EXE_NAME > "$TMP_FILE" 2>&1

  echo "Verifying $WINDOWS_MSI_NAME"
  powershell Get-AuthenticodeSignature -FilePath $ARTIFACTS_DIR/$WINDOWS_MSI_NAME > "$TMP_FILE" 2>&1

  echo "Skipping verification for Windows artifacts using gpg: $WINDOWS_ZIP_NAME, $WINDOWS_NUPKG_NAME"
  exit 0
fi


echo "Importing Compass public key"
curl https://pgp.mongodb.com/compass.asc | gpg --import > "$TMP_FILE" 2>&1

if [ "$IS_UBUNTU" = true ]; then
  echo "Verifying $LINUX_DEB_NAME using gpg"
  gpg --verify $ARTIFACTS_DIR/$LINUX_DEB_NAME.sig $ARTIFACTS_DIR/$LINUX_DEB_NAME > "$TMP_FILE" 2>&1

  echo "Verifying $LINUX_TAR_NAME using gpg"
  gpg --verify $ARTIFACTS_DIR/$LINUX_TAR_NAME.sig $ARTIFACTS_DIR/$LINUX_TAR_NAME > "$TMP_FILE" 2>&1
fi

if [ "$IS_RHEL" = true ]; then
  echo "Verifying $RHEL_RPM_NAME using gpg"
  gpg --verify $ARTIFACTS_DIR/$RHEL_RPM_NAME.sig $ARTIFACTS_DIR/$RHEL_RPM_NAME > "$TMP_FILE" 2>&1

  echo "Verifying $RHEL_TAR_NAME using gpg"
  gpg --verify $ARTIFACTS_DIR/$RHEL_TAR_NAME.sig $ARTIFACTS_DIR/$RHEL_TAR_NAME > "$TMP_FILE" 2>&1
fi

if [ "$IS_OSX" = true ]; then
  echo "Verifying $OSX_ZIP_NAME using gpg"
  gpg --verify $ARTIFACTS_DIR/$OSX_ZIP_NAME.sig $ARTIFACTS_DIR/$OSX_ZIP_NAME > "$TMP_FILE" 2>&1

  echo "Verifying $OSX_DMG_NAME using codesign"
  codesign -dv --verbose=4 $ARTIFACTS_DIR/$OSX_DMG_NAME > "$TMP_FILE" 2>&1
fi