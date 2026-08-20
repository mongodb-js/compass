import { expect } from 'chai';
import { createDocumentAutocompleter } from './document-autocompleter';
import { setupCodemirrorCompleter } from '../../test/completer';

const fields = ['_id', 'name', 'age'];

describe('document autocompleter', function () {
  describe('javascript-expression mode', function () {
    const { getCompletions, applySnippet, cleanup } = setupCodemirrorCompleter(
      createDocumentAutocompleter
    );

    after(cleanup);

    it('completes field names as unescaped property names', async function () {
      const completions = await getCompletions('{ na', fields);
      expect(completions.map((x) => x.label)).to.deep.equal(['name']);
    });

    it('completes bson constructors in value position', async function () {
      const completions = await getCompletions('{ _id: Obj', fields);
      expect(completions.map((x) => x.label)).to.include('ObjectId');
    });

    it('completes bson constructors inside an array value', async function () {
      const completions = await getCompletions('{ _id: { $in: [ISO', fields);
      expect(completions.map((x) => x.label)).to.include('ISODate');
    });

    it('applies bson constructors unquoted', async function () {
      const [completion] = (await getCompletions('{ _id: Obj', fields)).filter(
        (x) => x.label === 'ObjectId'
      );
      expect(applySnippet(completion)).to.equal("ObjectId('id')");
    });

    it('does not complete bson constructors in property name position', async function () {
      const completions = await getCompletions('{ Obj', fields);
      expect(completions.map((x) => x.label)).to.not.include('ObjectId');
    });

    it('completes words in string values instead of bson constructors', async function () {
      const completions = await getCompletions('{ name: "na', fields);
      expect(completions.map((x) => x.label)).to.not.include('ObjectId');
    });
  });

  describe('json mode', function () {
    const { getCompletions, cleanup } = setupCodemirrorCompleter(
      createDocumentAutocompleter,
      'json'
    );

    after(cleanup);

    it('completes field names as escaped property names', async function () {
      const completions = await getCompletions('{ "na', fields);
      expect(completions.map((x) => x.label)).to.deep.equal(['"name"']);
    });

    it('does not complete bson constructors, which are invalid json', async function () {
      const completions = await getCompletions('{ "_id": Obj', fields);
      expect(completions.map((x) => x.label)).to.not.include('ObjectId');
    });
  });
});
