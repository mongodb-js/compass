import React, { useState } from 'react';
import type { TypeCastTypes } from 'hadron-type-checker';
import { Menu, MenuItem } from '@leafygreen-ui/menu';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { FontAwesomeIcon } from './font-awesome-icon';

const buttonReset = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
});

export const EditActions: React.FunctionComponent<{
  onRemove?: (() => void) | null;
  onRevert?: (() => void) | null;
  editing?: boolean;
}> = ({ editing, onRemove, onRevert }) => {
  return (
    <>
      {editing &&
        (onRevert ? (
          <button
            data-testid="hadron-document-revert"
            className={buttonReset}
            aria-label="Revert changes"
            onClick={(evt) => {
              evt.stopPropagation();
              onRevert();
            }}
          >
            <FontAwesomeIcon icon="revert"></FontAwesomeIcon>
          </button>
        ) : onRemove ? (
          <button
            data-testid="hadron-document-remove"
            className={buttonReset}
            aria-label="Remove field"
            onClick={(evt) => {
              evt.stopPropagation();
              onRemove();
            }}
          >
            <FontAwesomeIcon icon="remove"></FontAwesomeIcon>
          </button>
        ) : null)}
    </>
  );
};

const addFieldButton = css({
  display: 'block',
  width: spacing[3],
  height: spacing[3],
  marginLeft: 'auto',
  boxShadow: `inset 0 0 0 1px currentColor`,
  borderRadius: '2px',
  userSelect: 'none',
});

const menu = css({
  width: 'auto',
  // Replicating leafygreen ~200px but as a min width instead of static width
  minWidth: spacing[6] * 3,
});

const menuItem = css({
  // Make sure labels are not collapsing
  whiteSpace: 'nowrap',
});

export const AddFieldActions: React.FunctionComponent<{
  type: TypeCastTypes;
  parentType?: TypeCastTypes;
  editing?: boolean;
  keyName: string;
  onAddFieldToElement?: () => void;
  onAddFieldAfterElement: () => void;
}> = ({
  editing,
  type,
  parentType,
  keyName,
  onAddFieldToElement,
  onAddFieldAfterElement,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!editing) {
    return null;
  }

  return (
    <Menu
      open={isOpen}
      setOpen={setIsOpen}
      usePortal={false}
      popoverZIndex={999999}
      align="bottom"
      justify="start"
      className={menu}
      trigger={({
        children,
        onClick,
        ...props
      }: Omit<React.HTMLProps<HTMLButtonElement>, 'type'>) => {
        return (
          <>
            <button
              data-testid="hadron-document-add-element"
              className={cx(buttonReset, addFieldButton)}
              onClick={(evt) => {
                evt.stopPropagation();
                onClick?.(evt);
              }}
              {...props}
            >
              +
            </button>
            {children}
          </>
        );
      }}
    >
      {onAddFieldToElement && (
        <MenuItem
          data-testid="hadron-document-add-child"
          onClick={() => {
            setIsOpen(false);
            onAddFieldToElement();
          }}
          className={menuItem}
        >
          <FontAwesomeIcon icon="addChild"></FontAwesomeIcon>&nbsp;Add{' '}
          {type === 'Array' ? 'item' : 'field'} to <b>{keyName}</b>
        </MenuItem>
      )}
      <MenuItem
        data-testid="hadron-document-add-sibling"
        onClick={() => {
          setIsOpen(false);
          onAddFieldAfterElement();
        }}
        className={menuItem}
      >
        <FontAwesomeIcon icon="addSibling"></FontAwesomeIcon>&nbsp;Add{' '}
        {parentType === 'Array' ? 'item' : 'field'} after <b>{keyName}</b>
      </MenuItem>
    </Menu>
  );
};
