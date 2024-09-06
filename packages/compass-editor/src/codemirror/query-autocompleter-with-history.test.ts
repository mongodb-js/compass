import { expect } from 'chai';
import { createQueryWithHistoryAutocompleter } from './query-autocompleter-with-history';
import { setupCodemirrorCompleter } from '../../test/completer';
import type { SavedQuery } from '../../dist/codemirror/query-history-autocompleter';
import type { Completion } from '@codemirror/autocomplete';

function getQueryHistoryAutocompletions(completions: Readonly<Completion[]>) {
  return completions.filter(
    ({ type }) => type === 'favorite' || type === 'query-history'
  );
}

describe('query history autocompleter', function () {
  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createQueryWithHistoryAutocompleter
  );

  const savedQueries: SavedQuery[] = [
    {
      type: 'recent',
      lastExecuted: new Date('2023-06-01T12:00:00Z'),
      queryProperties: {
        filter: { status: 'active' },
      },
    },
    {
      type: 'recent',
      lastExecuted: new Date('2023-06-02T14:00:00Z'),
      queryProperties: {
        filter: { age: { $gt: 30 } },
        project: { name: 1, age: 1, address: 1 },
        collation: { locale: 'en' },
        sort: { age: 1 },
        skip: 5,
        limit: 100,
        maxTimeMS: 3000,
      },
    },
    {
      type: 'recent',
      lastExecuted: new Date('2023-06-03T16:00:00Z'),
      queryProperties: {
        filter: { score: { $gte: 85 } },
        project: { studentName: 1, score: 1 },
        sort: { score: -1 },
        hint: { indexName: 'score_1' },
        limit: 20,
        maxTimeMS: 1000,
      },
    },
    {
      type: 'recent',
      lastExecuted: new Date('2023-06-04T18:00:00Z'),
      queryProperties: {
        filter: { isActive: true, score: { $exists: false } },
        project: { userId: 1, isActive: 1 },
        collation: { locale: 'simple' },
        sort: { userId: 1 },
        limit: 10,
        maxTimeMS: 500,
      },
    },
    {
      type: 'recent',
      lastExecuted: new Date('2023-06-05T20:00:00Z'),
      queryProperties: {
        filter: { category: 'electronics' },
        project: { productId: 1, category: 1, price: 1 },
        sort: { price: -1 },
        limit: 30,
        maxTimeMS: 1500,
      },
    },
  ];

  after(cleanup);

  const mockOnApply: (query: SavedQuery['queryProperties']) => any = () => {};

  it('returns all saved queries as completions with default {}', async function () {
    expect(
      await getCompletions('{}', {
        savedQueries,
        options: undefined,
        queryProperty: '',
        onApply: mockOnApply,
        theme: 'light',
      })
    ).to.have.lengthOf(5);
  });

  it('returns all saved queries as completions with empty entry', async function () {
    expect(
      await getCompletions('', {
        savedQueries,
        options: undefined,
        queryProperty: '',
        onApply: mockOnApply,
        theme: 'light',
      })
    ).to.have.lengthOf(5);
  });

  it('returns combined completions that match the prefix of the field', async function () {
    const completions = await getCompletions('scor', {
      savedQueries,
      options: undefined,
      queryProperty: 'filter',
      onApply: mockOnApply,
      theme: 'light',
    });
    const queryHistoryCompletions = getQueryHistoryAutocompletions(completions);

    expect(queryHistoryCompletions).to.have.lengthOf(2);
    expect(completions).to.have.length.greaterThan(
      queryHistoryCompletions.length
    );
  });

  it('returns completions that match with multiple fields', async function () {
    const completions = getQueryHistoryAutocompletions(
      await getCompletions('{ price: 1, category: 1', {
        savedQueries,
        options: undefined,
        queryProperty: 'project',
        onApply: mockOnApply,
        theme: 'light',
      })
    );
    expect(completions).to.have.lengthOf(1);
    expect(completions[0].label).to.equal(`{
  productId: 1,
  category: 1,
  price: 1
}`);
  });

  it('does not return fields that match in other query properties', async function () {
    const completions = getQueryHistoryAutocompletions(
      await getCompletions('local', {
        savedQueries,
        options: undefined,
        queryProperty: 'project',
        onApply: mockOnApply,
        theme: 'light',
      })
    );

    const queryHistoryCompletions = getQueryHistoryAutocompletions(completions);
    expect(queryHistoryCompletions).to.have.lengthOf(0);
  });

  it('completes regular query autocompletion items', async function () {
    // 'foo' matches > 45 methods and fields in the query autocompletion.
    const completions = (
      await getCompletions('foo', {
        savedQueries,
        options: undefined,
        queryProperty: '',
        onApply: mockOnApply,
        theme: 'light',
      })
    ).filter(({ type }) => type !== 'favorite' && type !== 'query-history');

    expect(completions).to.have.length.greaterThan(40);
  });

  it('completes fields inside a string', async function () {
    expect(
      (
        await getCompletions('{ bar: 1, buz: 2, foo: "b', {
          savedQueries,
          options: undefined,
          queryProperty: '',
          onApply: mockOnApply,
          theme: 'light',
        })
      ).map((completion) => completion.label)
    ).to.deep.eq(['bar', '1', 'buz', '2', 'foo']);
  });
});
