import { expect } from 'chai';
import { RelationshipSideSchema } from './data-model-storage';

describe('data-model-storage', function () {
  context('RelationshipSideSchema', function () {
    it('handles cardinality=10', function () {
      // In COMPASS-9844 we removed the option of `10` for cardinality.
      // and we want to make sure that existing models with that value
      // are properly transformed to `100`.
      expect(
        RelationshipSideSchema.parse({
          ns: 'sample.movies',
          fields: [],
          cardinality: 10,
        }).cardinality
      ).to.equal(100);
    });
    it('does not transform any other value', function () {
      expect(
        RelationshipSideSchema.parse({
          ns: 'sample.movies',
          fields: [],
          cardinality: null,
        }).cardinality
      ).to.equal(null);
      expect(
        RelationshipSideSchema.parse({
          ns: 'sample.movies',
          fields: [],
          cardinality: 100,
        }).cardinality
      ).to.equal(100);
    });
  });
});
