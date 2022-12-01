import {
  Cell,
  Checkbox,
  Row,
  Table,
  TableHeader,
} from '@mongodb-js/compass-components';
import React, { useCallback } from 'react';

type SelectItem = {
  id: string;
  selected: boolean;
};

type SelectTableProps<T extends SelectItem> = {
  items: T[];
  columns: ReadonlyArray<
    readonly [key: string & keyof T, label: string | JSX.Element]
  >;
  onChange: (newList: T[]) => void;
  disabled?: boolean;
  className?: string;
};

export function SelectTable<T extends SelectItem>(
  props: SelectTableProps<T>
): React.ReactElement {
  const { items, columns, disabled, onChange } = props;

  const selectAll = items.every((item) => item.selected);
  const selectNone = items.every((item) => !item.selected);

  const handleSelectAllChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(
        items.map((item) => ({ ...item, selected: !!e.target.checked }))
      );
    },
    [items, onChange]
  );
  const handleSelectItemChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(
        items.map((item) =>
          e.target.name === `select-${item.id}`
            ? { ...item, selected: !!e.target.checked }
            : item
        )
      );
    },
    [items, onChange]
  );

  return (
    <div className={props.className}>
      <Table
        data={items}
        columns={[
          <TableHeader
            key="select-table-all-checkbox"
            label={
              <Checkbox
                data-testid="select-table-all-checkbox"
                aria-label="Select all"
                onChange={handleSelectAllChange}
                checked={selectAll}
                indeterminate={!selectAll && !selectNone}
                disabled={disabled}
              />
            }
          />,
          ...columns.map((col) => (
            <TableHeader key={`col-${col[0]}`} label={col[1]} />
          )),
        ]}
      >
        {({ datum: item }) => (
          <Row key={item.id}>
            <Cell>
              <Checkbox
                key={`select-${item.id}`}
                name={`select-${item.id}`}
                data-testid={`select-${item.id}`}
                aria-label="Select item in row"
                onChange={handleSelectItemChange}
                checked={item.selected}
                disabled={disabled}
              />
            </Cell>
            {columns.map(([name]) => (
              <Cell
                key={`item-${name}`}
                data-testid={`item-${item.id}-${name}`}
              >
                {item[name]}
              </Cell>
            ))}
          </Row>
        )}
      </Table>
    </div>
  );
}
