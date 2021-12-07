#! /usr/bin/env node
'use strict';

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
  const {
    EVERGREEN_BUILD_VARIANT
  } = process.env;

  let {
    PWD,
    PATH
  } = process.env;

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
  if (PWD.startsWith('\/cygdrive\/c')) {
    // Change cygdrive from c to z without chanding rest of the path
    PWD = PWD.replace('\/cygdrive\/c', '\/cygdrive\/z');
    // we have to change the directory in the shell script we're outputting, not in this node process
    console.log(`cd "${PWD}";`);
    console.log('echo "Changed cwd on cygwin. Current working dir: $PWD";');
  }

  const pathsToPrepend = []

  // bash sets OSTYPE that we can check if it is 'cygwin'. But we're not in bash.
  if (process.platform === 'win32') {
    // NOTE lucas: for git-core addition, See
    // https://jira.mongodb.org/browse/COMPASS-4122
    pathsToPrepend.unshift('/cygdrive/c/wixtools/bin');
    pathsToPrepend.unshift(`${PWD}/.deps`);
    pathsToPrepend.unshift('/cygdrive/c/Program Files/Git/mingw32/libexec/git-core');
    printVar('APPDATA', 'Z:\\\;');
  } else {
    pathsToPrepend.unshift(`${PWD}/.deps/bin`);
  }

  if (EVERGREEN_BUILD_VARIANT === 'rhel') {
    // To build node modules on RHEL post electron 13 we need
    // a newer c++ compiler version, this adds it.
    // https://jira.mongodb.org/browse/COMPASS-5150
    pathsToPrepend.unshift('/opt/mongodbtoolchain/v3/bin');
  }

  PATH = maybePrependPaths(PATH, pathsToPrepend);
  printVar('PATH', PATH);

  const npmCacheDir = `${PWD}/.deps/.npm`;
  const npmTmpDir = `${PWD}/.deps/tmp`;

  printVar('ARTIFACTS_PATH', `${PWD}/.deps`);
  printVar('NPM_CACHE_DIR', npmCacheDir);
  printVar('NPM_TMP_DIR', npmTmpDir);

  // all npm var names need to be lowercase
  // see: https://docs.npmjs.com/cli/v7/using-npm/config#environment-variables
  printVar('npm_config_cache', npmCacheDir);
  // npm tmp is deprecated, but let's keep it around just in case
  printVar('npm_config_tmp', npmTmpDir);

  console.log('echo PATH is now "$PATH";');
  console.log('echo "All done";');
}

printCompassEnv();
