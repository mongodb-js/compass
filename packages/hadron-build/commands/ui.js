'use strict';

const Promise = require('bluebird');
const path = require('path');
const LessCache = require('less-cache');
const fs = require('fs-extra');
const read = Promise.promisify(fs.readFile);

const cli = require('mongodb-js-cli')('hadron-build:ui');
const abortIfError = cli.abortIfError.bind(cli);

exports.command = 'ui [options]';

exports.describe = 'Compile the app UI.';

const generateLessCache = (opts) => {
  /**
   * TODO (imlucas) Standardize to use CONFIG.
   */
  const appDir = path.join(opts.dir, 'src', 'app');
  const src = path.join(appDir, 'index.less');
  if (!fs.existsSync(src)) {
    return new Promise(function(resolve) {
      resolve();
    });
  }

  if (!opts.less_cache) {
    cli.warn('`less_cache` config option not set! skipping');
    return new Promise(function(resolve) {
      resolve();
    });
  }
  /**
   * TODO (imlucas) Ensure `opts.less_cache` and `src` exist.
   */
  const lessCache = new LessCache({
    cacheDir: opts.less_cache,
    resourcePath: appDir
  });

  return read(src, 'utf-8').then((contents) => lessCache.cssForFile(src, contents));
};

/**
 * @note Durran - quick hack fix to get help cache building. Can be
 * removed when we remove the help window.
 */
const generateLessHelpCache = (opts) => {
  /**
   * TODO (imlucas) Standardize to use CONFIG.
   */
  const appDir = path.join(opts.dir, 'src', 'app');
  const src = path.join(appDir, 'help.less');
  if (!fs.existsSync(src)) {
    return new Promise(function(resolve) {
      resolve();
    });
  }
  
  if (!opts.less_cache) {
    cli.warn('`less_cache` config option not set! skipping');
    return new Promise(function(resolve) {
      resolve();
    });
  }
  /**
   * TODO (imlucas) Ensure `opts.less_cache` and `src` exist.
   */
  const lessCache = new LessCache({
    cacheDir: opts.less_cache,
    resourcePath: appDir
  });

  return read(src, 'utf-8').then((contents) => lessCache.cssForFile(src, contents));
};

exports.builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd()
  },
  less_cache: {
    description: 'Path for less cache',
    default: path.join('src', 'app', '.compiled-less')
  }
};

exports.handler = (argv) => {
  cli.argv = argv;
  exports.tasks(argv).catch(abortIfError);
};

exports.tasks = (argv) => {
  return generateLessCache(argv).then(() => generateLessHelpCache(argv));
};
