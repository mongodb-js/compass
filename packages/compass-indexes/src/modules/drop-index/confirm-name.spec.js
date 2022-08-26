import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  nameChanged,
  NAME_CHANGED,
} from '../drop-index/name';

describe('drop index name module', function () {
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

  describe('#changeIndexName', function () {
    it('returns the action', function () {
      expect(nameChanged('test')).to.deep.equal({
        type: NAME_CHANGED,
        name: 'test',
      });
    });
  });
});
