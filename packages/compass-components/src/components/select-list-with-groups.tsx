import React, { useCallback } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { Checkbox } from './leafygreen';
import {
  checkboxStyles,
  checkboxSelectAllStyles,
  containerStyles,
  listHeaderStyles,
  listBodyStyles,
  listItemStyles,
  selectAllLabelStyles,
} from './select-list';
import type { SelectItem } from './select-list';

const groupHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  fontWeight: 600,
  padding: `${spacing[100]}px 0px`,
});

const groupCountStyles = css({
  marginLeft: 'auto',
  paddingRight: spacing[200],
  fontWeight: 400,
  color: palette.gray.dark1,
});

export type SelectGroup<T extends SelectItem> = {
  id: string;
  name: string | JSX.Element;
  items: T[];
};

type SelectListWithGroupsProps<T extends SelectItem> = {
  groups: SelectGroup<T>[];
  label: {
    displayLabelKey: string & keyof T;
    ariaLabelKey?: string & keyof T;
    name: string | JSX.Element;
  };
  onChange: (newList: T[]) => void;
  disabled?: boolean;
  className?: string;
};

function selectionState<T extends SelectItem>(items: T[]) {
  const all = items.every((item) => item.selected);
  const none = items.every((item) => !item.selected);
  return {
    checked: all,
    indeterminate: !all && !none,
    allDisabled: items.every((item) => item.disabled),
  };
}

export function SelectListWithGroups<T extends SelectItem>(
  props: SelectListWithGroupsProps<T>
): React.ReactElement {
  const { groups, label, disabled, onChange } = props;

  const items = groups.flatMap((group) => group.items);
  const allState = selectionState(items);

  const setSelected = useCallback(
    (predicate: (item: T) => boolean, selected: boolean) => {
      onChange(
        items.map((item) =>
          predicate(item) && !item.disabled ? { ...item, selected } : item
        )
      );
    },
    [items, onChange]
  );

  return (
    <div className={cx(props.className, containerStyles)}>
      <div className={listHeaderStyles}>
        <Checkbox
          className={cx(checkboxStyles, checkboxSelectAllStyles)}
          id="select-list-all"
          data-testid="select-list-all-checkbox"
          aria-label="Select all"
          onChange={(e) => setSelected(() => true, e.target.checked)}
          checked={allState.checked}
          indeterminate={allState.indeterminate}
          disabled={disabled || allState.allDisabled}
        />
        <div className={selectAllLabelStyles}>{label.name}</div>
      </div>
      <div className={listBodyStyles}>
        {groups.map((group) => {
          const groupState = selectionState(group.items);
          const groupItemIds = new Set(group.items.map((item) => item.id));
          const selectedCount = group.items.filter(
            (item) => item.selected
          ).length;
          return (
            <div
              key={`select-list-group-${group.id}`}
              data-testid={`select-list-group-${group.id}`}
            >
              <div className={groupHeaderStyles}>
                <Checkbox
                  className={cx(checkboxStyles, checkboxSelectAllStyles)}
                  id={`select-list-group-${group.id}`}
                  data-testid={`select-list-group-${group.id}-checkbox`}
                  aria-label={
                    typeof group.name === 'string'
                      ? `Select all in ${group.name}`
                      : 'Select all in group'
                  }
                  onChange={(e) =>
                    setSelected(
                      (item) => groupItemIds.has(item.id),
                      e.target.checked
                    )
                  }
                  checked={groupState.checked}
                  indeterminate={groupState.indeterminate}
                  disabled={disabled || groupState.allDisabled}
                />
                <div className={selectAllLabelStyles}>{group.name}</div>
                <div
                  className={groupCountStyles}
                  data-testid={`select-list-group-${group.id}-count`}
                >
                  {selectedCount}/{group.items.length}
                </div>
              </div>
              {group.items.map((item) => (
                <div
                  className={listItemStyles}
                  key={`select-list-item-${item.id}`}
                  data-testid={`select-list-item-${item.id}`}
                >
                  <Checkbox
                    className={checkboxStyles}
                    id={`select-${item.id}`}
                    name={`select-${item.id}`}
                    data-testid={`select-${item.id}`}
                    label={item[label.displayLabelKey] as React.ReactNode}
                    aria-label={
                      item[
                        label.ariaLabelKey ?? label.displayLabelKey
                      ] as string
                    }
                    onChange={(e) =>
                      setSelected((i) => i.id === item.id, e.target.checked)
                    }
                    checked={item.selected}
                    disabled={item.disabled || disabled}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
