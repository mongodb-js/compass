import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  nameChanged,
  NAME_CHANGED,
} from '../create-index/name';

describe('create index name module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, nameChanged('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#nameChanged', function () {
    it('returns the action', function () {
      expect(nameChanged('test')).to.deep.equal({
        type: NAME_CHANGED,
        name: 'test',
      });
    });
  });
});
