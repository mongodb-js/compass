import { ShellApiAutocompleter } from './shell-api-autocompleter';
import { expect } from 'chai';
import { Topologies } from '@mongosh/shell-api';

const standalone440 = {
  topology: () => Topologies.Standalone,
  connectionInfo: () => ({
    is_atlas: false,
    is_data_lake: false,
    server_version: '4.4.0'
  }),
  getCollectionCompletionsForCurrentDb: () => ['bananas']
};

describe('Autocompleter', () => {
  describe('getCompletions', () => {
    let autocompleter: ShellApiAutocompleter;

    beforeEach(() => {
      autocompleter = new ShellApiAutocompleter(standalone440);
    });

    it('returns completions for text before cursor', async() => {
      const completions = await autocompleter.getCompletions('db.coll1.');

      expect(completions).to.deep.contain({
        completion: 'db.coll1.find'
      });
    });

    it('returns full completion value with text after dot', async() => {
      const completions = await autocompleter.getCompletions('db.coll1.f');

      expect(completions).to.deep.contain({
        completion: 'db.coll1.find'
      });
    });

    it('returns collection names value with text after dot', async() => {
      const completions = await autocompleter.getCompletions('db.b');

      expect(completions).to.deep.contain({
        completion: 'db.bananas'
      });
    });
  });
});


