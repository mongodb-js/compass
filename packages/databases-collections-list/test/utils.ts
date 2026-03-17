import {
  userEvent,
  waitFor,
  type screen,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

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
