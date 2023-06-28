import React, { useRef, forwardRef, useCallback, useState } from 'react';
import { Button, Icon, IconButton, Menu, MenuItem } from './leafygreen';
import { Tooltip } from './tooltip';
import type { TooltipProps } from './tooltip';
import type { ButtonProps } from '@leafygreen-ui/button';

import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';

export type ItemAction<Action extends string> = {
  action: Action;
  label: string;
  icon: React.ReactChild;
};

export type GroupedItemAction<Action extends string> = ItemAction<Action> & {
  tooltip?: string;
  tooltipProps?: TooltipProps;
};

export type MenuAction<Action extends string> = {
  action: Action;
  label: string;
  icon?: React.ReactChild;
};

const ItemActionButtonSize = {
  XSmall: 'xsmall',
  Small: 'small',
  Default: 'default',
} as const;

type ItemActionButtonSize =
  typeof ItemActionButtonSize[keyof typeof ItemActionButtonSize];

const actionControlsStyle = css({
  flex: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  display: 'flex',
});

const actionGroupButtonStyle = css({
  '&:not(:first-child)': {
    marginLeft: spacing[1],
  },
});

const iconContainerStyle = css({
  display: 'block',
  flex: 'none',
  fontSize: 0,
  lineHeight: 0,
});

// Using important here because leafygreen / emotion applies styles in the order
// that doesn't allow our styles override theirs
const buttonSizeStyle: Record<ItemActionButtonSize, string | undefined> = {
  default: undefined,
  small: css({
    flex: 'none',
    width: `${spacing[4]}px !important`,
    height: `${spacing[4]}px !important`,
  }),
  xsmall: css({
    flex: 'none',
    // aligns with other xsmall components
    width: `${20}px !important`,
    height: `${20}px !important`,
  }),
};

function actionTestId<Action extends string>(
  dataTestId: string | undefined,
  action: Action
) {
  return dataTestId ? `${dataTestId}-${action}-action` : undefined;
}

// As we are using this component to render icon in MenuItem,
// and it does cloneElement on glyph, here we are accepting all the
// props that are passed during clone process.
type IconProps = React.ComponentProps<typeof Icon>;
const ActionGlyph = ({
  glyph,
  size,
  ...props
}: Omit<IconProps, 'size' | 'glyph'> & {
  glyph?: React.ReactChild;
  size?: ItemActionButtonSize;
}) => {
  if (typeof glyph === 'string') {
    return <Icon size={size} glyph={glyph} {...props} />;
  }

  if (React.isValidElement(glyph)) {
    return glyph;
  }

  return null;
};

const ItemActionButton = forwardRef<
  HTMLButtonElement,
  {
    glyph: React.ReactChild;
    label: string;
    title?: string;
    size: ItemActionButtonSize;
    onClick(evt: React.MouseEvent<HTMLButtonElement>): void;
  } & Omit<React.HTMLProps<HTMLButtonElement>, 'size'>
>(function IconButtonSmall(
  { glyph, size, label, onClick, children, title, className, ...rest },
  ref
) {
  return (
    <IconButton
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error leafygreen confuses TS a lot here
      ref={ref}
      className={cx(buttonSizeStyle[size], className)}
      aria-label={label}
      title={title}
      onClick={onClick}
      {...rest}
    >
      <span role="presentation" className={iconContainerStyle}>
        <ActionGlyph glyph={glyph} size={size} />
      </span>
      {/* Only here to make leafygreen menus work */}
      {children}
    </IconButton>
  );
});

export function ItemActionMenu<Action extends string>({
  isVisible = true,
  actions,
  onAction,
  className,
  usePortal,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  'data-testid': dataTestId,
}: {
  actions: MenuAction<Action>[];
  onAction(actionName: Action): void;
  className?: string;
  usePortal?: boolean;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  iconSize?: ItemActionButtonSize;
  isVisible?: boolean;
  'data-testid'?: string;
}) {
  // this ref is used by the Menu component to calculate the height and position
  // of the menu, and by us to give back the focus to the trigger when the menu
  // is closed (https://jira.mongodb.org/browse/PD-1674).
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      if (evt.currentTarget.dataset.menuitem) {
        setIsMenuOpen(false);
        // Workaround for https://jira.mongodb.org/browse/PD-1674
        menuTriggerRef.current?.focus();
      }
      onAction(evt.currentTarget.dataset.action);
    },
    [onAction]
  );

  const shouldRender = isMenuOpen || (isVisible && actions.length > 0);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={cx(actionControlsStyle, className)}>
      <Menu
        open={isMenuOpen}
        setOpen={setIsMenuOpen}
        refEl={menuTriggerRef}
        usePortal={usePortal}
        data-testid={dataTestId}
        trigger={({
          onClick,
          children,
        }: {
          onClick: React.MouseEventHandler<HTMLButtonElement>;
          children: React.ReactNode;
        }) => {
          return (
            <ItemActionButton
              ref={menuTriggerRef}
              size={iconSize}
              glyph="Ellipsis"
              label="Show actions"
              title="Show actions"
              data-testid={
                dataTestId ? `${dataTestId}-show-actions` : undefined
              }
              onClick={(evt) => {
                evt.stopPropagation();
                onClick && onClick(evt);
              }}
              className={cx(actionGroupButtonStyle, iconClassName)}
              style={iconStyle}
            >
              {children}
            </ItemActionButton>
          );
        }}
      >
        {actions.map(({ action, label, icon }) => {
          return (
            <MenuItem
              key={action}
              data-testid={actionTestId<Action>(dataTestId, action)}
              data-action={action}
              data-menuitem={true}
              glyph={<ActionGlyph glyph={icon} size={iconSize} />}
              onClick={onClick}
            >
              {label}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}

export function ItemActionGroup<Action extends string>({
  actions,
  onAction,
  className,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  isVisible = true,
  'data-testid': dataTestId,
}: {
  actions: GroupedItemAction<Action>[];
  onAction(actionName: Action): void;
  className?: string;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  iconSize?: ItemActionButtonSize;
  isVisible?: boolean;
  'data-testid'?: string;
}) {
  const onClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      onAction(evt.currentTarget.dataset.action);
    },
    [onAction]
  );

  const shouldRender = isVisible && actions.length > 0;

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cx(actionControlsStyle, className)}
      data-testid={dataTestId}
    >
      {actions.map(({ action, icon, label, tooltip, tooltipProps }) => {
        const button = (
          <ItemActionButton
            key={action}
            glyph={icon}
            label={label}
            title={!tooltip ? label : undefined}
            size={iconSize}
            data-action={action}
            data-testid={actionTestId<Action>(dataTestId, action)}
            onClick={onClick}
            className={cx(actionGroupButtonStyle, iconClassName)}
            style={iconStyle}
          />
        );

        if (tooltip) {
          return (
            <Tooltip
              key={action}
              {...tooltipProps}
              trigger={({ children, ...props }) => (
                <div {...props} style={{ display: 'inherit' }}>
                  {button}
                  {children}
                </div>
              )}
            >
              {tooltip}
            </Tooltip>
          );
        }

        return button;
      })}
    </div>
  );
}

