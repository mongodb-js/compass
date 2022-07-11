import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  createNewIndexField,
  CREATE_NEW_INDEX_FIELD,
  clearNewIndexField,
  CLEAR_NEW_INDEX_FIELD,
} from '../create-index/new-index-field';

describe('create index new index field module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state for createNewIndexField', function () {
        expect(
          reducer(
            undefined,
            createNewIndexField('FIELD1')
          )
        ).to.deep.equal('FIELD1');
      });

      it('returns the new state for clearNewIndexField', function () {
        expect(
          reducer(
            undefined,
            clearNewIndexField()
          )
        ).to.deep.equal(null);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#createNewIndexField', function () {
    it('returns the action', function () {
      expect(
        createNewIndexField('FIELD2')
      ).to.deep.equal({
        type: CREATE_NEW_INDEX_FIELD,
        newField: 'FIELD2',
      });
    });
  });

  describe('#clearNewIndexField', function () {
    it('returns the action', function () {
      expect(
        clearNewIndexField()
      ).to.deep.equal({
        type: CLEAR_NEW_INDEX_FIELD,
      });
    });
  });
});
