/* eslint-disable mocha/max-top-level-suites */
import { expect } from 'chai';

import { formatCSVHeaderName } from '../csv/csv-utils';

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
    expect(r.columns.map(formatCSVHeaderName)).to.deep.equal([
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
});
