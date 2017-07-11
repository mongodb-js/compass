/* eslint no-unused-expressions: 0 */
const { expect } = require('chai');
const { MEASUREMENT_ENUM } = require('../../src/internal-packages/chart/lib/constants');
const Aliaser = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/aliaser');
const constructEncodingSegment = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/segment-encoding');

describe('Aggregation Pipeline Builder', function() {
  describe('Encoding Segment', function() {
    let aliaser;

    beforeEach(function() {
      aliaser = new Aliaser();
    });
    it('returns an empty array if no channels are encoded', function() {
      const state = {};
      const result = constructEncodingSegment(state, aliaser);
      expect(aliaser.aliases).to.be.empty;
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
    it('maps aliases back to channels in correct order', function() {
      const state = {
        channels: {
          x: {field: 'foo', type: MEASUREMENT_ENUM.QUANTITATIVE},
          color: {field: 'bar', type: MEASUREMENT_ENUM.QUANTITATIVE}
        }
      };
      aliaser.assignUniqueAlias('foo', 'x');
      aliaser.assignUniqueAlias('bar', 'color');
      const result = constructEncodingSegment(state, aliaser);
      expect(aliaser.aliases).to.have.all.keys(['x_foo', 'color_bar']);
      expect(aliaser.aliases.x_foo).to.be.equal('__alias_0');
      expect(aliaser.aliases.color_bar).to.be.equal('__alias_1');
      expect(result).to.be.an('array');
      expect(result[0].$project).to.have.keys(['_id', 'x', 'color']);
      expect(result[0].$project.x).to.be.equal('$__alias_0');
      expect(result[0].$project.color).to.be.equal('$__alias_1');
      expect(result[0].$project._id).to.be.equal(0);
    });
    it('handles non-aliased fields correctly', function() {
      const state = {
        channels: {
          x: {field: 'foo', type: MEASUREMENT_ENUM.QUANTITATIVE},
          color: {field: 'bar', type: MEASUREMENT_ENUM.QUANTITATIVE}
        }
      };
      aliaser.assignUniqueAlias('foo', 'x');
      const result = constructEncodingSegment(state, aliaser);
      expect(aliaser.aliases).to.have.all.keys(['x_foo']);
      expect(aliaser.aliases.x_foo).to.be.equal('__alias_0');
      expect(result).to.be.an('array');
      expect(result[0].$project).to.have.keys(['_id', 'x', 'color']);
      expect(result[0].$project.x).to.be.equal('$__alias_0');
      expect(result[0].$project.color).to.be.equal('$bar');
      expect(result[0].$project._id).to.be.equal(0);
    });
  });
});
