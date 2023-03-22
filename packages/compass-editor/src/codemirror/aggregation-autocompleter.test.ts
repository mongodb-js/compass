import { expect } from 'chai';
import { STAGE_OPERATOR_NAMES } from '@mongodb-js/mongodb-constants';
import { createAggregationAutocompleter } from './aggregation-autocompleter';
import { setupCodemirrorCompleter } from '../../test/completer';

describe('query autocompleter', function () {
  const { getCompletions, applySnippet, cleanup } = setupCodemirrorCompleter(
    createAggregationAutocompleter
  );

  after(cleanup);

  context('when autocompleting outside of stage', function () {
    context('with empty pipeline', function () {
      it('should return stages', function () {
        const completions = getCompletions('[{ $');

        expect(
          completions.map((completion) => completion.label).sort()
        ).to.deep.eq([...STAGE_OPERATOR_NAMES].sort());
      });
    });

    context('with other stages in the pipeline', function () {
      it('should return stages', function () {
        const completions = getCompletions('[{$match:{foo: 1}},{$');

        expect(
          completions.map((completion) => completion.label).sort()
        ).to.deep.eq([...STAGE_OPERATOR_NAMES].sort());
      });
    });

    context('inside block', function () {
      it('should not suggest blocks in snippets', function () {
        const completions = getCompletions(`[{ /** comment */ $`);

        completions.forEach((completion) => {
          const snippet = applySnippet(completion);
          expect(snippet).to.match(
            /^[^{]/,
            'expected snippet NOT to start with an opening bracket'
          );
        });
      });
    });

    context('outside block', function () {
      it('should have blocks in snippets', function () {
        const completions = getCompletions(`[{ $match: {foo: 1} }, $`);

        completions.forEach((completion) => {
          const snippet = applySnippet(completion);
          expect(snippet).to.match(
            /^{/,
            'expected snippet to start with an opening bracket'
          );
        });
      });
    });
  });

  context('when autocompleting inside the stage', function () {
    it('should return stage completer results', function () {
      const completions = getCompletions('[{$bucket: { _id: "$', {
        fields: [{ name: 'foo' }, { name: 'bar' }],
      });

      expect(completions.map((completion) => completion.label)).to.deep.eq([
        '$foo',
        '$bar',
      ]);
    });
  });
});
