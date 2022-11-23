import React, { useState } from 'react';
import type { TypeCastTypes } from 'hadron-type-checker';
import { Menu, MenuItem } from '@leafygreen-ui/menu';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Icon } from '../leafygreen';
import { documentTypography } from './typography';

const buttonReset = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
});

const editActionIconStyle = css({
  position: 'absolute',
  top: 2,
  right: 0,
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
            type="button"
            data-testid="hadron-document-revert"
            className={buttonReset}
            aria-label="Revert changes"
            title="Revert changes"
            onClick={(evt) => {
              evt.stopPropagation();
              onRevert();
            }}
          >
            <Icon
              size="xsmall"
              className={editActionIconStyle}
              glyph="Undo"
            ></Icon>
          </button>
        ) : onRemove ? (
          <button
            type="button"
            data-testid="hadron-document-remove"
            className={buttonReset}
            title="Remove field"
            aria-label="Remove field"
            onClick={(evt) => {
              evt.stopPropagation();
              onRemove();
            }}
          >
            <Icon
              size="xsmall"
              glyph="Trash"
              className={editActionIconStyle}
            ></Icon>
          </button>
        ) : null)}
    </>
  );
};

const addFieldButton = css({
  display: 'block',
  width: documentTypography.lineHeight,
  height: documentTypography.lineHeight,
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
              type="button"
              data-testid="hadron-document-add-element"
              title="Add field"
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
          glyph={<Icon glyph="Relationship"></Icon>}
          className={menuItem}
        >
          <div>
            Add {type === 'Array' ? 'item' : 'field'} to <b>{keyName}</b>
          </div>
        </MenuItem>
      )}
      <MenuItem
        data-testid="hadron-document-add-sibling"
        onClick={() => {
          setIsOpen(false);
          onAddFieldAfterElement();
        }}
        glyph={<Icon glyph="PlusWithCircle"></Icon>}
        className={menuItem}
      >
        <div>
          Add {parentType === 'Array' ? 'item' : 'field'} after <b>{keyName}</b>
        </div>
      </MenuItem>
    </Menu>
  );
};
