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

  it('returns nothing for empty input', function () {
    const completions = getCompletions('', { fields });
    expect(completions).to.have.lengthOf(0);
  });

  it('retuns nothing when inside a comment', function () {
    const completions = getCompletions('// a', { fields });
    expect(completions).to.have.lengthOf(0);
  });

  it('returns any word when inside a string', function () {
    const completions = getCompletions('{ bar: 1, foo: "b', { fields });
    expect(completions.map((c) => c.label)).to.deep.eq(['bar', '1', 'foo']);
  });

  it('returns unescaped field references when inside string and starts with $', function () {
    const completions = getCompletions('{ foo: "$', { fields });
    expect(completions.map((c) => c.apply)).to.deep.eq([
      '$name',
      '$with.dots',
      '$with spaces',
    ]);
  });

  it('returns expected types of completions for identifier-like completion', function () {
    const completions = getCompletions('{ a', { fields });
    expect(meta(completions)).to.deep.eq([
      'bson',
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

  it('returns query completions for $match stage', function () {
    const completions = getCompletions('{ a', {
      fields,
      stageOperator: '$match',
    });
    expect(meta(completions)).to.deep.eq(['bson', 'query', 'field']);
  });

  ['$project', '$group'].forEach((stageOperator) => {
    it(`returns accumulators when stage is ${stageOperator}`, function () {
      const completions = getCompletions('{ a', {
        fields,
        stageOperator,
      });
      expect(meta(completions)).to.include('accumulator');
      expect(meta(completions)).to.include('accumulator:bottom-n');
      expect(meta(completions)).to.include('accumulator:top-n');
      expect(meta(completions)).to.include('accumulator:window');
    });
  });
});
