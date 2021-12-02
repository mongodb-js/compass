'use strict';

const VAR_NAMES = [
  'CI',
  'EVERGREEN',
  'EVERGREEN_AUTHOR',
  'EVERGREEN_BRANCH_NAME',
  'EVERGREEN_BUILD_ID',
  'EVERGREEN_BUILD_VARIANT',
  'EVERGREEN_EXECUTION',
  'EVERGREEN_IS_PATCH',
  'EVERGREEN_PROJECT',
  'EVERGREEN_REVISION',
  'EVERGREEN_TASK_ID',
  'EVERGREEN_TASK_NAME',
  'EVERGREEN_TASK_URL',
  'EVERGREEN_VERSION_ID',
  'EVERGREEN_WORKDIR',
  'HADRON_METRICS_BUGSNAG_KEY',
  'HADRON_METRICS_INTERCOM_APP_ID',
  'HADRON_METRICS_STITCH_APP_ID',
  'HADRON_METRICS_SEGMENT_API_KEY',
  'NODE_JS_VERSION',
  'NPM_VERSION',

  // PATH gets modified below
  'PATH',

  // these will be calculated below after tweaking the working dir
  'ARTIFACTS_PATH',
  'NPM_CACHE_DIR',
  'NPM_TMP_DIR',
  'npm_config_cache',
  'npm_config_tmp'
];

console.log(`echo "PATH in node : ${process.env.PATH}";`);
console.log('echo "PATH in shell: $PATH";');

console.log(`echo "process.cwd(): ${process.cwd()}";`);
console.log('echo "pwd in shell : $PWD";');

process.env.CI = '1';
process.env.EVERGREEN = '1';

let pwd = process.cwd();

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
if (pwd.startsWith('\/cygdrive\/c')) {
  // Change cygdrive from c to z without chanding rest of the path
  pwd = pwd.replace('\/cygdrive\/c', '\/cygdrive\/z');
  // we have to change the directory in the shell script we're outputting, not in this node process
  console.log(`cd ${pwd};`);
  console.log('echo "Changed cwd on cygwin. Current working dir: \\$(pwd)";');
}

if (process.env.OSTYPE === 'cygwin') {
  const PATH = process.env.PATH;
  // NOTE lucas: for git-core addition, See
  // https://jira.mongodb.org/browse/COMPASS-4122
  process.env.PATH = `/cygdrive/c/Program Files/Git/mingw32/libexec/git-core/:$(pwd)/.deps:/cygdrive/c/wixtools/bin/:${PATH}`
  process.env.APPDATA = 'Z:\\\;';
} else {
  const PATH = process.env.PATH;
  process.env.PATH = `${pwd}/.deps/bin:${PATH}`;
}

if (process.env.EVERGREEN_BUILD_VARIANT == 'rhel') {
  // To build node modules on RHEL post electron 13 we need
  // a newer c++ compiler version, this adds it.
  // https://jira.mongodb.org/browse/COMPASS-5150
  const PATH = process.env.PATH;
  process.env.PATH = `/opt/mongodbtoolchain/v3/bin:${PATH}`;
}


process.env.ARTIFACTS_PATH = `${pwd}/.deps`;
process.env.NPM_CACHE_DIR = `${pwd}/.deps/.npm`;
process.env.NPM_TMP_DIR = `${pwd}/.deps/tmp`;

// npm configuration
// all var names need to be lowercase
// see: https://docs.npmjs.com/cli/v7/using-npm/config#environment-variables
process.env.npm_config_cache = process.env.NPM_CACHE_DIR;
// npm tmp is deprecated, but let's keep it around just in case
process.env.npm_config_tmp = process.env.NPM_TMP_DIR;

function printCompassEnv() {
  for (const name of VAR_NAMES) {
    console.log(`export ${name}=${process.env[name] || ''};`);
  }

  console.log('echo "PATH at the end: $PATH";');
  console.log('echo "pwd at the end : $PWD";');
  console.log('echo "node -v";');
  console.log('node -v;');
  console.log('echo "npm -v";');
  console.log('npm -v;');
}

printCompassEnv();