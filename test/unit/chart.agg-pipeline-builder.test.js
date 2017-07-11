/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const constructPipeline = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');
const {
  MEASUREMENT_ENUM,
  AGGREGATE_FUNCTION_ENUM,
  ARRAY_REDUCTION_TYPES
} = require('../../src/internal-packages/chart/lib/constants');
const ChartStore = require('../../src/internal-packages/chart/lib/store');

// const debug = require('debug')('mongodb-compass:charts:test:array-reduction');

/**
 * these tests are just some integration spot-checks, e.g. that multiple segments
 * are combined to a single array. All segments are tested individually in their
 * respective test files, i.e. ./chart.agg-pipeline-builder.<segment>.test.js
 */
describe('Aggregation Pipeline Builder', function() {
  beforeEach(function() {
    ChartStore._resetChart();
  });
  context('using the default chart state', function() {
    const state = ChartStore.getInitialState();
    it('returns a pipeline with a $sample stage of 1000 documents', function() {
      const pipeline = constructPipeline(state);
      expect(pipeline).to.be.an('array');
      expect(pipeline).to.have.lengthOf(1);
      expect(pipeline[0]).to.be.deep.equal({
        $sample: {size: 1000}
      });
    });
  });
  context('when encoding a single field without aggregations', function() {
    const state = {
      channels: {
        x: {field: 'myField', type: MEASUREMENT_ENUM.NOMINAL}
      }
    };
    it('returns a pipeline with an encoding segment', function() {
      const pipeline = constructPipeline(state);
      expect(pipeline).to.be.an('array');
      expect(pipeline).to.have.lengthOf(1);
      expect(pipeline[0]).to.be.deep.equal({
        $project: {x: '$myField', _id: 0}
      });
    });
  });
  context('when encoding a single field with an array reduction', function() {
    const state = {
      reductions: {
        x: [
          {field: 'myField', type: ARRAY_REDUCTION_TYPES.UNWIND}
        ]
      },
      channels: {
        x: {field: 'myField', type: MEASUREMENT_ENUM.NOMINAL}
      }
    };
    it('returns a pipeline with a reduction and encoding segment', function() {
      const pipeline = constructPipeline(state);
      expect(pipeline).to.be.an('array');
      expect(pipeline).to.have.lengthOf(2);
      expect(pipeline[0]).to.be.deep.equal({
        $unwind: '$myField'
      });
      expect(pipeline[1]).to.be.deep.equal({
        $project: {x: '$myField', _id: 0}
      });
    });
  });
  context('when encoding a single field with an unwind reduction', function() {
    const state = {
      reductions: {
        x: [
          {field: 'myField', type: ARRAY_REDUCTION_TYPES.MAX}
        ]
      },
      channels: {
        x: {field: 'myField', type: MEASUREMENT_ENUM.QUANTITATIVE}
      }
    };
    it('returns a pipeline with a reduction and encoding segment', function() {
      const pipeline = constructPipeline(state);
      expect(pipeline).to.be.an('array');
      expect(pipeline).to.have.lengthOf(2);
      expect(pipeline[0]).to.be.deep.equal({
        $addFields: {'__alias_0': {$max: '$myField'}}
      });
      expect(pipeline[1]).to.be.deep.equal({
        $project: {x: '$__alias_0', _id: 0}
      });
    });
  });
  context('when encoding a single field with aggregations', function() {
    const state = {
      channels: {
        x: {
          field: 'myField',
          type: MEASUREMENT_ENUM.QUANTITATIVE,
          aggregate: AGGREGATE_FUNCTION_ENUM.MAX
        }
      }
    };
    it('returns a pipeline with an aggregation and encoding segment', function() {
      const pipeline = constructPipeline(state);
      expect(pipeline).to.be.an('array');
      expect(pipeline).to.have.lengthOf(3);
      expect(pipeline[0]).to.be.deep.equal({
        $group: {_id: {}, __alias_0: {$max: '$myField'}}
      });
      expect(pipeline[1]).to.be.deep.equal({
        $project: {_id: 0, __alias_0: 1}
      });
      expect(pipeline[2]).to.be.deep.equal({
        $project: {x: '$__alias_0', _id: 0}
      });
    });
  });
});
