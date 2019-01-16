import reducer, {
  INITIAL_STATE,
  changeSchemaFields,
  CHANGE_SCHEMA_FIELDS
} from 'modules/create-index/schema-fields';

describe('create index partial filter expression module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(
          reducer(undefined, changeSchemaFields(['FIELD1', 'FIELD2', 'FIELD1.TEST']))
        ).to.deep.equal(['FIELD1', 'FIELD2', 'FIELD1.TEST']);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeSchemaFields', () => {
    it('returns the action', () => {
      expect(changeSchemaFields(['FIELD1', 'FIELD2', 'FIELD1.TEST'])).to.deep.equal({
        type: CHANGE_SCHEMA_FIELDS,
        schemaFields: ['FIELD1', 'FIELD2', 'FIELD1.TEST']
      });
    });
  });
});
