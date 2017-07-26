const { expect } = require('chai');
const { RecentQuery } = require('../../');

describe('RecentQuery', () => {
  describe('#new', () => {
    const date = new Date('2017-01-01');
    const query = new RecentQuery({
      filter: { name: 'test' },
      project: { name: 1 },
      sort: { name: -1 },
      skip: 10,
      limit: 20,
      _lastExecuted: date
    });

    it('defaults the _id attribute', () => {
      expect(query._id).to.not.equal(null);
    });

    it('has a filter attribute', () => {
      expect(query.filter).to.deep.equal({ name: 'test' });
    });

    it('has a project attribute', () => {
      expect(query.project).to.deep.equal({ name: 1 });
    });

    it('has a sort attribute', () => {
      expect(query.sort).to.deep.equal({ name: -1 });
    });

    it('has a skip attribute', () => {
      expect(query.skip).to.equal(10);
    });

    it('has a limit attribute', () => {
      expect(query.limit).to.equal(20);
    });

    it('has a _lastExecuted attribute', () => {
      expect(query._lastExecuted).to.deep.equal(date);
    });
  });
});
