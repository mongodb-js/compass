import { expect } from 'chai';
import { splitBySeparator } from './utils';

describe('item action utils', function () {
  describe('splitBySeparator', function () {
    it('returns an empty array for an empty input', function () {
      const result = splitBySeparator([]);
      expect(result).is.empty;
    });

    it('returns a single item for a single input', function () {
      const result = splitBySeparator([{ label: 'Foo', action: 'foo' }]);
      expect(result).deep.equal([[{ label: 'Foo', action: 'foo' }]]);
    });

    it('splits four items separated by a separator', function () {
      const result = splitBySeparator([
        { label: 'Foo', action: 'foo' },
        { label: 'Bar', action: 'bar' },
        { separator: true },
        { label: 'Baz', action: 'baz' },
        { label: 'Qux', action: 'qux' },
      ]);
      expect(result).deep.equal([
        [
          { label: 'Foo', action: 'foo' },
          { label: 'Bar', action: 'bar' },
        ],
        [
          { label: 'Baz', action: 'baz' },
          { label: 'Qux', action: 'qux' },
        ],
      ]);
    });

    it('disregards leading separators', function () {
      const result = splitBySeparator([
        { separator: true },
        { label: 'Foo', action: 'foo' },
      ]);
      expect(result).deep.equal([[{ label: 'Foo', action: 'foo' }]]);
    });

    it('disregards trailing separators', function () {
      const result = splitBySeparator([
        { label: 'Foo', action: 'foo' },
        { separator: true },
      ]);
      expect(result).deep.equal([[{ label: 'Foo', action: 'foo' }]]);
    });
  });
});
