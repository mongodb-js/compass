import React, { useReducer, useMemo } from 'react';
import {
  css,
  Icon,
  spacing,
  Button,
  Select,
  Option,
  Label,
  cx,
} from '@mongodb-js/compass-components';
import { useId } from '@react-aria/utils';

const sortControl = css({
  '&:not(:first-child)': {
    marginLeft: spacing[2],
  },
});

const sortLabel = css({
  // Because leafygreen
  margin: '0 !important',
  padding: '0 !important',
});

const sortSelect = css({
  // Because leafygreen
  '& > button': {
    margin: 0,
  },
});

const sortControlsContainer = css({
  display: 'flex',
  alignItems: 'center',
});
export type SortOrder = 0 | 1 | -1;

type SortState = { name: string | null; order: SortOrder };

type SortAction =
  | { type: 'change-name'; name: string | null }
  | { type: 'change-order' };

export function useSortControls(
  items: { name: string; label: string }[]
): [React.ReactElement, SortState] {
  const sortLabelId = useId();
  const sortControlId = useId();

  const [sortState, dispatch] = useReducer(
    (state: SortState, action: SortAction): SortState => {
      if (action.type === 'change-name' && action.name !== state.name) {
        return {
          name: action.name,
          order: action.name ? (state.order !== 0 ? state.order : 1) : 0,
        };
      }
      if (action.type === 'change-order') {
        return {
          ...state,
          order: state.order === 0 ? 1 : state.order === 1 ? -1 : 0,
        };
      }
      return state;
    },
    { name: items[0]?.name ?? null, order: 1 }
  );

  const sortControls = useMemo(() => {
    const glyph =
      sortState.order === -1
        ? 'SortDescending'
        : sortState.order === 1
        ? 'SortAscending'
        : 'Unsorted';

    const longestLabel = Math.max(...items.map((item) => item.label.length));

    return (
      <div className={sortControlsContainer}>
        <Label id={sortLabelId} htmlFor={sortControlId} className={sortLabel}>
          Sort by
        </Label>
        <Select
          id={sortControlId}
          aria-labelledby={sortLabelId}
          allowDeselect={false}
          className={cx(
            sortControl,
            sortSelect,
            css({ minWidth: `calc(${longestLabel}ch + ${spacing[6]}px)` })
          )}
          onChange={(value) => {
            dispatch({ type: 'change-name', name: value || null });
          }}
          defaultValue={sortState.name ?? undefined}
        >
          {items.map((item) => (
            <Option key={item.name} value={item.name}>
              {item.label}
            </Option>
          ))}
        </Select>
        <Button
          className={sortControl}
          rightGlyph={<Icon glyph={glyph}></Icon>}
          onClick={() => {
            dispatch({ type: 'change-order' });
          }}
          disabled={sortState.name === null}
        ></Button>
      </div>
    );
  }, [items, sortState, sortControlId, sortLabelId]);

  return [sortControls, sortState];
}
export function useSortedItems<T extends Record<string, unknown>>(
  items: T[],
  {
    name,
    order,
  }: {
    name: keyof T | null;
    order: SortOrder;
  },
  sortFn: Partial<
    {
      [key in keyof T]: (a: T[key], b: T[key], order: SortOrder) => number;
    }
  > | null = null
): T[] {
  return useMemo(() => {
    return [...items].sort((a, b) => {
      if (order === 0) {
        return 0;
      }
      if (!name) {
        return 0;
      }
      const sort = sortFn && sortFn[name];
      if (sort) {
        return sort(a[name], b[name], order);
      }
      return (a[name] === b[name] ? 0 : a[name] < b[name] ? -1 : 1) * order;
    });
  }, [items, sortFn, name, order]);
}
