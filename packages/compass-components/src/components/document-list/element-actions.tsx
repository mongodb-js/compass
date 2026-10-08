import React, { forwardRef, useRef, useState } from 'react';
import type { TypeCastTypes } from 'hadron-type-checker';
import { Menu, MenuItem } from '../leafygreen';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Icon } from '../leafygreen';
import { documentTypography } from './typography';
import { useTranslation } from '../../i18n';

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
  const t = useTranslation();
  return (
    <>
      {editing &&
        (onRevert ? (
          <button
            type="button"
            data-testid="hadron-document-revert"
            className={buttonReset}
            aria-label={t('components.elementActions.revert', 'Revert changes')}
            title={t('components.elementActions.revert', 'Revert changes')}
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
            title={t('components.elementActions.removeField', 'Remove field')}
            aria-label={t(
              'components.elementActions.removeField',
              'Remove field'
            )}
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
  minWidth: spacing[1600] * 3,
});

const menuItem = css({
  // Make sure labels are not collapsing
  whiteSpace: 'nowrap',
});

const AddFieldButton = forwardRef(function AddFieldButton(
  { onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>,
  ref: React.Ref<HTMLButtonElement>
) {
  const t = useTranslation();
  return (
    <button
      type="button"
      data-testid="hadron-document-add-element"
      title={t('components.elementActions.addField', 'Add field')}
      className={cx(buttonReset, addFieldButton)}
      onClick={(evt) => {
        evt.stopPropagation();
        onClick?.(evt);
      }}
      {...props}
      ref={ref}
    >
      +
    </button>
  );
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
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  if (!editing) {
    return null;
  }

  if (onAddFieldAfterElement && !onAddFieldToElement) {
    return <AddFieldButton onClick={onAddFieldAfterElement} />;
  }

  return (
    <Menu
      open={isOpen}
      setOpen={setIsOpen}
      align="bottom"
      justify="start"
      className={menu}
      refEl={menuTriggerRef}
      trigger={({
        children,
        ...props
      }: Omit<React.HTMLProps<HTMLButtonElement>, 'type'>) => {
        return (
          <>
            <AddFieldButton {...props} ref={menuTriggerRef} />
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
            {type === 'Array'
              ? t('components.elementActions.addItemTo', 'Add item to')
              : t('components.elementActions.addFieldTo', 'Add field to')}{' '}
            <b>{keyName}</b>
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
          {parentType === 'Array'
            ? t('components.elementActions.addItemAfter', 'Add item after')
            : t(
                'components.elementActions.addFieldAfter',
                'Add field after'
              )}{' '}
          <b>{keyName}</b>
        </div>
      </MenuItem>
    </Menu>
  );
};
