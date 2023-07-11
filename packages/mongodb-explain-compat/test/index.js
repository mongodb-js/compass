/* global describe, it */
'use strict';
const convertExplainCompat = require('..');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function fixture(name) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', name + '.json'), 'utf8')
  );
}

describe('convertExplainCompat', () => {
  it('maps stuff from the SBE format to the pre-SBE format (in1)', () => {
    assert.deepStrictEqual(
      convertExplainCompat(fixture('in1')),
      fixture('out1')
    );
  });
  it('maps stuff from the SBE format to the pre-SBE format (in2)', () => {
    assert.deepStrictEqual(
      convertExplainCompat(fixture('in2')),
      fixture('out2')
    );
  });
  it('keeps the old SBE format as-is', () => {
    assert.deepStrictEqual(
      convertExplainCompat(fixture('in4')),
      fixture('in4')
    );
  });

  describe('Sharded Aggregations', function () {
    it('keeps the classic for as-is - with stages', () => {
      assert.deepStrictEqual(
        convertExplainCompat(
          fixture('sharded-aggregate-with-stages.classic.in')
        ),
        fixture('sharded-aggregate-with-stages.classic.out')
      );
    });
    it('keeps the classic for as-is - without stages', () => {
      assert.deepStrictEqual(
        convertExplainCompat(
          fixture('sharded-aggregate-without-stages.classic.in')
        ),
        fixture('sharded-aggregate-without-stages.classic.out')
      );
    });
    it('maps the SBE format to pre-SBE - with stages', () => {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('sharded-aggregate-with-stages.sbe.in')),
        fixture('sharded-aggregate-with-stages.sbe.out')
      );
    });
    it('maps the SBE format to pre-SBE - without stages', () => {
      assert.deepStrictEqual(
        convertExplainCompat(
          fixture('sharded-aggregate-without-stages.sbe.in')
        ),
        fixture('sharded-aggregate-without-stages.sbe.out')
      );
    });
  });
  describe('Unsharded Aggregations', function () {
    it('keeps the classic plan as-is', function () {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('unsharded-aggregate.classic.in')),
        fixture('unsharded-aggregate.classic.out')
      );
    });
    it('maps the SBE format to pre-SBE', function () {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('unsharded-aggregate.sbe.in')),
        fixture('unsharded-aggregate.sbe.out')
      );
    });
  });

  describe('Sharded Queries', function () {
    it('keeps the classic format as-is', () => {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('sharded-find.classic.in')),
        fixture('sharded-find.classic.out')
      );
    });
    it('maps the SBE format to pre-SBE', () => {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('sharded-find.sbe.in')),
        fixture('sharded-find.sbe.out')
      );
    });
  });
  describe('Unsharded Queries', function () {
    it('keeps the classic format as-is', () => {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('unsharded-find.classic.in')),
        fixture('unsharded-find.classic.out')
      );
    });
    it('maps the SBE format to pre-SBE', () => {
      assert.deepStrictEqual(
        convertExplainCompat(fixture('unsharded-find.sbe.in')),
        fixture('unsharded-find.sbe.out')
      );
    });
  });

  describe('explain mode "queryPlanner"', function () {
    it('should work without failing', function () {
      assert.doesNotThrow(() => {
        convertExplainCompat(fixture('query-planner-only'));
      });
    });
  });
});
