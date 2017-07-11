/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const AggPipelineBuilder = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');

// const debug = require('debug')('mongodb-compass:charts:test:array-reduction');

const aggBuilder = new AggPipelineBuilder();

describe('Aggregation Pipeline Builder', function() {
  beforeEach(function() {
    aggBuilder._reset();
  });
});
