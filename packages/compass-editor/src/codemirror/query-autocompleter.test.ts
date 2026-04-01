import { expect } from 'chai';
import { createQueryAutocompleter } from './query-autocompleter';
import { setupCodemirrorCompleter } from '../../test/completer';

const pineFields = ['pineapple', 'pine tree', 'pinecone', 'apple'];

describe('query autocompleter', function () {
  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createQueryAutocompleter
  );

  after(cleanup);

  it('returns completions matching the prefix of a field', async function () {
    expect(await getCompletions('foo')).to.have.lengthOf(0);

    expect(
      await getCompletions('{ pine', {
        fields: pineFields,
      })
    ).to.have.lengthOf(3);
  });

  it('does not complete field names when the prefix is a value', async function () {
    expect(
      await getCompletions('{ pineapple: pine', {
        fields: pineFields,
      })
    ).to.have.lengthOf(0);
  });

  it('returns completions matching the prefix of a query operator', async function () {
    expect(
      await getCompletions('{ $i', {
        fields: pineFields,
      })
    ).to.have.lengthOf(1);
  });

  it('returns completions matching the prefix of a bson value', async function () {
    expect(await getCompletions('{ pineapple: legacy')).to.have.lengthOf(3);
  });

  it("doesn't return anything when not matching identifier", async function () {
    expect(await getCompletions('[')).to.have.lengthOf(0);
  });

  it('completes "any text" when inside a string', async function () {
    expect(
      (await getCompletions('{ bar: 1, buz: 2, foo: "b')).map(
        (completion) => completion.label
      )
    ).to.deep.eq(['bar', '1', 'buz', '2', 'foo']);
  });

  it('does not return completions when inside a comment', async function () {
    expect(
      await getCompletions('// pine', { fields: pineFields })
    ).to.have.lengthOf(0);
    expect(
      await getCompletions('/* pine */', { fields: pineFields })
    ).to.have.lengthOf(0);
  });

  it('completes bson operators in an array', async function () {
    expect(
      await getCompletions('{ field: [pin', { fields: pineFields })
    ).to.have.lengthOf(0);
    expect(
      await getCompletions('{ field: [Obj', { fields: pineFields })
    ).to.have.lengthOf(1);
  });

  it('escapes field names that are not valid identifiers', async function () {
    expect(
      (
        await getCompletions('{ in', {
          fields: [
            'field name with spaces in it',
            'dots.and+what@not.in.it',
            'quotes"in"quotes',
          ],
        } as any)
      )
        .filter((completion) => completion.detail?.startsWith('field'))
        .map((completion) => completion.apply)
    ).to.deep.eq([
      '"field name with spaces in it"',
      '"dots.and+what@not.in.it"',
      '"quotes\\"in\\"quotes"',
    ]);
  });
});
