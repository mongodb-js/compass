import { expect } from 'chai';
import { createSearchIndexAutocompleter } from './search-index-autocompleter';
import { setupCodemirrorCompleter } from '../../test/completer';

describe('search-index autocompleter', function () {
  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createSearchIndexAutocompleter
  );

  after(cleanup);

  it('returns words in context when its not completing fields', function () {
    const completions = getCompletions('{ dynamic: true, type: "dy', {
      fields: ['_id', 'name', 'age'],
    });
    expect(completions.map((x) => x.label)).to.deep.equal([
      'dynamic',
      'true',
      'type',
    ]);
  });

  it('returns field names when autocompleting fields', function () {
    const completions = getCompletions('{ fields: { "a', {
      fields: ['_id', 'name', 'age'],
    });
    expect(completions.map((x) => x.label)).to.deep.equal([
      '_id',
      'name',
      'age',
    ]);
  });
});
