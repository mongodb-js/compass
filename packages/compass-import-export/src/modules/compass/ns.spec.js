import reducer, * as actions from './ns';
import { expect } from 'chai';

describe('ns [module]', function () {
  describe('#reducer', function () {
    context('when the action type is NS_CHANGED', function () {
      const action = actions.nsChanged('db.coll');

      it('returns the new state', function () {
        expect(reducer('', action)).to.equal('db.coll');
      });
    });

    context('when the action type is not NS_CHANGED', function () {
      it('returns the initial state', function () {
        expect(reducer('', {})).to.equal('');
      });
    });
  });

  describe('#nsChanged', function () {
    it('returns the action', function () {
      expect(actions.nsChanged('db.coll')).to.deep.equal({
        type: actions.NS_CHANGED,
        ns: 'db.coll',
      });
    });
  });
});
