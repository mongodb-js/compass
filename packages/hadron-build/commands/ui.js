'use strict';

const async = require('async');
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
  async.series(exports.tasks(argv), function(err) {
    abortIfError(err);
    process.exit(0);
  });
};

exports.tasks = function(argv) {
  return [
    exports.generateTemplateCache.bind(null, argv),
    exports.generateLessCache.bind(null, argv)
  ];
};

exports.generateLessCache = function(opts, done) {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const src = path.join(appDir, 'index.less');

  const lessCache = new LessCache({
    cacheDir: opts.less_cache,
    resourcePath: appDir
  });

  fs.readFile(src, 'utf-8', function(err, contents) {
    if (err) {
      return done(err);
    }
    lessCache.cssForFile(src, contents);
    done();
  });
};

/**
 * TODO (imlucas) Watch for changes?
 */
exports.generateTemplateCache = function(opts, done) {
  var appdir = path.join(process.cwd(), 'src', 'app');
  templatizer(appdir, opts.template_cache, done);
};
