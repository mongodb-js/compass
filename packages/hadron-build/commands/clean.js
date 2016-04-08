'use strict';
/**
 * @see [Atom's clean-task.coffee](https://git.io/vaZLw)
 */
const path = require('path');
const del = require('del');
const async = require('async');
const abortIfError = require('../lib/abort-if-error');

var COMPILED_LESS = path.join('src', 'app', 'compiled-less');

exports.command = 'clean';

exports.describe = 'Remove generated directories.';

exports.builder = {};

exports.handler = function() {
  async.parallel(['dist/', 'node_modules/', COMPILED_LESS].map(function(p) {
    return function(cb) {
      del(p).then(cb.bind(null, null));
    };
  }), abortIfError);
};
