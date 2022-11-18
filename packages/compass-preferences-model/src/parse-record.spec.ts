import { parseRecord } from './parse-record';
import { expect } from 'chai';
import yaml from 'js-yaml';
import yargsParser from 'yargs-parser';

describe('parseRecord', function () {
  let errors: string[];
  let error: (err: string) => void;

  beforeEach(function () {
    errors = [];
    error = errors.push.bind(errors);
  });

  it('can handle arrays of key-value pairs', function () {
    expect(
      parseRecord(
        [
          ['a', 'b'],
          ['a', 'c'],
          ['b', 'd'],
        ],
        error
      )
    ).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('can handle arrays of objects', function () {
    expect(
      parseRecord([{ a: 'b' }, { a: 'c' }, { b: 'd' }], error)
    ).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('can handle objects of arrays', function () {
    expect(parseRecord({ a: ['b', 'c'], b: 'd' }, error)).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('handles single-key-per-object YAML input well', function () {
    expect(
      parseRecord(
        yaml.load(`
- a: b
- a: c
- b: d
`),
        error
      )
    ).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('handles multiple-key-per-object YAML input well', function () {
    expect(
      parseRecord(
        yaml.load(`
- a: b
- a: c
  b: d
`),
        error
      )
    ).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('handles key-value input for yaml well', function () {
    expect(
      parseRecord(
        yaml.load(`
-
  - a
  - b
-
  - a
  - c
-
  - b
  - d
`),
        error
      )
    ).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('handles yargs-sytyle input well', function () {
    expect(
      parseRecord(
        yargsParser(['--obj.a=b', '--obj.a=c', '--obj.b=d']).obj,
        error
      )
    ).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('can handle url query strings', function () {
    expect(parseRecord('a=b&a=c&b=d', error)).to.deep.equal([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
    ]);
    expect(errors).to.have.lengthOf(0);
  });

  it('returns an empty array for falsy input', function () {
    expect(parseRecord(null, error)).to.deep.equal([]);
    expect(errors).to.have.lengthOf(0);
  });

  it('rejects primitive values', function () {
    expect(parseRecord(42, error)).to.deep.equal([]);
    expect(errors).to.deep.equal([
      `Could not interpret 42 as a list of key-value pairs`,
    ]);
  });

  it('rejects arrays containing primitive values', function () {
    expect(parseRecord([42], error)).to.deep.equal([]);
    expect(errors).to.deep.equal([
      `Could not interpret 42 as a key-value pair`,
    ]);
  });

  it('rejects keys that cannot easily be converted to strings', function () {
    expect(parseRecord([[{ key: 1 }, 'value']], error)).to.deep.equal([]);
    expect(errors).to.deep.equal([
      `Could not interpret { key: 1 } as a record key`,
    ]);
  });

  it('rejects values that cannot easily be converted to strings', function () {
    expect(parseRecord([['key', { value: 1 }]], error)).to.deep.equal([]);
    expect(errors).to.deep.equal([
      `Could not interpret { value: 1 } as a string value`,
    ]);
  });
});
