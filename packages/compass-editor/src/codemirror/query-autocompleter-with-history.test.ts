import { expect } from 'chai';
import { createQueryWithHistoryAutocompleter } from './query-autocompleter-with-history';
import { setupCodemirrorCompleter } from '../../test/completer';
import type { SavedQuery } from '../../dist/codemirror/query-history-autocompleter';
import { createQuery } from './query-history-autocompleter';

describe('query history autocompleter', function () {
  const { getCompletions, cleanup } = setupCodemirrorCompleter(
    createQueryWithHistoryAutocompleter
  );

  const savedQueries: SavedQuery[] = [
    {
      lastExecuted: new Date('2023-06-01T12:00:00Z'),
      queryProperties: {
        filter: { status: 'active' },
      },
    },
    {
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
      lastExecuted: new Date('2023-06-04T18:00:00Z'),
      queryProperties: {
        filter: { isActive: true },
        project: { userId: 1, isActive: 1 },
        collation: { locale: 'simple' },
        sort: { userId: 1 },
        limit: 10,
        maxTimeMS: 500,
      },
    },
    {
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

  it('returns all saved queries as completions on click', async function () {
    expect(
      await getCompletions('{}', savedQueries, undefined, mockOnApply)
    ).to.have.lengthOf(5);
  });

  it('returns combined completions when user starts typing', async function () {
    expect(
      await getCompletions('foo', savedQueries, undefined, mockOnApply)
    ).to.have.lengthOf(50);
  });

  it('completes "any text" when inside a string', async function () {
    const prettifiedSavedQueries = savedQueries.map((query) =>
      createQuery(query)
    );
    expect(
      (
        await getCompletions(
          '{ bar: 1, buz: 2, foo: "b',
          savedQueries,
          undefined,
          mockOnApply
        )
      ).map((completion) => completion.label)
    ).to.deep.eq(['bar', '1', 'buz', '2', 'foo', ...prettifiedSavedQueries]);
  });
});
