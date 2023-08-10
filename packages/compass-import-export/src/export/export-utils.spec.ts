/* eslint-disable mocha/max-top-level-suites */
import _ from 'lodash';
import { expect } from 'chai';

import {
  formatCSVHeaderName,
  csvHeaderNameToFieldName,
} from '../csv/csv-utils';

import { lookupValueForPath, ColumnRecorder } from './export-utils';

describe('lookupValueForPath', function () {
  it('returns the value at the path', function () {
    expect(lookupValueForPath({}, [])).to.equal(undefined);

    expect(lookupValueForPath({}, [{ type: 'index', index: 0 }])).to.equal(
      undefined
    );

    expect(
      lookupValueForPath({ foo: 1 }, [{ type: 'field', name: 'foo' }])
    ).to.equal(1);

    expect(
      lookupValueForPath({ foo: { bar: { baz: 2 } } }, [
        { type: 'field', name: 'foo' },
        { type: 'field', name: 'bar' },
        { type: 'field', name: 'baz' },
      ])
    ).to.equal(2);

    expect(
      lookupValueForPath({}, [
        { type: 'field', name: 'foo' },
        { type: 'field', name: 'bar' },
        { type: 'field', name: 'baz' },
      ])
    ).to.equal(undefined);

    expect(
      lookupValueForPath({ foo: [{ bar: { baz: 2 } }] }, [
        { type: 'field', name: 'foo' },
        { type: 'index', index: 0 },
        { type: 'field', name: 'bar' },
        { type: 'field', name: 'baz' },
      ])
    ).to.equal(2);

    expect(
      lookupValueForPath({ foo: ['a', 'b', 'c'] }, [
        { type: 'field', name: 'foo' },
        { type: 'index', index: 2 },
      ])
    ).to.equal('c');

    expect(
      lookupValueForPath({ foo: ['a', 'b', 'c'] }, [
        { type: 'field', name: 'foo' },
        { type: 'index', index: 2 },
        { type: 'index', index: 7 },
      ])
    ).to.equal(undefined);
  });

  it('returns the value at the path if it points to an object or array (allowObjectsAndArrays=true)', function () {
    expect(lookupValueForPath({}, [], true)).to.deep.equal({});
    expect(
      lookupValueForPath({ foo: {} }, [{ type: 'field', name: 'foo' }], true)
    ).to.deep.equal({});
    expect(
      lookupValueForPath({ foo: [] }, [{ type: 'field', name: 'foo' }], true)
    ).to.deep.equal([]);
    expect(
      lookupValueForPath(
        { foo: { bar: {} } },
        [
          { type: 'field', name: 'foo' },
          { type: 'field', name: 'bar' },
        ],
        true
      )
    ).to.deep.equal({});
    expect(
      lookupValueForPath(
        { foo: { bar: [[1]] } },
        [
          { type: 'field', name: 'foo' },
          { type: 'field', name: 'bar' },
          { type: 'index', index: 0 },
        ],
        true
      )
    ).to.deep.equal([1]);
  });

  it('returns undefined if it points to an object or array (allowObjectsAndArrays=false)', function () {
    expect(lookupValueForPath({}, [], false)).to.deep.equal(undefined);
    expect(
      lookupValueForPath({ foo: {} }, [{ type: 'field', name: 'foo' }], false)
    ).to.deep.equal(undefined);
    expect(
      lookupValueForPath({ foo: [] }, [{ type: 'field', name: 'foo' }], false)
    ).to.deep.equal(undefined);
    expect(
      lookupValueForPath(
        { foo: { bar: {} } },
        [
          { type: 'field', name: 'foo' },
          { type: 'field', name: 'bar' },
        ],
        false
      )
    ).to.deep.equal(undefined);
    expect(
      lookupValueForPath(
        { foo: { bar: [[1]] } },
        [
          { type: 'field', name: 'foo' },
          { type: 'field', name: 'bar' },
          { type: 'index', index: 0 },
        ],
        false
      )
    ).to.deep.equal(undefined);
  });
});

