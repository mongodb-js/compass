import reducer, { fieldsChanged, FIELDS_CHANGED } from './fields';
import { expect } from 'chai';

describe('server version module', function () {
  const fields = [
    { name: '_id', value: '_id', score: 1, meta: 'field', version: '0.0.0' },
    { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0' },
  ];

  describe('#fieldsChanged', function () {
    it('returns the FIELDS_CHANGED action', function () {
      expect(fieldsChanged(fields)).to.deep.equal({
        type: FIELDS_CHANGED,
        fields: fields,
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not fields changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });

    context('when the action is fields changed', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, fieldsChanged(fields))).to.deep.equal([
          {
            name: '_id',
            value: '_id',
            score: 1,
            meta: 'field',
            version: '0.0.0',
          },
          {
            name: 'name',
            value: 'name',
            score: 1,
            meta: 'field',
            version: '0.0.0',
          },
        ]);
      });
    });
  });
});
