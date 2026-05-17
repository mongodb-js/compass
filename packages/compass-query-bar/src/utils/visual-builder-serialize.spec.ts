import { expect } from 'chai';
import {
  coerceScalar,
  formatValueForVisualBuilder,
  isFilterRepresentable,
  isPrimitiveBsonType,
  isProjectionRepresentable,
  isSortRepresentable,
  parseValueDragPayload,
  serializeFilter,
  serializeProjection,
  serializeSort,
  VALUE_DRAG_MIME_TYPE,
  type FilterRule,
} from './visual-builder-serialize';

function rule(partial: Partial<FilterRule>): FilterRule {
  return {
    id: 'id',
    path: 'a',
    bsonType: 'String',
    operator: '$eq',
    valueString: '',
    value: undefined,
    valid: true,
    ...partial,
  };
}

describe('visual-builder-serialize', function () {
  describe('coerceScalar', function () {
    it('coerces numbers', function () {
      expect(coerceScalar('5', 'Number')).to.equal(5);
      expect(coerceScalar('abc', 'Number')).to.equal(undefined);
    });

    it('coerces booleans', function () {
      expect(coerceScalar('true', 'Boolean')).to.equal(true);
      expect(coerceScalar('false', 'Boolean')).to.equal(false);
      expect(coerceScalar('yes', 'Boolean')).to.equal(undefined);
    });

    it('coerces dates', function () {
      const d = coerceScalar('2024-01-01', 'Date');
      expect(d).to.be.instanceOf(Date);
    });

    it('falls through to string for unknown types', function () {
      expect(coerceScalar(' hi ', 'ObjectId')).to.equal('hi');
    });
  });

  describe('serializeFilter', function () {
    it('returns "" for no rules', function () {
      expect(serializeFilter([], '$and')).to.equal('');
    });

    it('collapses a single $eq to the bare value', function () {
      const out = serializeFilter(
        [rule({ path: 'name', valueString: 'alice' })],
        '$and'
      );
      expect(out).to.equal("{name:'alice'}");
    });

    it('emits {$op: value} for non-$eq operators', function () {
      const out = serializeFilter(
        [
          rule({
            path: 'age',
            bsonType: 'Number',
            operator: '$gt',
            valueString: '18',
          }),
        ],
        '$and'
      );
      expect(out).to.equal('{age:{$gt:18}}');
    });

    it('wraps multiple rules in $and', function () {
      const out = serializeFilter(
        [
          rule({
            path: 'age',
            bsonType: 'Number',
            operator: '$gt',
            valueString: '18',
          }),
          rule({
            path: 'name',
            valueString: 'alice',
          }),
        ],
        '$and'
      );
      expect(out).to.equal("{$and:[{age:{$gt:18}},{name:'alice'}]}");
    });

    it('wraps multiple rules in $or when chosen', function () {
      const out = serializeFilter(
        [
          rule({
            path: 'age',
            bsonType: 'Number',
            operator: '$gt',
            valueString: '18',
          }),
          rule({
            path: 'age',
            bsonType: 'Number',
            operator: '$lt',
            valueString: '65',
          }),
        ],
        '$or'
      );
      expect(out).to.equal('{$or:[{age:{$gt:18}},{age:{$lt:65}}]}');
    });

    it('serializes $in with typed values', function () {
      const out = serializeFilter(
        [
          rule({
            path: 'tags',
            bsonType: 'String',
            operator: '$in',
            valueString: 'a, b, c',
          }),
        ],
        '$and'
      );
      expect(out).to.equal("{tags:{$in:['a','b','c']}}");
    });

    it('serializes $regex with flags', function () {
      const out = serializeFilter(
        [
          rule({
            path: 'name',
            bsonType: 'String',
            operator: '$regex',
            valueString: '^al/i',
          }),
        ],
        '$and'
      );
      expect(out).to.equal("{name:{$regex:'^al',$options:'i'}}");
    });

    it('serializes $exists', function () {
      const out = serializeFilter(
        [
          rule({
            path: 'email',
            bsonType: 'String',
            operator: '$exists',
            valueString: '',
          }),
        ],
        '$and'
      );
      expect(out).to.equal('{email:{$exists:true}}');
    });

    it('skips invalid rules', function () {
      const out = serializeFilter(
        [
          rule({ path: 'a', valid: false, valueString: 'x' }),
          rule({ path: 'b', valueString: 'y' }),
        ],
        '$and'
      );
      expect(out).to.equal("{b:'y'}");
    });
  });

  describe('serializeProjection', function () {
    it('returns "" for empty list', function () {
      expect(serializeProjection([])).to.equal('');
    });

    it('emits include/exclude map', function () {
      const out = serializeProjection([
        { id: '1', path: 'name', mode: 1 },
        { id: '2', path: 'email', mode: 0 },
      ]);
      expect(out).to.equal('{name:1,email:0}');
    });
  });

  describe('serializeSort', function () {
    it('returns "" for empty list', function () {
      expect(serializeSort([])).to.equal('');
    });

    it('preserves the entry order', function () {
      const out = serializeSort([
        { id: '1', path: 'createdAt', direction: -1 },
        { id: '2', path: 'name', direction: 1 },
      ]);
      expect(out).to.equal('{createdAt:-1,name:1}');
    });
  });

  describe('isFilterRepresentable', function () {
    it('accepts empty / null', function () {
      expect(isFilterRepresentable({})).to.equal(true);
      expect(isFilterRepresentable(null)).to.equal(true);
    });

    it('accepts simple scalar match', function () {
      expect(isFilterRepresentable({ name: 'alice' })).to.equal(true);
    });

    it('accepts single-operator clauses', function () {
      expect(isFilterRepresentable({ age: { $gt: 18 } })).to.equal(true);
    });

    it('accepts {$regex, $options} pair', function () {
      expect(
        isFilterRepresentable({ name: { $regex: '^a', $options: 'i' } })
      ).to.equal(true);
    });

    it('accepts top-level $and / $or of leaves', function () {
      expect(
        isFilterRepresentable({
          $and: [{ age: { $gt: 18 } }, { name: 'alice' }],
        })
      ).to.equal(true);
    });

    it('rejects $expr / $where / $jsonSchema / $text / $nor', function () {
      expect(isFilterRepresentable({ $expr: { $eq: ['$a', '$b'] } })).to.equal(
        false
      );
      expect(isFilterRepresentable({ $where: 'this.a > 0' })).to.equal(false);
      expect(isFilterRepresentable({ $jsonSchema: {} })).to.equal(false);
      expect(isFilterRepresentable({ $text: { $search: 'q' } })).to.equal(
        false
      );
      expect(isFilterRepresentable({ $nor: [] })).to.equal(false);
    });

    it('rejects multi-operator clauses (other than regex+options)', function () {
      expect(isFilterRepresentable({ age: { $gt: 18, $lt: 65 } })).to.equal(
        false
      );
    });
  });

  describe('isProjectionRepresentable', function () {
    it('accepts include/exclude maps', function () {
      expect(isProjectionRepresentable({ a: 1, b: 0 })).to.equal(true);
    });
    it('rejects expressions like $slice', function () {
      expect(isProjectionRepresentable({ a: { $slice: 5 } })).to.equal(false);
    });
  });

  describe('isSortRepresentable', function () {
    it('accepts ±1', function () {
      expect(isSortRepresentable({ a: 1, b: -1 })).to.equal(true);
    });
    it('rejects $meta', function () {
      expect(isSortRepresentable({ score: { $meta: 'textScore' } })).to.equal(
        false
      );
    });
  });

  describe('isPrimitiveBsonType', function () {
    it('accepts scalar BSON types', function () {
      expect(isPrimitiveBsonType('String')).to.equal(true);
      expect(isPrimitiveBsonType('Number')).to.equal(true);
      expect(isPrimitiveBsonType('Int32')).to.equal(true);
      expect(isPrimitiveBsonType('Long')).to.equal(true);
      expect(isPrimitiveBsonType('Decimal128')).to.equal(true);
      expect(isPrimitiveBsonType('Date')).to.equal(true);
      expect(isPrimitiveBsonType('ObjectId')).to.equal(true);
      expect(isPrimitiveBsonType('Boolean')).to.equal(true);
    });

    it('rejects compound / unsupported types', function () {
      expect(isPrimitiveBsonType('Array')).to.equal(false);
      expect(isPrimitiveBsonType('Object')).to.equal(false);
      expect(isPrimitiveBsonType('Document')).to.equal(false);
      expect(isPrimitiveBsonType('Binary')).to.equal(false);
      expect(isPrimitiveBsonType('Null')).to.equal(false);
      expect(isPrimitiveBsonType('')).to.equal(false);
    });
  });

  describe('formatValueForVisualBuilder', function () {
    it('returns "" for null / undefined', function () {
      expect(formatValueForVisualBuilder(null, 'String')).to.equal('');
      expect(formatValueForVisualBuilder(undefined, 'Number')).to.equal('');
    });

    it('formats Date as ISO string', function () {
      const d = new Date('2025-12-23T17:28:46.175Z');
      expect(formatValueForVisualBuilder(d, 'Date')).to.equal(
        '2025-12-23T17:28:46.175Z'
      );
    });

    it('formats ObjectId via toHexString when available', function () {
      const oid = {
        toHexString: () => '694ad14e93e017adc60c2e96',
      };
      expect(formatValueForVisualBuilder(oid, 'ObjectId')).to.equal(
        '694ad14e93e017adc60c2e96'
      );
    });

    it('formats Boolean', function () {
      expect(formatValueForVisualBuilder(true, 'Boolean')).to.equal('true');
      expect(formatValueForVisualBuilder(false, 'Boolean')).to.equal('false');
    });

    it('formats numbers (Number / Int32 / Long / Decimal128 / Double)', function () {
      expect(formatValueForVisualBuilder(42, 'Number')).to.equal('42');
      expect(formatValueForVisualBuilder(-7, 'Int32')).to.equal('-7');
      expect(formatValueForVisualBuilder(3.14, 'Double')).to.equal('3.14');
      // Decimal128-like wrapper exposes its own toString
      const dec = { toString: () => '99.99' };
      expect(formatValueForVisualBuilder(dec, 'Decimal128')).to.equal('99.99');
    });

    it('formats String as-is', function () {
      expect(formatValueForVisualBuilder('haimtest', 'String')).to.equal(
        'haimtest'
      );
    });

    it('round-trips through coerceScalar to a useable typed value', function () {
      const formatted = formatValueForVisualBuilder(
        new Date('2025-01-02T03:04:05.000Z'),
        'Date'
      );
      const coerced = coerceScalar(formatted, 'Date');
      expect(coerced).to.be.instanceOf(Date);
      expect((coerced as Date).toISOString()).to.equal(
        '2025-01-02T03:04:05.000Z'
      );
    });

    it('returns "" for non-primitive types (caller will skip the drag)', function () {
      expect(formatValueForVisualBuilder({ a: 1 }, 'Object')).to.equal('');
      expect(formatValueForVisualBuilder([1, 2], 'Array')).to.equal('');
    });
  });

  describe('parseValueDragPayload', function () {
    function fakeTransfer(data: Record<string, string>): DataTransfer {
      return {
        getData(type: string) {
          return data[type] ?? '';
        },
      } as unknown as DataTransfer;
    }

    it('returns null when the MIME type is absent', function () {
      expect(parseValueDragPayload(fakeTransfer({}))).to.equal(null);
    });

    it('returns null for malformed JSON', function () {
      expect(
        parseValueDragPayload(
          fakeTransfer({ [VALUE_DRAG_MIME_TYPE]: '<<not json>>' })
        )
      ).to.equal(null);
    });

    it('returns null when required fields are missing', function () {
      expect(
        parseValueDragPayload(
          fakeTransfer({ [VALUE_DRAG_MIME_TYPE]: '{"path":"a"}' })
        )
      ).to.equal(null);
    });

    it('parses a valid payload', function () {
      const payload = parseValueDragPayload(
        fakeTransfer({
          [VALUE_DRAG_MIME_TYPE]: JSON.stringify({
            path: 'creation_time',
            bsonType: 'Date',
            valueString: '2025-12-23T17:28:46.175Z',
          }),
        })
      );
      expect(payload).to.deep.equal({
        path: 'creation_time',
        bsonType: 'Date',
        valueString: '2025-12-23T17:28:46.175Z',
      });
    });
  });
});
