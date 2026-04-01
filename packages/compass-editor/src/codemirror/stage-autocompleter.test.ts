import type { Completion } from '@codemirror/autocomplete';
import { expect } from 'chai';
import { setupCodemirrorCompleter } from '../../test/completer';
import { createStageAutocompleter } from './stage-autocompleter';

function meta(completions: readonly Completion[]) {
  return Array.from(new Set(completions.map((c) => c.detail)));
}

describe('createStageAutocompleter', function () {
  const fields = [
    {
      name: 'name',
    },
    {
      name: 'with.dots',
    },
    {
      name: 'with spaces',
    },
  ];

  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createStageAutocompleter
  );

  after(cleanup);

  it('returns nothing for empty input', async function () {
    const completions = getCompletions('', { fields });
    expect(await completions).to.have.lengthOf(0);
  });

  it('retuns nothing when inside a comment', async function () {
    const completions = getCompletions('// a', { fields });
    expect(await completions).to.have.lengthOf(0);
  });

  it('returns any word when inside a string', async function () {
    const completions = getCompletions('{ bar: 1, foo: "b', { fields });
    expect((await completions).map((c) => c.label)).to.deep.eq([
      'bar',
      '1',
      'foo',
    ]);
  });

  it('returns unescaped field references when inside string and starts with $', async function () {
    const completions = getCompletions('{ foo: "$', { fields });
    expect((await completions).map((c) => c.apply)).to.deep.eq([
      '$name',
      '$with.dots',
      '$with spaces',
    ]);
  });

  it('returns expected types of completions for identifier-like completion', async function () {
    const completions = getCompletions('{ a', { fields });
    expect(meta(await completions)).to.deep.eq([
      'bson',
      'bson-legacy-uuid',
      'conv',
      'expr:arith',
      'expr:set',
      'expr:bool',
      'expr:array',
      'expr:obj',
      'expr:comp',
      'expr:string',
      'expr:cond',
      'expr:date',
      'expr:get',
      'expr:var',
      'expr:literal',
      'expr:text',
      'expr:regex',
      'expr:type',
      'expr:bit',
      'field',
    ]);
  });

  it('returns query completions for $match stage field', async function () {
    const completions = getCompletions('{ me', {
      fields,
      stageOperator: '$match',
    });
    // na[me] and $com[me]nt
    expect(meta(await completions)).to.deep.eq(['query', 'field']);
  });

  it('returns query completions for $match stage value', async function () {
    const bsonCompletions = getCompletions('{ pineapple: me', {
      fields,
      stageOperator: '$match',
    });
    // Ti[me]stamp
    expect(meta(await bsonCompletions)).to.deep.eq(['bson']);

    const completions = getCompletions('{ pineapple: le', {
      fields,
      stageOperator: '$match',
    });
    // [le]gacy UUIDs match.
    expect(meta(await completions)).to.deep.eq(['bson-legacy-uuid']);
  });

  ['$project', '$group'].forEach((stageOperator) => {
    it(`returns accumulators when stage is ${stageOperator}`, async function () {
      const completions = getCompletions('{ a', {
        fields,
        stageOperator,
      });
      expect(meta(await completions)).to.include('accumulator');
      expect(meta(await completions)).to.include('accumulator:bottom-n');
      expect(meta(await completions)).to.include('accumulator:top-n');
      expect(meta(await completions)).to.include('accumulator:window');
    });
  });
});
