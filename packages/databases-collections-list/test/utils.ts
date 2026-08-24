import {
  userEvent,
  waitFor,
  type screen,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { DatabaseProps } from 'mongodb-database-model';
import type { CollectionProps } from 'mongodb-collection-model';

export function createDatabase(
  overrides?: Partial<DatabaseProps>
): DatabaseProps {
  const name = overrides?.name ?? 'test';
  return {
    _id: name,
    name: name,
    status: 'ready',
    statusError: null,
    collectionsLength: 35,
    collectionsStatus: 'ready',
    collectionsStatusError: null,
    collection_count: 1,
    collections: [] as any,
    inferred_from_privileges: false,
    document_count: 10,
    storage_size: undefined,
    data_size: 1000,
    index_count: 25,
    index_size: 100,
    ...overrides,
  };
}

export function createCollection(
  overrides?: Partial<CollectionProps>
): CollectionProps {
  const name = overrides?.name ?? 'test';
  return {
    _id: name,
    name: name,
    type: 'collection',
    status: 'ready',
    statusError: null,
    ns: `db.${name}`,
    database: 'db',
    system: true,
    oplog: true,
    command: true,
    special: false,
    specialish: false,
    normal: false,
    readonly: false,
    view_on: null,
    collation: '',
    pipeline: [],
    validation: '',
    properties: [],
    is_capped: false,
    isTimeSeries: false,
    isView: false,
    inferred_from_privileges: false,
    sourceName: null,
    source: {} as any,
    document_count: 10,
    document_size: 11,
    avg_document_size: 150,
    storage_size: undefined,
    free_storage_size: 1000,
    index_count: 15,
    index_size: 16,
    calculated_storage_size: undefined,
    bucket_count: undefined,
    avg_bucket_size: undefined,
    ...overrides,
  };
}

export function createTimeSeries(
  overrides?: Partial<CollectionProps>
): CollectionProps {
  const col = createCollection(overrides);
  return {
    ...col,
    type: 'timeseries' as const,
  };
}

export function inspectTable(_screen: typeof screen, dataTestId: string) {
  const list = _screen.getByTestId(dataTestId);
  const ths = list.querySelectorAll('[data-lgid="lg-table-header"]');
  const trs = list.querySelectorAll('[data-lgid="lg-table-row"]');
  const table = Array.from(trs).map((tr) =>
    Array.from(tr.querySelectorAll('td')).map((td) => td.textContent)
  );

  const columns = Array.from(ths).map((el) => el.textContent);

  const getColumn = (columnName: string) => {
    const columnIndex = columns.indexOf(columnName);
    return table.map((row) => row[columnIndex]);
  };

  return { list, ths, trs, table, columns, getColumn };
}

export async function testSortColumn(
  _screen: typeof screen,
  listId: string,
  columnName: string,
  expectedOrders: string[][]
) {
  // initial order
  let result = inspectTable(_screen, listId);
  expect(result.getColumn(columnName)).to.deep.equal(expectedOrders[0]);

  // descending for numerical columns, ascending for text
  userEvent.click(_screen.getByLabelText(`Sort by ${columnName}`));
  await waitFor(function () {
    result = inspectTable(_screen, listId);
    expect(result.getColumn(columnName)).to.deep.equal(expectedOrders[1]);
  });

  // ascending for numerical columns, descending for text
  userEvent.click(_screen.getByLabelText(`Sort by ${columnName}`));
  await waitFor(function () {
    result = inspectTable(_screen, listId);
    expect(result.getColumn(columnName)).to.deep.equal(expectedOrders[2]);
  });

  // back to initial order
  userEvent.click(_screen.getByLabelText(`Sort by ${columnName}`));
  await waitFor(function () {
    result = inspectTable(_screen, listId);
    expect(result.getColumn(columnName)).to.deep.equal(expectedOrders[0]);
  });
}
