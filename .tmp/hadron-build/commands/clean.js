'use strict';
/**
 * @see [Atom's clean-task.coffee](https://git.io/vaZLw)
 */
const _ = require('lodash');
const del = require('del');
const cli = require('mongodb-js-cli')('hadron-build:clean');
const ui = require('./ui');

exports.command = 'clean';

exports.describe = 'Remove generated directories.';

exports.builder = _.clone(ui.builder);

exports.tasks = (argv) => {
  return del([
    'dist/',
    'node_modules/',
    argv.less_cache
  ]);
};

exports.handler = (argv) => {
  exports.tasks(argv)
    .catch((err) => cli.abortIfError(err));
};
