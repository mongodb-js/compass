import { filterAndNormalizeAncestorList } from './utils';
import { expect } from 'chai';

describe('codemirror utils', function () {
  describe('filterAndNormalizeAncestorList', function () {
    const testCases = [
      {
        name: 'invalid property names',
        input: ['one', 'two', 'three'],
        expected: [],
      },
      {
        name: 'valid property with double quotes',
        input: ['"one":', '"two" : ', '"th ree": '],
        expected: ['one', 'two', 'th ree'],
      },
      {
        name: 'valid property with single quotes',
        input: ["'one':", "'two' : ", "'th ree': "],
        expected: ['one', 'two', 'th ree'],
      },
      {
        name: 'valid property with no quotes',
        input: ['one:', 'two : ', 'th ree: '],
        expected: ['one', 'two', 'ree'],
      },
      {
        name: 'valid array indexes',
        input: ['properties', '[123]'],
        expected: ['[123]'],
      },
      {
        name: 'ignore the part before property',
        input: ['before one:', 'before "two":', 'before "three":'],
        expected: ['one', 'two', 'three'],
      },
    ];
    for (const testCase of testCases) {
      it(testCase.name, function () {
        expect(filterAndNormalizeAncestorList(testCase.input)).to.deep.equal(
          testCase.expected
        );
      });
    }
  });
});
