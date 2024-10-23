#! /usr/bin/env node
'use strict';

/*
This script writes a bash script that can be eval()'d in evergreen to modify the
environment with some calculated env vars.
*/

function maybePrependPaths(path, paths) {
  const prefix = `${paths.join(':')}:`;
  if (path.startsWith(prefix)) {
    return path;
  }
  return `${prefix}${path}`;
}

function printVar(name, value) {
  console.log(`export ${name}="${value || ''}";`);
}

function printCompassEnv() {
  let {
    // This is an env var set in bash that we exported in print-compass-env.sh
    OSTYPE
  } = process.env;

  // We have to operate on bash's PATH env var where the c:\ style paths have
  // been converted to /cygdrive/c style. BUT bash passes unaltered paths to
  // subprocesses as PATH even if we export the modified PATH in bash. And
  // that's why there's a hack in print-compass-env.sh to alias bash's altered
  // PATH to BASHPATH.
  let PATH = process.env.BASHPATH || process.env.PATH;

  const originalPWD = process.env.PWD;
  let newPWD = originalPWD;

  /*
  # XXX: This is a workaround for the issues we are getting in Evergreen
  # ci with the way cygwin drives are set up and linked and the Node.js
  # bug that we can't really do anything about.
  #
  # For more context, see:
  # - https://github.com/nodejs/node/issues/34866
  # - https://github.com/mongodb-js/compass/pull/2403
  # - https://github.com/mongodb-js/compass/pull/2410
  */
  if (originalPWD.startsWith('/cygdrive/c')) {
    // Change cygdrive from c to z without chanding rest of the path
    newPWD = originalPWD.replace('/cygdrive/c', '/cygdrive/z');
    // we have to change the directory in the shell script we're outputting, not in this node process
    console.log(`cd "${newPWD}";`);
    console.log('echo "Changed cwd on cygwin. Current working dir: $PWD";');
  }

  const pathsToPrepend = [];

  if (OSTYPE === 'cygwin') {
    // NOTE lucas: for git-core addition, See
    // https://jira.mongodb.org/browse/COMPASS-4122
    pathsToPrepend.unshift('/cygdrive/c/wixtools/bin');
    pathsToPrepend.unshift(`${newPWD}/.deps`);
    pathsToPrepend.unshift(
      '/cygdrive/c/Program Files/Git/mingw32/libexec/git-core'
    );
    printVar('APPDATA', 'Z:\\;');
  } else {
    pathsToPrepend.unshift(`${newPWD}/.deps/bin`);
  }

  if (process.env.PLATFORM === 'linux') {
    // To build node modules on linux post electron 13 we need a newer c++
    // compiler version and at least python v3.9, this adds it.
    // https://jira.mongodb.org/browse/COMPASS-5150
    pathsToPrepend.unshift('/opt/mongodbtoolchain/v4/bin');
  }

  PATH = maybePrependPaths(PATH, pathsToPrepend);
  printVar('PATH', PATH);

  const npmCacheDir = `${newPWD}/.deps/.npm`;
  const npmTmpDir = `${newPWD}/.deps/tmp`;

  printVar('ARTIFACTS_PATH', `${newPWD}/.deps`);
  printVar('NPM_CACHE_DIR', npmCacheDir);
  printVar('NPM_TMP_DIR', npmTmpDir);

  // all npm var names need to be lowercase
  // see: https://docs.npmjs.com/cli/v7/using-npm/config#environment-variables
  printVar('npm_config_cache', npmCacheDir);
  // npm tmp is deprecated, but let's keep it around just in case
  printVar('npm_config_tmp', npmTmpDir);
  // Also set in our .npmrc but that does not get picked up in the preinstall script.
  printVar('npm_config_registry', 'https://registry.npmjs.org/');

  printVar('PLATFORM', process.env.PLATFORM);
  printVar('ARCH', process.env.ARCH);
  printVar('IS_WINDOWS', process.env.IS_WINDOWS);
  printVar('IS_OSX', process.env.IS_OSX);
  printVar('IS_LINUX', process.env.IS_LINUX);
  printVar('IS_RHEL', process.env.IS_RHEL);
  printVar('IS_UBUNTU', process.env.IS_UBUNTU);
  printVar('DEBUG', process.env.DEBUG);
  printVar(
    'MONGODB_VERSION',
    process.env.MONGODB_VERSION || process.env.MONGODB_DEFAULT_VERSION
  );
  printVar('DEV_VERSION_IDENTIFIER', process.env.DEV_VERSION_IDENTIFIER);
  printVar('EVERGREEN_REVISION', process.env.EVERGREEN_REVISION);
  printVar(
    'EVERGREEN_REVISION_ORDER_ID',
    process.env.EVERGREEN_REVISION_ORDER_ID
  );

  // https://jira.mongodb.org/browse/NODE-6320
  printVar('GYP_DEFINES', `kerberos_use_rtld=${process.platform === 'linux'}`);
}

printCompassEnv();
