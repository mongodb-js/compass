#!/usr/bin/env bash

# This is a workaround for a node-gyp bug that has not fully been investigated
# due to problems reproducing it outside of CI environments (even though it
# occurs both in evergreen and github actions).
# Something seems to go wrong when node-gyp extracts the Node.js header tarball,
# on Windows specifically (this is most likely because node-tar treats
# the overwriting of existing files differently on Windows than on other OS --
# for good reasons, but still).
# The most likely cause of this issue is that node-gyp somehow extracts the
# same headers tarball twice, in parallel, in the same location, with race
# conditions in the tar extraction code leading to issues.
# The extraction result ends up in %LOCALAPPDATA%\node-gyp\Cache.
# Manually extracting the tarballs will solve this issue, so we're doing that
# here.
# For actually resolving the bug, we would probably need somebody with a local
# reproduction. However, it seems likely that other people will also encounter
# this issue, so there's also a good chance that this workaround will just
# not be needed with a future node-gyp version.

if [ x"$NODE_JS_VERSION" = x"" ]; then
  if node -v; then
    export NODE_JS_VERSION=$(node -p 'process.version.slice(1)')
  else
    echo "Need NODE_JS_VERSION to be set or Node.js to be installed for node-gyp bug workaround script"
    exit 1
  fi
fi

if [ x"$LOCALAPPDATA" = x"" ]; then
  echo "No LOCALAPPDATA set, ignoring node-gyp bug workaround script"
  exit
fi

set -x
CACHEDIR="$LOCALAPPDATA/node-gyp/Cache"
rm -rvf "$CACHEDIR"
mkdir -p "$CACHEDIR/$NODE_JS_VERSION"
cd "$CACHEDIR/$NODE_JS_VERSION"
curl -sSfLO "https://nodejs.org/download/release/v$NODE_JS_VERSION/node-v$NODE_JS_VERSION-headers.tar.gz"
tar --strip-components=1 -xvzf "node-v$NODE_JS_VERSION-headers.tar.gz"
for arch in x64 x86 arm64; do
  mkdir $arch
  pushd $arch
  curl -sSfLO "https://nodejs.org/download/release/v$NODE_JS_VERSION/win-$arch/node.lib" || echo "no $arch v$NODE_JS_VERSION .lib file"
  popd
done

# Finally, store the right installVersion value for current node-gyp versions
echo 9 > installVersion
