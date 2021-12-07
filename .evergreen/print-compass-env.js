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
    OSTYPE,
    EVERGREEN_BUILD_VARIANT
  } = process.env;


  let {
    PATH
  } = process.env;

  const originalPWD = process.env.PWD;

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
  if (originalPWD.startsWith('\/cygdrive\/c')) {
    // Change cygdrive from c to z without chanding rest of the path
    const newPWD = originalPWD.replace('\/cygdrive\/c', '\/cygdrive\/z');
    // we have to change the directory in the shell script we're outputting, not in this node process
    console.log(`cd "${newPWD}";`);
    console.log('echo "Changed cwd on cygwin. Current working dir: $PWD";');
  }

  const pathsToPrepend = []

  if (OSTYPE === 'cygwin') {
    // NOTE lucas: for git-core addition, See
    // https://jira.mongodb.org/browse/COMPASS-4122
    pathsToPrepend.unshift('/cygdrive/c/wixtools/bin');
    pathsToPrepend.unshift(`${originalPWD}/.deps`);
    pathsToPrepend.unshift('/cygdrive/c/Program Files/Git/mingw32/libexec/git-core');
    printVar('APPDATA', 'Z:\\\;');
  } else {
    pathsToPrepend.unshift(`${originalPWD}/.deps/bin`);
  }

  if (EVERGREEN_BUILD_VARIANT === 'rhel') {
    // To build node modules on RHEL post electron 13 we need
    // a newer c++ compiler version, this adds it.
    // https://jira.mongodb.org/browse/COMPASS-5150
    pathsToPrepend.unshift('/opt/mongodbtoolchain/v3/bin');
  }

  PATH = maybePrependPaths(PATH, pathsToPrepend);
  printVar('PATH', PATH);

  const npmCacheDir = `${originalPWD}/.deps/.npm`;
  const npmTmpDir = `${originalPWD}/.deps/tmp`;

  printVar('ARTIFACTS_PATH', `${originalPWD}/.deps`);
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

// maybe PATH has to be separated with ; and not : ?
// maybe \ has to be \\ ?
// double-check OSTYPE?
//[2021/12/06 18:06:20.314] PATH is now C:\data\mci\d9be3f7e69135298a80e9843673bea54\src/.deps/bin:C:\cygwin\usr\local\bin;C:\cygwin\bin;C:\Python27;C:\Python27\Scripts;C:\Python310\Scripts;C:\Python310;C:\Users\Administrator\AppData\Roaming\ActiveState\bin;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0;C:\Windows\System32\OpenSSH;C:\Program Files\Amazon\cfn-bootstrap;C:\ProgramData\chocolatey\bin;C:\ProgramData\chocolatey\bin;C:\Program Files\dotnet;C:\Program Files\Git\cmd;C:\Python27;C:\Python27\Scripts;C:\openssl\bin;C:\sasl\bin;C:\snmp\bin;C:\go\bin;C:\Program Files\Git\bin;C:\Program Files\nodejs;C:\Perl64\bin;C:\curl\dlls;C:\Program Files\nodejs;C:\Users\mci-exec\AppData\Local\Microsoft\WindowsApps;C:\Users\mci-exec\.dotnet\tools;C:\ProgramData\chocolatey\lib\mingw\tools\install\mingw64\bin;C:\Users\Administrator\AppData\Roaming\npm;C:\go\bin;C:\Windows\Sysnative;C:\mingw-w64\x86_64-4.9.1-posix-seh-rt_v3-rev1\mingw64\bin