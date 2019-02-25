import reducer, {
  editModeChanged,
  EDIT_MODE_CHANGED
} from 'modules/edit-mode';

describe('edit-mode module', () => {
  describe('#editModeChanged', () => {
    it('returns the EDIT_MODE_CHANGED action', () => {
      const editMode = {
        collectionReadOnly: true,
        hardonReadOnly: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false
      };

      expect(editModeChanged(editMode)).to.deep.equal({
        type: EDIT_MODE_CHANGED,
        editMode
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not presented in edit-mode module', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          collectionReadOnly: false,
          hardonReadOnly: false,
          writeStateStoreReadOnly: false,
          oldServerReadOnly: false
        });
      });
    });

    context('when the action is editModeChanged', () => {
      it('returns the new state', () => {
        const editMode = {
          collectionReadOnly: false,
          hardonReadOnly: false,
          writeStateStoreReadOnly: false,
          oldServerReadOnly: true
        };

        expect(reducer(undefined, editModeChanged(editMode))).to.deep.equal(editMode);
      });
    });
  });
});
