import { expect } from 'chai';

import reducer, { editModeChanged, EDIT_MODE_CHANGED } from './edit-mode';

describe('edit-mode module', function () {
  describe('#editModeChanged', function () {
    it('returns the EDIT_MODE_CHANGED action', function () {
      const editMode = {
        collectionReadOnly: true,
        collectionTimeSeries: false,
        writeStateStoreReadOnly: false,
        oldServerReadOnly: false,
      };

      expect(editModeChanged(editMode)).to.deep.equal({
        type: EDIT_MODE_CHANGED,
        editMode,
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in edit-mode module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' } as any)).to.deep.equal({
            collectionReadOnly: false,
            collectionTimeSeries: false,
            writeStateStoreReadOnly: false,
            oldServerReadOnly: false,
          });
        });
      }
    );

    context('when the action is editModeChanged', function () {
      it('returns the new state', function () {
        const editMode = {
          collectionReadOnly: false,
          collectionTimeSeries: false,
          writeStateStoreReadOnly: false,
          oldServerReadOnly: true,
        };

        expect(reducer(undefined, editModeChanged(editMode))).to.deep.equal(
          editMode
        );
      });
    });
  });
});
