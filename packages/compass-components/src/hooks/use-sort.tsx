import React, { useReducer, useMemo } from 'react';
import { useId } from '@react-aria/utils';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Button, Icon, Label, Option, Select } from '../components/leafygreen';

const controlsContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const label = css({
  // Because leafygreen
  margin: '0 !important',
  padding: '0 !important',
});

const select = css({
  // Because leafygreen
  '& > button': {
    margin: 0,
  },
});

export type SortOrder = 1 | -1;

type SortState<T> = { name: T | null; order: SortOrder };

type SortAction<T> =
  | { type: 'change-name'; name: T | null }
  | { type: 'change-order' };

type SortOptions = {
  isDisabled?: boolean;
};

type Unwrap<T extends ArrayLike<unknown>> = T extends ArrayLike<infer V>
  ? V
  : never;

export function useSortControls<T extends string>(
  items: readonly { name: T; label: string }[],
  options?: SortOptions
): [React.ReactElement, SortState<Unwrap<typeof items>['name']>] {
  const labelId = useId('Sort by');
  const controlId = useId();

  const [sortState, dispatch] = useReducer(
    (state: SortState<T>, action: SortAction<T>): SortState<T> => {
      if (action.type === 'change-name' && action.name !== state.name) {
        return {
          ...state,
          name: action.name,
        };
      }
      if (action.type === 'change-order') {
        return {
          ...state,
          order: (state.order * -1) as SortOrder,
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
      <div className={controlsContainer}>
        <Label id={labelId} htmlFor={controlId} className={label}>
          Sort by
        </Label>
        <Select
          disabled={options?.isDisabled}
          id={controlId}
          aria-labelledby={labelId}
          allowDeselect={false}
          className={select}
          style={{ minWidth: `calc(${longestLabel}ch + ${spacing[6]}px)` }}
          onChange={(value) => {
            dispatch({ type: 'change-name', name: (value as T) || null });
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
          aria-label={glyph}
          title={glyph}
          rightGlyph={<Icon glyph={glyph}></Icon>}
          onClick={() => {
            dispatch({ type: 'change-order' });
          }}
          disabled={sortState.name === null || options?.isDisabled}
        ></Button>
      </div>
    );
  }, [sortState, items, labelId, controlId, options?.isDisabled]);

  return [
    sortControls,
    options?.isDisabled ? { name: null, order: 1 } : sortState,
  ];
}

function sortUnknown(a: unknown, b: unknown, order: SortOrder): number {
  return (a === b ? 0 : (a as number) < (b as number) ? -1 : 1) * order;
}

function sortString(a: string, b: string, order: SortOrder): number {
  return a.localeCompare(b) * order;
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
  sortFn: Partial<{
    [key in keyof T]: (a: T[key], b: T[key], order: SortOrder) => number;
  }> | null = null
): T[] {
  return useMemo(() => {
    return [...items].sort((a, b) => {
      if (!name) {
        return 0;
      }
      // If value we are sorting by doesn't exist on an object, send it all the
      // way to the back of the list
      if (typeof a[name] === 'undefined') {
        return 1;
      }
      const sort = sortFn && sortFn[name];
      // If custom sort is provided for the key, use it
      if (sort) {
        return sort(a[name], b[name], order);
      }
      // Otherwise use default sort method based on the value type
      if (typeof a[name] === 'string') {
        return sortString(a[name] as string, b[name] as string, order);
      }
      return sortUnknown(a[name], b[name], order);
    });
  }, [items, name, sortFn, order]);
}
