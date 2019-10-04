import reducer, * as actions from './ns';

describe('ns [module]', () => {
  describe('#reducer', () => {
    context('when the action type is NS_CHANGED', () => {
      const action = actions.nsChanged('db.coll');

      it('returns the new state', () => {
        expect(reducer('', action)).to.equal('db.coll');
      });
    });

    context('when the action type is not NS_CHANGED', () => {
      it('returns the initial state', () => {
        expect(reducer('', {})).to.equal('');
      });
    });
  });

  describe('#nsChanged', () => {
    it('returns the action', () => {
      expect(actions.nsChanged('db.coll')).to.deep.equal({
        type: actions.NS_CHANGED,
        ns: 'db.coll'
      });
    });
  });
});
