import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changeDescription,
  CHANGE_DESCRIPTION
} from './description';

describe('sidebar description', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, changeDescription('new description'))).to.equal('new description');
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeDescription', function () {
    it('returns the action', function () {
      expect(changeDescription('new description w action')).to.deep.equal({
        type: CHANGE_DESCRIPTION,
        description: 'new description w action'
      });
    });
  });
});
