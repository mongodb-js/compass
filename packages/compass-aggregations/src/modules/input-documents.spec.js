import reducer, {
  toggleInputDocumentsCollapsed,
  TOGGLE_INPUT_COLLAPSED
} from 'modules/input-documents';

describe('input documents module', () => {
  describe('#toggleInputDocumentsCollapsed', () => {
    it('returns the TOGGLE_INPUT_COLLAPSED action', () => {
      expect(toggleInputDocumentsCollapsed()).to.deep.equal({
        type: TOGGLE_INPUT_COLLAPSED
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not toggle input documents collapsed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          documents: [],
          isExpanded: true,
          count: 0
        });
      });
    });

    context('when the action is toggle input documents collapsed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleInputDocumentsCollapsed())).to.deep.equal({
          documents: [],
          isExpanded: false,
          count: 0
        });
      });
    });
  });
});
