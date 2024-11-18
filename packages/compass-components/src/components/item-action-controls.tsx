import React, {
  useRef,
  forwardRef,
  useCallback,
  useState,
  useMemo,
} from 'react';
import {
  Button,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSeparator,
  Tooltip,
} from './leafygreen';
import type { ButtonProps } from '@leafygreen-ui/button';
import type { glyphs } from '@leafygreen-ui/icon';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { WorkspaceContainer } from './workspace-container';

export type ItemAction<Action extends string> = {
  action: Action;
  label: string;
  icon: keyof typeof glyphs | React.ReactElement;
  variant?: 'default' | 'destructive';
  isDisabled?: boolean;
  disabledDescription?: string;
  tooltip?: string;
  actionButtonClassName?: string;
  /** How to show the item when not collapsed into the menu */
  expandedPresentation?: 'icon' | 'button';
};

export type ItemSeparator = { separator: true };

export type GroupedItemAction<Action extends string> = ItemAction<Action> & {
  tooltip?: string;
  tooltipProps?: Parameters<typeof Tooltip>;
};

export type MenuAction<Action extends string> =
  | {
      action: Action;
      label: string;
      icon?: React.ReactChild;
      variant?: 'default' | 'destructive';
      isDisabled?: boolean;
      disabledDescription?: string;
    }
  | ItemSeparator;

function isSeparatorMenuAction<T extends string, MA extends MenuAction<T>>(
  menuAction: MA | ItemSeparator
): menuAction is ItemSeparator {
  return (menuAction as any).separator;
}

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
    marginLeft: spacing[100],
  },
});

// Action buttons are rendered 4px apart from each other. With this we keep the
// same spacing also when action buttons are rendered alongside action menu
// (happens when collapseAfter prop is specified)
const actionMenuWithActionControlsStyles = css({
  marginLeft: spacing[100],
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
  menuClassName,
  usePortal,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  'data-testid': dataTestId,
}: {
  actions: MenuAction<Action>[];
  onAction(actionName: Action): void;
  className?: string;
  menuClassName?: string;
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
        className={menuClassName}
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
        {actions.map((menuAction, idx) => {
          if (isSeparatorMenuAction(menuAction)) {
            return <MenuSeparator key={`separator-${idx}`} />;
          }

          const {
            action,
            label,
            icon,
            variant,
            isDisabled,
            disabledDescription,
          } = menuAction;

          return (
            <MenuItem
              key={action}
              data-testid={actionTestId<Action>(dataTestId, action)}
              data-action={action}
              data-menuitem={true}
              glyph={<ActionGlyph glyph={icon} size={iconSize} />}
              onClick={onClick}
              variant={variant || 'default'}
              disabled={isDisabled}
              description={isDisabled ? disabledDescription : ''}
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
  actions: (GroupedItemAction<Action> | ItemSeparator)[];
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
      {actions.map((menuItem, idx) => {
        if (isSeparatorMenuAction(menuItem)) {
          return <MenuSeparator key={`separator-${idx}`} />;
        }

        const {
          action,
          icon,
          label,
          isDisabled,
          tooltip,
          tooltipProps,
          actionButtonClassName,
          expandedPresentation = 'icon',
        } = menuItem;
        const button =
          expandedPresentation === 'icon' ? (
            <ItemActionButton
              key={action}
              glyph={icon}
              label={label}
              title={!tooltip ? label : undefined}
              size={iconSize}
              data-action={action}
              data-testid={actionTestId<Action>(dataTestId, action)}
              onClick={onClick}
              className={cx(
                actionGroupButtonStyle,
                iconClassName,
                actionButtonClassName
              )}
              style={iconStyle}
              disabled={isDisabled}
            />
          ) : (
            <Button
              key={action}
              title={!tooltip ? label : undefined}
              size={iconSize}
              data-action={action}
              data-testid={actionTestId<Action>(dataTestId, action)}
              onClick={onClick}
              className={actionButtonClassName}
              style={iconStyle}
              disabled={isDisabled}
            >
              {label}
            </Button>
          );

        if (tooltip) {
          return (
            <Tooltip
              key={action}
              {...tooltipProps}
              trigger={
                <div
                  className={actionGroupButtonStyle}
                  style={{ display: 'inherit' }}
                >
                  {button}
                </div>
              }
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
  menuClassName,
  iconClassName,
  iconStyle,
  iconSize = ItemActionButtonSize.Default,
  usePortal,
  collapseAfter = 0,
  collapseToMenuThreshold = 2,
  'data-testid': dataTestId,
}: {
  isVisible?: boolean;
  actions: (ItemAction<Action> | ItemSeparator)[];
  onAction(actionName: Action): void;
  className?: string;
  menuClassName?: string;
  iconSize?: ItemActionButtonSize;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  // The number of actions to show before collapsing other actions into a menu
  collapseAfter?: number;
  // When using `collapseAfter`, this option is not used.
  collapseToMenuThreshold?: number;
  usePortal?: boolean;
  'data-testid'?: string;
}) {
  const sharedProps = useMemo(
    () => ({
      isVisible,
      onAction,
      className: cx('item-action-controls', className),
      iconClassName,
      iconStyle,
      iconSize,
      'data-testid': dataTestId,
    }),
    [
      isVisible,
      onAction,
      className,
      iconClassName,
      iconStyle,
      iconSize,
      dataTestId,
    ]
  );
  const sharedMenuProps = useMemo(
    () => ({
      menuClassName,
      usePortal,
    }),
    [menuClassName, usePortal]
  );
  if (actions.length === 0) {
    return null;
  }

  // When user wants to show a few actions and collapse the rest into a menu
  if (collapseAfter > 0) {
    const visibleActions = actions.slice(0, collapseAfter);
    const collapsedActions = actions.slice(collapseAfter);
    return (
      <div className={actionControlsStyle}>
        <ItemActionGroup
          actions={visibleActions}
          {...sharedProps}
        ></ItemActionGroup>
        <ItemActionMenu
          actions={collapsedActions}
          {...sharedProps}
          {...sharedMenuProps}
          className={cx(
            actionMenuWithActionControlsStyles,
            sharedProps.className
          )}
        ></ItemActionMenu>
      </div>
    );
  }

  const shouldShowMenu = actions.length >= collapseToMenuThreshold;

  if (shouldShowMenu) {
    return (
      <ItemActionMenu
        actions={actions}
        {...sharedProps}
        {...sharedMenuProps}
      ></ItemActionMenu>
    );
  }

  return <ItemActionGroup actions={actions} {...sharedProps}></ItemActionGroup>;
}

const hiddenOnNarrowStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < 900px)`]:
    {
      display: 'none',
    },
});

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
  hideOnNarrow = true,
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
  hideOnNarrow?: boolean;
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
            title={buttonText}
          >
            <span className={hideOnNarrow ? hiddenOnNarrowStyles : undefined}>
              {buttonText}
            </span>
            {children}
          </Button>
        );
      }}
    >
      {actions.map((menuAction, idx) => {
        if (isSeparatorMenuAction(menuAction)) {
          return <MenuSeparator key={`separator-${idx}`} />;
        }

        const { action, label, icon } = menuAction;
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
