import { expect } from 'chai';

import reducer, {
  editModeChanged,
  EDIT_MODE_CHANGED,
  INITIAL_STATE,
} from './edit-mode';
import { validationFetched } from './validation';

describe('edit-mode module', function () {
  describe('#editModeChanged', function () {
    it('returns the EDIT_MODE_CHANGED action', function () {
      const editMode = {
        collectionReadOnly: true,
        collectionTimeSeries: false,
        isEditingEnabledByUser: false,
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
            isEditingEnabledByUser: false,
            writeStateStoreReadOnly: false,
            oldServerReadOnly: false,
            constraintValidation: 'none',
          });
        });
      }
    );

    context('when the action is editModeChanged', function () {
      it('returns the new state', function () {
        const editMode = {
          collectionReadOnly: false,
          collectionTimeSeries: false,
          isEditingEnabledByUser: false,
          writeStateStoreReadOnly: false,
          oldServerReadOnly: true,
          constraintValidation: 'none' as const,
        };

        expect(reducer(undefined, editModeChanged(editMode))).to.deep.equal(
          editMode
        );
      });
    });

    context('when the action is validationFetched', function () {
      const fetched = (overrides: any = {}) =>
        reducer(
          { ...INITIAL_STATE, constraintValidation: 'active' },
          validationFetched({
            validator: {},
            validationAction: 'error',
            validationLevel: 'strict',
            ...overrides,
          })
        ).constraintValidation;

      it('marks the constraint validation level as active', function () {
        expect(fetched({ validationLevel: 'constraint' })).to.equal('active');
      });

      it('marks an in-progress upgrade as prepared', function () {
        expect(fetched({ prepareConstraintValidationLevel: true })).to.equal(
          'prepared'
        );
      });

      it('clears the state for an ordinary collection', function () {
        expect(fetched()).to.equal('none');
      });
    });
  });
});