describe('ColumnRecorder', function () {
  it('records the ordered set of CSV columns for all the documents it encounters', function () {
    const r = new ColumnRecorder();

    // do this twice to prove that it only adds each one the first time
    for (let i = 0; i < 2; i++) {
      r.addToColumns({});
      r.addToColumns({ foo: 1 });
      r.addToColumns({ foo: { bar: 1 } });
      r.addToColumns({ foo: [1, 2, 3] });
      r.addToColumns({ x: [1, 2, 3] });
      r.addToColumns({ x: [[1, 2, 3], 0] });
      r.addToColumns({ x: [{}, { y: ['z'] }] });
    }

    // formatting the result as strings is lossless and gives us something a bit
    // more compact to compare
    const result = r.columns.map(formatCSVHeaderName);
    comparePaths(result, [
      'foo',
      'foo.bar',
      'foo[0]',
      'foo[1]',
      'foo[2]',
      'x[0]',
      'x[1]',
      'x[2]',
      'x[0][0]',
      'x[0][1]',
      'x[0][2]',
      'x[1].y[0]',
    ]);
  });

  it('deals with a more complex example', function () {
    const r = new ColumnRecorder();

    // do this twice to prove that it only adds each one the first time
    for (let i = 0; i < 2; i++) {
      r.addToColumns({ amenities: ['a'] });
      r.addToColumns({ price: 1 });
      r.addToColumns({ security_deposit: 2 });
      r.addToColumns({ amenities: ['a', 'b'] });
    }

    const result = r.columns.map(formatCSVHeaderName);

    comparePaths(result, [
      'amenities[0]',
      'amenities[1]',
      'price',
      'security_deposit',
    ]);
  });

  it('deals with arrays of arrays', function () {
    const r = new ColumnRecorder();

    // do this twice to prove that it only adds each one the first time
    for (let i = 0; i < 2; i++) {
      r.addToColumns({ food: ['a'] });
      r.addToColumns({ food: { bar: ['a', { lol: 'yup' }] } });
      r.addToColumns({ things: ['a'] });
      r.addToColumns({ food: { bar: ['a'] } });
      r.addToColumns({ food: ['a', 'b'] });
      r.addToColumns({ food: { bar: ['a', 'b'] } });
      r.addToColumns({ food: { bar: { baz: ['a'] } } });
      r.addToColumns({ food: ['a', 'b', 'c'] });
      r.addToColumns({ things: ['a', 'b'] });
      r.addToColumns({ food: { bar: { baz: ['a', 'b'] } } });
      r.addToColumns({ food: { bar: ['a', 'b', 'c'] } });
      r.addToColumns({ things: { more: 'things' } });
      r.addToColumns({ food: { bar: 1 } });
    }

    const result = r.columns.map(formatCSVHeaderName);
    comparePaths(result, [
      'food[0]',
      'food[1]',
      'food[2]',
      'food.bar[0]',
      'food.bar[1]',
      'food.bar[2]',
      'food.bar[1].lol',
      'things[0]',
      'things[1]',
      'food.bar.baz[0]',
      'food.bar.baz[1]',
      'things.more',
      'food.bar',
    ]);
  });
});

function uniqInOrder(strings: string[]) {
  const uniq: string[] = [];
  if (strings.length) {
    uniq.push(strings[0]);
  }
  for (let i = 1; i < strings.length; i++) {
    const a = strings[i - 1];
    const b = strings[i];
    if (b !== a) {
      uniq.push(b);
    }
  }
  return uniq;
}

function comparePaths(result: string[], expectedResult: string[]) {
  try {
    expect(result).to.deep.equal(expectedResult);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
    throw err;
  }

  // What matters most is that all the fields that map to the same unique
  // field are adjacent to each other because that's how we're going to
  // display them in the import preview. If that's not the case, then the import
  // preview will be very broken.
  const names = result.map(csvHeaderNameToFieldName);
  const uniq = _.uniq(names);
  const uniqAdjacent = uniqInOrder(names);
  try {
    expect(uniq).to.deep.equal(uniqAdjacent);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log({ uniq, uniqAdjacent });
    throw err;
  }
}
