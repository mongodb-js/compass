import React, { useCallback } from 'react';
import {
  Cell,
  Checkbox,
  HeaderCell,
  HeaderRow,
  Row,
  Table,
  TableBody,
  TableHead,
} from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { css } from '@leafygreen-ui/emotion';

const checkboxStyles = css({
  padding: spacing[100],
});

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
      <Table shouldAlternateRowColor>
        <TableHead>
          <HeaderRow>
            <HeaderCell key="select-table-all-checkbox">
              <Checkbox
                className={checkboxStyles}
                data-testid="select-table-all-checkbox"
                aria-label="Select all"
                onChange={handleSelectAllChange}
                checked={selectAll}
                indeterminate={!selectAll && !selectNone}
                disabled={disabled}
              />
            </HeaderCell>
            {columns.map((col) => (
              <HeaderCell key={`col-${col[0]}`}>{col[1]}</HeaderCell>
            ))}
          </HeaderRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <Row key={item.id}>
              <Cell>
                <Checkbox
                  className={checkboxStyles}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
