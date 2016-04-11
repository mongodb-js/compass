'use strict';

const abortIfError = require('../lib/abort-if-error');
const templatizer = require('templatizer');
const path = require('path');
const LessCache = require('less-cache');
const fs = require('fs');

exports.command = 'ui [options]';

exports.describe = 'Compile the app UI';

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

exports.handler = function(argv) {
  exports.task(argv).catch(abortIfError);
};

exports.tasks = (argv) => {
  return Promise.all([
    exports.generateTemplateCache(argv),
    exports.generateLessCache(argv)
  ]);
};

exports.generateLessCache = (opts) => {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const src = path.join(appDir, 'index.less');

  const lessCache = new LessCache({
    cacheDir: opts.less_cache,
    resourcePath: appDir
  });

  const p = new Promise();
  fs.readFile(src, 'utf-8', (err, contents) => {
    if (err) p.reject(err);

    p.resolve(lessCache.cssForFile(src, contents));
  });
  return p;
};

/**
 * TODO (imlucas) Watch for changes if NODE_ENV === `development`?
 */
exports.generateTemplateCache = function(opts, done) {
  var appdir = path.join(process.cwd(), 'src', 'app');
  templatizer(appdir, opts.template_cache, done);
};
