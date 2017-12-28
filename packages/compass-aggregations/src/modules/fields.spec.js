import reducer, { fieldsChanged, FIELDS_CHANGED } from 'modules/fields';

describe('server version module', () => {
  describe('#fieldsChanged', () => {
    const fields = { _id: { type: 'ObjectId' }, name: { type: 'String' }};

    it('returns the FIELDS_CHANGED action', () => {
      expect(fieldsChanged(fields)).to.deep.equal({
        type: FIELDS_CHANGED,
        fields: fields
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not fields changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });

    context('when the action is fields changed', () => {
      const fields = { _id: { type: 'ObjectId' }, name: { type: 'String' }};

      it('returns the new state', () => {
        expect(reducer(undefined, fieldsChanged(fields))).to.deep.equal([
          { name: '_id', value: '_id', score: 1, meta: 'field', version: '0.0.0' },
          { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' }
        ]);
      });
    });
  });
});
