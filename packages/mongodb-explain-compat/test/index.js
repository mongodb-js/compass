/* global describe, it */
'use strict';
const convertExplainCompat = require('..');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name + '.json'), 'utf8'));
}

describe('convertExplainCompat', () => {
  it('maps stuff from the SBE format to the pre-SBE format (in1)', () => {
    assert.deepStrictEqual(convertExplainCompat(fixture('in1')), fixture('out1'));
  });
  it('maps stuff from the SBE format to the pre-SBE format (in2)', () => {
    assert.deepStrictEqual(convertExplainCompat(fixture('in2')), fixture('out2'));
  });
  it('keeps the old SBE format as-is', () => {
    assert.deepStrictEqual(convertExplainCompat(fixture('out1')), fixture('out1'));
  });

  describe('aggregations', function () {
    it('keeps old explain plan as-in', function () {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('in1.aggregate')),
        fixture('out1.aggregate')
      );
    });
    it('maps SBE format to pre-SBE format', function () {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('in2.aggregate')),
        fixture('out2.aggregate')
      );
    });
  });
});
