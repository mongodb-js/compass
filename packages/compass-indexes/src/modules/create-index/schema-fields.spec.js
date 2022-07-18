import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changeSchemaFields,
  CHANGE_SCHEMA_FIELDS,
} from '../create-index/schema-fields';

describe('create index schema fields module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(
            undefined,
            changeSchemaFields(['FIELD1', 'FIELD2', 'FIELD1.TEST'])
          )
        ).to.deep.equal(['FIELD1', 'FIELD2', 'FIELD1.TEST']);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeSchemaFields', function () {
    it('returns the action', function () {
      expect(
        changeSchemaFields(['FIELD1', 'FIELD2', 'FIELD1.TEST'])
      ).to.deep.equal({
        type: CHANGE_SCHEMA_FIELDS,
        schemaFields: ['FIELD1', 'FIELD2', 'FIELD1.TEST'],
      });
    });
  });
});
