'use strict';

const Promise = require('bluebird');
const templatizer = Promise.promisify(require('templatizer'));
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

let generateTemplateCache = function(opts) {
  var appdir = path.join(process.cwd(), 'src', 'app');
  return templatizer(appdir, opts.template_cache);
};

exports.builder = {
  template_cache: {
    description: 'Path for template cache',
    default: 'src/app/templates.js'
  },
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
    generateTemplateCache(argv),
    generateLessCache(argv)
  ]);
};
