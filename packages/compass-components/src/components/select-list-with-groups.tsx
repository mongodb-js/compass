import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';
import { Checkbox } from './leafygreen';
import {
  checkboxStyles,
  checkboxSelectAllStyles,
  containerStyles,
  listHeaderStyles,
  listBodyStyles,
  selectAllLabelStyles,
} from './select-list';
import type { SelectItem } from './select-list';

const groupsStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300] + spacing[100],
  paddingTop: spacing[200],
});

const groupStyles = css({
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[200],
  overflow: 'hidden',
  flexShrink: 0,
});
const groupStylesDark = css({ borderColor: palette.gray.dark2 });

const groupHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing[200]}px ${spacing[300]}px`,
  fontWeight: 700,
  backgroundColor: palette.gray.light3,
});
const groupHeaderStylesDark = css({ backgroundColor: palette.gray.dark3 });

const groupNameStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  flex: 1,
});

const groupCountStyles = css({
  fontSize: 11,
  fontWeight: 600,
  color: palette.gray.dark1,
});

const groupItemStyles = css({
  padding: `${spacing[200]}px ${spacing[300]}px`,
  paddingLeft: spacing[300] + spacing[600],
  borderTop: `1px solid ${palette.gray.light2}`,
});
const groupItemStylesDark = css({ borderColor: palette.gray.dark2 });

export type SelectGroup<T extends SelectItem> = {
  /** Omitted for the items that belong to no group. */
  id?: string;
  name: string | JSX.Element;
  icon?: React.ReactNode;
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
    selectedCount: items.filter((item) => item.selected).length,
  };
}

export function SelectListWithGroups<T extends SelectItem>(
  props: SelectListWithGroupsProps<T>
): React.ReactElement {
  const { groups, label, disabled, onChange } = props;
  const isDarkMode = useDarkMode();

  const items = groups.flatMap((group) => group.items);
  const allState = selectionState(items);

  const setSelected = (predicate: (item: T) => boolean, selected: boolean) => {
    onChange(
      items.map((item) =>
        predicate(item) && !item.disabled ? { ...item, selected } : item
      )
    );
  };

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
      <div className={cx(listBodyStyles, groupsStyles)}>
        {groups.map((group) => {
          const groupState = selectionState(group.items);
          const groupTestId = group.id
            ? `select-list-group-${group.id}`
            : 'select-list-no-group';
          return (
            <div
              key={groupTestId}
              data-testid={groupTestId}
              className={cx(groupStyles, isDarkMode && groupStylesDark)}
            >
              <div
                className={cx(
                  groupHeaderStyles,
                  isDarkMode && groupHeaderStylesDark
                )}
              >
                <Checkbox
                  id={groupTestId}
                  data-testid={`${groupTestId}-checkbox`}
                  aria-label={
                    typeof group.name === 'string'
                      ? `Select all in ${group.name}`
                      : 'Select all in group'
                  }
                  onChange={(e) =>
                    setSelected(
                      (item) => group.items.some((i) => i.id === item.id),
                      e.target.checked
                    )
                  }
                  checked={groupState.checked}
                  indeterminate={groupState.indeterminate}
                  disabled={disabled || groupState.allDisabled}
                />
                <div className={groupNameStyles}>
                  {group.icon}
                  {group.name}
                </div>
                <div
                  className={groupCountStyles}
                  data-testid={`${groupTestId}-count`}
                >
                  {groupState.selectedCount} / {group.items.length}
                </div>
              </div>
              {group.items.map((item) => (
                <div
                  className={cx(
                    groupItemStyles,
                    isDarkMode && groupItemStylesDark
                  )}
                  key={`select-list-item-${item.id}`}
                  data-testid={`select-list-item-${item.id}`}
                >
                  <Checkbox
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
