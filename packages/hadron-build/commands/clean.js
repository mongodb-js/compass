'use strict';
/**
 * @see [Atom's clean-task.coffee](https://git.io/vaZLw)
 */
const _ = require('lodash');
const del = require('del');
const abortIfError = require('../lib/abort-if-error');
const ui = require('./ui');

exports.command = 'clean';

exports.describe = 'Remove generated directories.';

exports.builder = _.clone(ui.builder);

exports.handler = function(argv) {
  del([
    'dist/',
    'node_modules/',
    argv.less_cache,
    argv.template_cache
  ]).catch(abortIfError);
};
