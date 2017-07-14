const { expect } = require('chai');
const { Query } = require('../../');

describe('Query', () => {
  describe('#new', () => {
    const date = new Date('2017-01-01');
    const query = new Query({
      filter: "{ name: 'test' }",
      projection: '{ name: 1 }',
      sort: '{ name: -1 }',
      skip: 10,
      limit: 20,
      lastExecuted: date
    });

    it('defaults the _id attribute', () => {
      expect(query._id).to.not.equal(null);
    });

    it('defaults the isFavorite attribute', () => {
      expect(query.isFavorite).to.equal(false);
    });

    it('has a filter attribute', () => {
      expect(query.filter).to.equal("{ name: 'test' }");
    });

    it('has a projection attribute', () => {
      expect(query.projection).to.equal('{ name: 1 }');
    });

    it('has a sort attribute', () => {
      expect(query.sort).to.equal('{ name: -1 }');
    });

    it('has a skip attribute', () => {
      expect(query.skip).to.equal(10);
    });

    it('has a limit attribute', () => {
      expect(query.limit).to.equal(20);
    });

    it('has a lastExecuted attribute', () => {
      expect(query.lastExecuted).to.deep.equal(date);
    });
  });
});
