import reducer, { nameChanged, NAME_CHANGED } from 'modules/name';

describe('name module', () => {
  describe('#nameChanged', () => {
    it('returns the NAME_CHANGED action', () => {
      expect(nameChanged('testing')).to.deep.equal({
        type: NAME_CHANGED,
        name: 'testing'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not name changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });

    context('when the action is name changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, nameChanged('testing'))).to.equal('testing');
      });
    });
  });
});
