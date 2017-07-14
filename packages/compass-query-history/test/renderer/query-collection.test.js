const { expect } = require('chai');
const { Query, QueryCollection } = require('../../');

describe('QueryCollection', () => {
  describe('#add', () => {
    const collection = new QueryCollection();
    const query = new Query({ filter: "{ name: 'test' }" });

    before(() => {
      collection.add(query);
    });

    it('adds the query to the collection', () => {
      expect(collection.length).to.equal(1);
    });

    it('stores the model instance in the collection', () => {
      expect(collection.models[0]).to.deep.equal(query);
    });
  });
});
