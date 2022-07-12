import { expect } from 'chai';

import { FavoriteQuery } from '../../src/models';

describe('FavoriteQuery [Model]', function () {
  describe('#new', function () {
    const date = new Date('2017-01-01');
    const query = new FavoriteQuery({
      filter: { name: 'test' },
      project: { name: 1 },
      sort: { name: -1 },
      skip: 10,
      limit: 20,
      _lastExecuted: date,
      _name: 'Testing',
      _dateSaved: date,
    });

    it('defaults the _id attribute', function () {
      expect(query._id).to.not.equal(null);
    });

    it('has a filter attribute', function () {
      expect(query.filter).to.deep.equal({ name: 'test' });
    });

    it('has a project attribute', function () {
      expect(query.project).to.deep.equal({ name: 1 });
    });

    it('has a sort attribute', function () {
      expect(query.sort).to.deep.equal({ name: -1 });
    });

    it('has a skip attribute', function () {
      expect(query.skip).to.equal(10);
    });

    it('has a limit attribute', function () {
      expect(query.limit).to.equal(20);
    });

    it('has a _lastExecuted attribute', function () {
      expect(query._lastExecuted).to.deep.equal(date);
    });

    it('has a _dateSaved attribute', function () {
      expect(query._dateSaved).to.deep.equal(date);
    });

    it('has a _name attribute', function () {
      expect(query._name).to.equal('Testing');
    });
  });
});
