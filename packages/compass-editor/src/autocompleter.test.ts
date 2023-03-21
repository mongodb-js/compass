import { expect } from 'chai';
import type { Completion } from './autocompleter';
import { wrapField } from './autocompleter';
import { completer } from './autocompleter';

describe('completer', function () {
  const simpleCompletions: Completion[] = [
    { value: 'foo', version: '0.0.0', meta: 'stage' },
    { value: 'Foo', version: '0.0.0', meta: 'stage' },
    { value: 'bar', version: '1.0.0', meta: 'accumulator' },
    { value: 'buz', version: '2.0.0', meta: 'expr:array' },
    { value: 'barbar', version: '2.0.0', meta: 'expr:bool' },
  ];

  function getCompletionValues(
    ...args: Parameters<typeof completer>
  ): string[] {
    return completer(args[0], args[1], args[2] ?? simpleCompletions).map(
      (completion) => completion.value
    );
  }

  it('should return results filtered by prefix (case-insensitive)', function () {
    expect(getCompletionValues('f')).to.deep.eq(['foo', 'Foo']);
  });

  it('should return results filtered by server version', function () {
    expect(getCompletionValues('', { serverVersion: '1.0.0' })).to.deep.eq([
      'foo',
      'Foo',
      'bar',
    ]);
    expect(
      getCompletionValues('', { serverVersion: '0.0.1-alpha0' })
    ).to.deep.eq(['foo', 'Foo']);
  });

  it('should return results filtered by meta', function () {
    expect(
      getCompletionValues('', { meta: ['stage', 'accumulator'] })
    ).to.deep.eq(['foo', 'Foo', 'bar']);
    expect(getCompletionValues('', { meta: ['expr:*'] })).to.deep.eq([
      'buz',
      'barbar',
    ]);
  });

  it('should keep field description when provided', function () {
    const completions = completer(
      '',
      {
        meta: ['field:identifier'],
        fields: [
          { name: 'foo', description: 'ObjectId' },
          { name: 'bar', description: 'Int32' },
        ],
      },
      []
    ).map((completion) => {
      return {
        value: completion.value,
        description: completion.description,
      };
    });
    expect(completions).to.deep.eq([
      { value: 'foo', description: 'ObjectId' },
      { value: 'bar', description: 'Int32' },
    ]);
  });

  describe('wrapField', function () {
    it('should leave identifier as-is if its roughly valid', function () {
      expect(wrapField('foo')).to.eq('foo');
      expect(wrapField('bar_buz')).to.eq('bar_buz');
      expect(wrapField('$something')).to.eq('$something');
      expect(wrapField('_or_other')).to.eq('_or_other');
      expect(wrapField('number1')).to.eq('number1');
    });

    it("should wrap field in quotes when it's rougly not a valid js identifier", function () {
      expect(wrapField('123foobar')).to.eq('"123foobar"');
      expect(wrapField('bar@buz')).to.eq('"bar@buz"');
      expect(wrapField('foo bar')).to.eq('"foo bar"');
      expect(wrapField('with.a.dot')).to.eq('"with.a.dot"');
      expect(wrapField('bla; process.exit(1); var foo')).to.eq(
        '"bla; process.exit(1); var foo"'
      );
      expect(wrapField('quotes"in"the"middle')).to.eq(
        '"quotes\\"in\\"the\\"middle"'
      );
    });
  });
});
