#!/usr/bin/env bash
if echo "$ARTIFACT_URL" | grep -q .zip; then
  curl -sSfL "$ARTIFACT_URL" > mongosh.zip
  export ARTIFACT_PATH="$PWD/mongosh.zip"
  (cd /cygdrive/c/Program\ Files/ && rm -rf mongosh && mkdir mongosh && cd mongosh && unzip "$ARTIFACT_PATH" && chmod -v +x bin/*)
  export PATH="/cygdrive/c/Program Files/mongosh/bin:$PATH"
else
  curl -sSfL "$ARTIFACT_URL" > mongosh.msi
  export ARTIFACT_PATH="$(cygpath -w "$PWD/mongosh.msi")"
  (msiexec /i "$ARTIFACT_PATH" ALLUSERS=1 /qn && cd /cygdrive/c/Program\ Files/mongosh && chmod +x *.exe)
  export PATH="/cygdrive/c/Program Files/mongosh:$PATH"
fi
mongosh --smokeTests
(cd /cygdrive/c/Program\ Files/ && rm -rf mongosh)
