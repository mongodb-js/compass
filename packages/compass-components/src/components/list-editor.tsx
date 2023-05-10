import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { IconButton, Icon } from './leafygreen';

const listEditorStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const listItemStyles = css({
  alignItems: 'center',
  display: 'flex',
  gap: spacing[1],
});

const itemContentStyles = css({
  flexGrow: 1,
});

type ListEditorProps<ItemType> = {
  // Array of items to be edited.
  items: ItemType[];
  // Render function for each item fieldset.
  renderItem: (item: ItemType, index: number) => JSX.Element;
  // Function that defines when the add button is disabled, default () => false
  disableAddButton?: (
    item: ItemType,
    index: number,
    items: ItemType[]
  ) => boolean;
  // Function that defines when the remove button is disabled, default () => items.length === 1
  disableRemoveButton?: (
    item: ItemType,
    index: number,
    items: ItemType[]
  ) => boolean;
  // Callback for the add item button.
  onAddItem: (indexBefore: number) => void;
  // Callback for the remove item button.
  onRemoveItem: (index: number) => void;
  addButtonTestId?: string;
  removeButtonTestId?: string;
  className?: string;
  itemTestId?: (index: number) => string;
  itemKey?: (item: ItemType) => string;
};

function ListEditor<ItemType>({
  disableAddButton,
  disableRemoveButton,
  items,
  renderItem,
  onAddItem,
  onRemoveItem,
  addButtonTestId,
  removeButtonTestId,
  className,
  itemTestId,
  itemKey,
}: ListEditorProps<ItemType>): React.ReactElement {
  return (
    <div className={cx(listEditorStyles, className)}>
      {items.map((item, itemIndex) => (
        <div
          data-testid={itemTestId?.(itemIndex)}
          className={listItemStyles}
          key={itemKey?.(item) ?? itemIndex}
        >
          <div className={itemContentStyles}>{renderItem(item, itemIndex)}</div>
          {!disableAddButton?.(item, itemIndex, items) ? (
            <IconButton
              aria-label="Add"
              type="button"
              data-testid={addButtonTestId}
              disabled={disableAddButton?.(item, itemIndex, items)}
              onClick={() => onAddItem(itemIndex)}
            >
              <Icon glyph="Plus" />
            </IconButton>
          ) : null}
          {!disableRemoveButton?.(item, itemIndex, items) &&
          items.length !== 1 ? (
            <IconButton
              aria-label="Remove"
              type="button"
              data-testid={removeButtonTestId}
              disabled={disableRemoveButton?.(item, itemIndex, items)}
              onClick={() => onRemoveItem(itemIndex)}
            >
              <Icon glyph="Minus" />
            </IconButton>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export { ListEditor };
