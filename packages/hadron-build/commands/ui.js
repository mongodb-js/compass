'use strict';

const Promise = require('bluebird');
const path = require('path');
const LessCache = require('less-cache');
const fs = require('fs-extra');
const cli = require('mongodb-js-cli')('hadron-build:ui');
const abortIfError = cli.abortIfError.bind(cli);

exports.command = 'ui [options]';

exports.describe = 'Compile the app UI.';

let generateLessCache = (opts) => {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const src = path.join(appDir, 'index.less');

  const lessCache = new LessCache({
    cacheDir: opts.less_cache,
    resourcePath: appDir
  });

  return Promise.promisify(fs.readFile)(src, 'utf-8')
    .then((contents) => lessCache.cssForFile(src, contents));
};

exports.builder = {
  less_cache: {
    description: 'Path for less cache',
    default: 'src/app/compiled-less'
  }
};

exports.handler = (argv) => {
  cli.argv = argv;
  exports.task(argv).catch(abortIfError);
};

exports.tasks = (argv) => {
  return Promise.all([
    generateLessCache(argv)
  ]);
};
