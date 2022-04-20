import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  getDescription,
  GET_DESCRIPTION,
} from './description';

describe('drop/create index is visible module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, getDescription('new description'))).to.equal(
          'new description'
        );
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#getDescription', function () {
    it('returns the action', function () {
      expect(getDescription('new description w action')).to.deep.equal({
        type: GET_DESCRIPTION,
        description: 'new description w action',
      });
    });
  });
});
