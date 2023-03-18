import { expect } from 'chai';
import { createQueryAutocompleter } from './query-autocompleter';
import { setupCodemirrorCompleter } from '../../test/completer';

describe('query autocompleter', function () {
  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createQueryAutocompleter
  );

  after(cleanup);

  it('returns all completions when current token is vaguely matches identifier', function () {
    expect(getCompletions('foo')).to.have.lengthOf(45);
  });

  it("doesn't return anything when not matching identifier", function () {
    expect(getCompletions('[')).to.have.lengthOf(0);
  });

  it('completes "any text" when inside a string', function () {
    expect(
      getCompletions('{ bar: 1, buz: 2, foo: "b').map(
        (completion) => completion.label
      )
    ).to.deep.eq(['bar', '1', 'buz', '2', 'foo']);
  });

  it('escapes field names that are not valid identifiers', function () {
    expect(
      getCompletions('{ $m', {
        fields: [
          'field name with spaces',
          'dots.and+what@not',
          'quotes"in"quotes',
        ],
      })
        .filter((completion) => completion.detail?.startsWith('field'))
        .map((completion) => completion.apply)
    ).to.deep.eq([
      '"field name with spaces"',
      '"dots.and+what@not"',
      '"quotes\\"in\\"quotes"',
    ]);
  });
});
