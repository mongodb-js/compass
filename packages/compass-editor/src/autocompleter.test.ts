import { expect } from 'chai';
import { completer } from './autocompleter';

describe('completer', function () {
  const simpleCompletions = [
    { value: 'foo', version: '0.0.0', meta: 'stage' as const },
    { value: 'Foo', version: '0.0.0', meta: 'stage' as const },
    { value: 'bar', version: '1.0.0', meta: 'accumulator' as const },
    { value: 'buz', version: '2.0.0', meta: 'expr:array' as const },
    { value: 'barbar', version: '2.0.0', meta: 'expr:bool' as const },
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
});