export function ItemActionControls<Action extends string>({
  isVisible = true,
  actions,
  onAction,
  className,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  usePortal,
  collapseToMenuThreshold = 2,
  'data-testid': dataTestId,
}: {
  isVisible?: boolean;
  actions: ItemAction<Action>[];
  onAction(actionName: Action): void;
  className?: string;
  iconSize?: ItemActionButtonSize;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  collapseToMenuThreshold?: number;
  usePortal?: boolean;
  'data-testid'?: string;
}) {
  if (actions.length === 0) {
    return null;
  }

  const shouldShowMenu = actions.length >= collapseToMenuThreshold;

  if (shouldShowMenu) {
    return (
      <ItemActionMenu
        actions={actions}
        className={cx('item-action-controls', className)}
        data-testid={dataTestId}
        iconClassName={iconClassName}
        iconStyle={iconStyle}
        iconSize={iconSize}
        isVisible={isVisible}
        onAction={onAction}
        usePortal={usePortal}
      ></ItemActionMenu>
    );
  }

  return (
    <ItemActionGroup
      isVisible={isVisible}
      actions={actions}
      onAction={onAction}
      className={cx('item-action-controls', className)}
      iconSize={iconSize}
      data-testid={dataTestId}
      iconClassName={iconClassName}
      iconStyle={iconStyle}
    ></ItemActionGroup>
  );
}

export function DropdownMenuButton<Action extends string>({
  isVisible = true,
  actions,
  onAction,
  usePortal,
  activeAction,
  buttonText,
  buttonProps,
  iconSize = ItemActionButtonSize.Default,
  'data-testid': dataTestId,
}: {
  actions: MenuAction<Action>[];
  onAction(actionName: Action): void;
  usePortal?: boolean;
  iconSize?: ItemActionButtonSize;
  isVisible?: boolean;
  activeAction?: Action;
  'data-testid'?: string;
  buttonText: string;
  buttonProps: ButtonProps;
}) {
  // this ref is used by the Menu component to calculate the height and position
  // of the menu, and by us to give back the focus to the trigger when the menu
  // is closed (https://jira.mongodb.org/browse/PD-1674).
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      if (evt.currentTarget.dataset.menuitem) {
        setIsMenuOpen(false);
        // Workaround for https://jira.mongodb.org/browse/PD-1674
        menuTriggerRef.current?.focus();
      }
      onAction(evt.currentTarget.dataset.action);
    },
    [onAction]
  );

  const shouldRender = isMenuOpen || (isVisible && actions.length > 0);

  if (!shouldRender) {
    return null;
  }

  return (
    <Menu
      open={isMenuOpen}
      setOpen={setIsMenuOpen}
      justify="start"
      refEl={menuTriggerRef}
      usePortal={usePortal}
      data-testid={dataTestId}
      trigger={({
        onClick,
        children,
      }: {
        onClick: React.MouseEventHandler<HTMLButtonElement>;
        children: React.ReactNode;
      }) => {
        return (
          <Button
            {...buttonProps}
            ref={menuTriggerRef}
            data-testid={dataTestId ? `${dataTestId}-show-actions` : undefined}
            onClick={(evt) => {
              evt.stopPropagation();
              onClick && onClick(evt);
            }}
            rightGlyph={<Icon glyph={'CaretDown'} />}
          >
            {buttonText}
            {children}
          </Button>
        );
      }}
    >
      {actions.map(({ action, label, icon }) => {
        return (
          <MenuItem
            active={activeAction === action}
            key={action}
            data-testid={actionTestId<Action>(dataTestId, action)}
            data-action={action}
            data-menuitem={true}
            glyph={<ActionGlyph glyph={icon} size={iconSize} />}
            onClick={onClick}
          >
            {label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
