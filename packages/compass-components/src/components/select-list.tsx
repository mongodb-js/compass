import React, { useCallback } from 'react';
import { Checkbox } from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';

const checkboxStyles = css({
  padding: spacing[100],
});

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

const listHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  fontWeight: 600,
  borderBottom: `${spacing[100]}px solid ${palette.gray.light2}`,
  flexShrink: 0,
  padding: `${spacing[100]}px 0px`,
});
const listBodyStyles = css({
  overflow: 'auto',
});
const listItemStyles = css({
  padding: `${spacing[100]}px 0px`,
});

type SelectItem = {
  id: string;
  selected: boolean;
};

type SelectListProps<T extends SelectItem> = {
  items: T[];
  label: { 
		displayLabelKey: string & keyof T;
		ariaLabelKey: string & keyof T;
		name: string | JSX.Element
	};
  onChange: (newList: T[]) => void;
  disabled?: boolean;
  className?: string;
};

export function SelectList<T extends SelectItem>(
  props: SelectListProps<T>
): React.ReactElement {
  const { items, label, disabled, onChange } = props;

  const isDarkMode = useDarkMode();
  const evenRowStyles = isDarkMode
    ? css({ backgroundColor: palette.gray.dark3 })
    : css({ backgroundColor: palette.gray.light3 });

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
    <div className={cx(props.className, containerStyles)}>
      <div className={listHeaderStyles}>
        <Checkbox
          className={cx(checkboxStyles, css({ paddingRight: 0 }))}
          data-testid="select-table-all-checkbox"
          aria-label="Select all"
          onChange={handleSelectAllChange}
          checked={selectAll}
          indeterminate={!selectAll && !selectNone}
          disabled={disabled}
        />
        <div className={css({ lineHeight: '16px' })}>{label.name}</div>
      </div>
      <div className={listBodyStyles}>
        {items.map((item, index) => (
          <div
            className={cx(listItemStyles, index % 2 === 0 && evenRowStyles)}
            key={`select-table-item-${item.id}`}
            data-testid={`select-table-item-${item.id}`}
          >
            <Checkbox
              className={checkboxStyles}
              key={`select-${item.id}`}
              name={`select-${item.id}`}
              data-testid={`select-${item.id}`}
              label={item[label.displayLabelKey]}
              aria-label={item[label.ariaLabelKey ?? label.displayLabelKey] as string}
							onChange={handleSelectItemChange}
              checked={item.selected}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
