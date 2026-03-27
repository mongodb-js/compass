import { expect } from 'chai';
import { createQueryAutocompleter } from './query-autocompleter';
import { setupCodemirrorCompleter } from '../../test/completer';

describe('query autocompleter', function () {
  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createQueryAutocompleter
  );

  after(cleanup);

  it('returns completions when current token matches identifier', async function () {
    const completions = await getCompletions('{ $e');
    expect(completions.length).to.be.greaterThan(0);
    expect(
      completions.every((c) => c.type === 'property' || c.type === 'method')
    ).to.be.true;
  });

  it('returns BSON constructors in value position', async function () {
    const completions = await getCompletions('{ field: O');
    expect(completions.length).to.be.greaterThan(0);
    expect(completions.map((c) => c.label)).to.include('ObjectId');
  });

  it('does not return field names in value position', async function () {
    const completions = await getCompletions('{ field: O', {
      fields: ['orangeField'],
    } as any);
    const fieldCompletions = completions.filter((c) => c.detail === 'field');
    expect(fieldCompletions).to.have.lengthOf(0);
  });

  it("doesn't return anything when not matching identifier in value position", async function () {
    expect(await getCompletions('{ field: [')).to.have.lengthOf(0);
  });

  it('completes "any text" when inside a string', async function () {
    expect(
      (await getCompletions('{ bar: 1, buz: 2, foo: "b')).map(
        (completion) => completion.label
      )
    ).to.deep.eq(['bar', '1', 'buz', '2', 'foo']);
  });

  it('escapes field names that are not valid identifiers', async function () {
    expect(
      (
        await getCompletions('{ $m', {
          fields: [
            'field name with spaces',
            'dots.and+what@not',
            'quotes"in"quotes',
          ],
        } as any)
      )
        .filter((completion) => completion.detail?.startsWith('field'))
        .map((completion) => completion.apply)
    ).to.deep.eq([
      '"field name with spaces"',
      '"dots.and+what@not"',
      '"quotes\\"in\\"quotes"',
    ]);
  });
});
