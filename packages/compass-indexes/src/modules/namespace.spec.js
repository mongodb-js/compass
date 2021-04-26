import reducer, { namespaceChanged, NAMESPACE_CHANGED } from 'modules/namespace';

describe('namespace module', () => {
  describe('#namespaceChanged', () => {
    it('returns the NAMESPACE_CHANGED action', () => {
      expect(namespaceChanged('db.coll')).to.deep.equal({
        type: NAMESPACE_CHANGED,
        namespace: 'db.coll'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not namespace changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });

    context('when the action is namespace changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, namespaceChanged('db.coll'))).to.equal('db.coll');
      });
    });
  });
});
