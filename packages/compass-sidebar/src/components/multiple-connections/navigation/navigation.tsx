import {
  useHoverState,
  cx,
  spacing,
  css,
  mergeProps,
  useDefaultAction,
  Icon,
  Tooltip,
} from '@mongodb-js/compass-components';
import React from 'react';

const navigationItem = css({
  cursor: 'pointer',
  color: 'var(--item-color)',
  position: 'relative',
  paddingLeft: spacing[400],

  '&[disabled]': {
    cursor: 'not-allowed',
    color: 'var(--item-color-disabled)',
    backgroundColor: 'var(--item-bg-color-disabled)',
  },

  '&:not([disabled]):hover .item-background': {
    display: 'block',
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  '&:not([disabled]):hover': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },

  svg: {
    flexShrink: 0,
  },
});

const activeNavigationItem = css({
  color: 'var(--item-color-active)',
  fontWeight: 'bold',
  backgroundColor: 'var(--item-bg-color-active)',
});

const itemButtonWrapper = css({
  zIndex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: spacing[200],
  paddingTop: spacing[150],
  paddingBottom: spacing[150],
});

const navigationItemLabel = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const disabledTooltipStyles = css({
  textAlign: 'center',
  display: 'inline-flex',
});

type NavigationItemComponentProps = {
  glyph: string;
  label: string;
  isActive: boolean;
  onClick(): void;
  isDisabled?: boolean;
  disabledTooltip?: string;
};

function NavigationItemComponent({
  onClick: onButtonClick,
  glyph,
  label,
  isActive,
  isDisabled,
  disabledTooltip = 'Item cannot be navigated',
}: NavigationItemComponentProps) {
  const [hoverProps] = useHoverState();
  const defaultActionProps = useDefaultAction(onButtonClick);

  const navigationItemProps = mergeProps(
    {
      className: cx(navigationItem, isActive && activeNavigationItem),
      role: 'button',
      ['aria-label']: label,
      ['aria-current']: isActive,
      ['aria-disabled']: !!isDisabled,
      tabIndex: 0,
      disabled: !!isDisabled,
    },
    hoverProps,
    defaultActionProps
  ) as React.HTMLProps<HTMLDivElement>;

  if (!isDisabled) {
    return (
      <div {...navigationItemProps}>
        <div className={itemButtonWrapper}>
          <Icon glyph={glyph} size="small"></Icon>
          <span className={navigationItemLabel}>{label}</span>
        </div>
      </div>
    );
  }

  return (
    <Tooltip
      align="top"
      justify="middle"
      trigger={({ children, ...props }) => (
        <div {...props} {...navigationItemProps}>
          <div className={itemButtonWrapper}>
            <Icon glyph={glyph} size="small"></Icon>
            <span className={navigationItemLabel}>{label}</span>
          </div>
          {children}
        </div>
      )}
    >
      <span className={disabledTooltipStyles}>{disabledTooltip}</span>
    </Tooltip>
  );
}

export type NavigationItem = {
  id: string;
  glyph: string;
  label: string;
  isActive: boolean;
  isDisabled?: boolean;
  disabledTooltip?: string;
};

export const Navigation: React.FC<{
  items: NavigationItem[];
  onItemClick(item: string): void;
}> = ({ items, onItemClick }) => {
  return (
    <div>
      {items.map((item) => (
        <NavigationItemComponent
          key={item.id}
          onClick={() => onItemClick(item.id)}
          glyph={item.glyph}
          label={item.label}
          isActive={item.isActive}
          isDisabled={item.isDisabled}
          disabledTooltip={item.disabledTooltip}
        />
      ))}
    </div>
  );
};
