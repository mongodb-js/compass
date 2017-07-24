const { expect } = require('chai');

const ChartBuilder = require('../../src/internal-packages/chart/lib/components/chart-builder');
const {
  ARRAY_REDUCTION_TYPES,
  CHART_CHANNEL_ENUM
} = require('../../src/internal-packages/chart/lib/constants');

const UP_TO_5_TAGS_SCHEMA_FIELD = {
  dimensionality: 1,
  name: 'up_to_5_tags',
  path: 'up_to_5_tags',
  type: 'Array'
};

const COORDINATES_ARRAY_FIELD = {
  dimensionality: 2,
  name: 'coordinates_array',
  path: 'coordinates_array',
  type: 'Array'
};

const HIGHSCORE_ARRAY_FIELD = {
  dimensionality: 1,
  name: 'highscores',
  path: 'array_of_subdocs_with_number_arrays.highscores',
  type: 'Array'
};

describe('ChartBuilder', () => {
  context('when calling _generateReductionAxisLabel on single reductions', () => {
    it('produces label for an unwind reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        dimensionality: 2,
        field: COORDINATES_ARRAY_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.UNWIND,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`unwind array '${COORDINATES_ARRAY_FIELD.name}'`);
    });

    it('produces label for an array length reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        dimensionality: 2,
        field: COORDINATES_ARRAY_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.LENGTH,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`length of array '${COORDINATES_ARRAY_FIELD.name}'`);
    });

    it('produces label for an array element by index reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        dimensionality: 2,
        field: COORDINATES_ARRAY_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.INDEX,
        arguments: [2]
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`3rd element of array '${COORDINATES_ARRAY_FIELD.name}'`);
    });

    it('produces label for max number of an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: HIGHSCORE_ARRAY_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.MAX,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`maximum of numeric array '${HIGHSCORE_ARRAY_FIELD.name}'`);
    });

    it('produces label for min number of an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: HIGHSCORE_ARRAY_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.MIN,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`minimum of numeric array '${HIGHSCORE_ARRAY_FIELD.name}'`);
    });

    it('produces label for the mean of an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: HIGHSCORE_ARRAY_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.MEAN,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`mean of numeric array '${HIGHSCORE_ARRAY_FIELD.name}'`);
    });

    it('produces label for the sum of an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: HIGHSCORE_ARRAY_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.SUM,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`sum of numeric array '${HIGHSCORE_ARRAY_FIELD.name}'`);
    });

    it('produces label for maximum length of string in an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: UP_TO_5_TAGS_SCHEMA_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.MAX_LENGTH,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`length of longest string in array '${UP_TO_5_TAGS_SCHEMA_FIELD.name}'`);
    });

    it('produces label for minimum length of string in an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: UP_TO_5_TAGS_SCHEMA_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.MIN_LENGTH,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`length of shortest string in array '${UP_TO_5_TAGS_SCHEMA_FIELD.name}'`);
    });

    it('produces label for concatenation of strings in an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: UP_TO_5_TAGS_SCHEMA_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.CONCAT,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`concatenation of array '${UP_TO_5_TAGS_SCHEMA_FIELD.name}'`);
    });

    it('produces label for longest string in an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: UP_TO_5_TAGS_SCHEMA_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.LONGEST,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`longest string in array '${UP_TO_5_TAGS_SCHEMA_FIELD.name}'`);
    });

    it('produces label for shortest string in an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: UP_TO_5_TAGS_SCHEMA_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.SHORTEST,
        arguments: []
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`shortest string in array '${UP_TO_5_TAGS_SCHEMA_FIELD.name}'`);
    });

    it('produces label for existence of value in an array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: UP_TO_5_TAGS_SCHEMA_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.EXISTENCE_OF_VALUE,
        arguments: ['foo']
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`existence of string 'foo' in array '${UP_TO_5_TAGS_SCHEMA_FIELD.name}'`);
    });

    it('produces label for count of occurence in array reduction', () => {
      const reduction = {[CHART_CHANNEL_ENUM.X]: [{
        field: UP_TO_5_TAGS_SCHEMA_FIELD.name,
        type: ARRAY_REDUCTION_TYPES.COUNT_OF_OCCURRENCES,
        arguments: ['foo']
      }]};

      const label = ChartBuilder._generateReductionAxisLabel(reduction[CHART_CHANNEL_ENUM.X]);
      expect(label).to.be.equal(`count of occurrence of string 'foo' in array '${UP_TO_5_TAGS_SCHEMA_FIELD.name}'`);
    });
  });
});
