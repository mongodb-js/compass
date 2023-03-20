import { expect } from 'chai';
import { createValidationAutocompleter } from './validation-autocompleter';
import { setupCodemirrorCompleter } from '../../test/completer';

describe('validation autocompleter', function () {
  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createValidationAutocompleter
  );

  after(cleanup);

  it('returns $jsonSchema by default', function () {
    const completions = getCompletions('');
    expect(completions.map((x) => x.label)).to.deep.equal(['$jsonSchema']);
  });

  it('returns query operators when completing at root', function () {
    const completions = getCompletions('{ $');
    expect(completions).to.have.lengthOf(33);
  });

  it('returns field names when autocompleting required', function () {
    const completions = getCompletions('{ $jsonSchema: { required: ["i', {
      fields: ['_id', 'name', 'age'],
    });
    expect(completions.map((x) => x.label)).to.deep.equal([
      '_id',
      'name',
      'age',
    ]);
  });

  it('returns bson type when autocompleting bsonType as a string', function () {
    const completions = getCompletions('{ $jsonSchema: { bsonType: "a');
    expect(completions).to.have.lengthOf(19);
  });

  it('returns bson type when autocompleting bsonType as a array', function () {
    const completions = getCompletions('{ $jsonSchema: { bsonType: ["a');
    expect(completions).to.have.lengthOf(19);
  });

  it('returns field names when autocompleting properties', function () {
    const completions = getCompletions('{ $jsonSchema: { properties: { "a', {
      fields: ['_id', 'name', 'age'],
    });
    expect(completions.map((x) => x.label)).to.deep.equal([
      '_id',
      'name',
      'age',
    ]);
  });
});
