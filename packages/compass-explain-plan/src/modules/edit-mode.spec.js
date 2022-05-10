import { expect } from 'chai';

import reducer, { editModeChanged, EDIT_MODE_CHANGED } from './edit-mode';

describe('edit-mode module', function () {
  describe('#editModeChanged', function () {
    it('returns the EDIT_MODE_CHANGED action', function () {
      expect(editModeChanged(false)).to.deep.equal({
        type: EDIT_MODE_CHANGED,
        isEditable: false,
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in edit-mode module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' })).to.equal(true);
        });
      }
    );

    context('when the action is editModeChanged', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, editModeChanged(false))).to.equal(false);
      });
    });
  });
});
