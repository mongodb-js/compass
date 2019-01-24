import reducer, {
  editModeChanged,
  EDIT_MODE_CHANGED
} from 'modules/edit-mode';

describe('edit-mode module', () => {
  describe('#editModeChanged', () => {
    it('returns the EDIT_MODE_CHANGED action', () => {
      expect(editModeChanged(false)).to.deep.equal({
        type: EDIT_MODE_CHANGED,
        isEditable: false
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in edit-mode module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is editModeChanged', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, editModeChanged(false))).to.equal(false);
      });
    });
  });
});
