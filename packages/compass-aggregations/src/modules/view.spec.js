import reducer, { viewChanged, VIEW_CHANGED } from 'modules/view';

describe('server version module', () => {
  describe('#viewChanged', () => {
    it('returns the VIEW_CHANGED action', () => {
      expect(viewChanged('Code')).to.deep.equal({
        type: VIEW_CHANGED,
        view: 'Code'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not view changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal('Code');
      });
    });

    context('when the action is view changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, viewChanged('Builder'))).to.equal('Builder');
      });
    });
  });
});
