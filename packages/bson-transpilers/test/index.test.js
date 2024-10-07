'use strict';
const assert = require('assert');
const transpilers = require('../index');

const SAMPLE = transpilers.shell.java;

const VALID_OPTIONS = {
  uri: 'mongodb://localhost',
  database: 'test',
  collection: 'webscale',
};

const INVALID_JS = '{ ... }';
const VALID_JS = '({ a : 1 })';

describe('bson transpiler', function () {
  describe('#compileWithDriver', function () {
    it('does not compile internal options like "options"', function () {
      const result = SAMPLE.compileWithDriver({
        options: VALID_OPTIONS,
        filter: VALID_JS,
      });
      assert.ok(result.includes('webscale'));
    });

    it('does not compile internal options like "exportMode"', function () {
      const result = SAMPLE.compileWithDriver({
        options: VALID_OPTIONS,
        exportMode: INVALID_JS,
        filter: VALID_JS,
      });
      assert.ok(result.includes('webscale'));
    });
  });
});
