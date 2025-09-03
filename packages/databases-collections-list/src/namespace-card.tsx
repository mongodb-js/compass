/* eslint-disable react/prop-types */
import React, { useCallback, useMemo } from 'react';
import {
  Card,
  css,
  Icon,
  spacing,
  Subtitle,
  useHoverState,
  Badge,
  Tooltip,
  cx,
  useFocusState,
  FocusState,
  palette,
  mergeProps,
  useDefaultAction,
  ItemActionControls,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type {
  BadgeVariant,
  GlyphName,
  ItemAction,
  SignalPopover,
} from '@mongodb-js/compass-components';
import { NamespaceParam } from './namespace-param';
import type { ViewType } from './use-view-type';
import { usePreferences } from 'compass-preferences-model/provider';

const cardTitleGroup = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[400],
});

const CardTitleGroup: React.FunctionComponent = ({ children }) => {
  return <div className={cardTitleGroup}>{children}</div>;
};

const inferredFromPrivilegesLightStyles = css({
  color: palette.gray.dark1,
});

const inferredFromPrivilegesDarkStyles = css({
  color: palette.gray.base,
});

const inactiveCardStyles = css({
  borderStyle: 'dashed',
  borderWidth: spacing[50],
  '&:hover': {
    borderStyle: 'dashed',
    borderWidth: spacing[50],
  },
});

const tooltipTriggerStyles = css({
  display: 'flex',
});

const cardNameWrapper = css({
  // Workaround for uncollapsible text in flex children
  minWidth: 0,
});

const cardNameDark = css({
  color: palette.green.light2,
});

const cardNameLight = css({
  color: palette.green.dark2,
});

const cardName = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  // To make container 28px to match leafygreen buttons
  paddingTop: 2,
  paddingBottom: 2,
  // TS is very confused if fontWeight is not a number even though it's a valid
  // CSS value
  fontWeight: '600 !important' as unknown as number,
});

const CardName: React.FunctionComponent<{
  children: string;
  inferredFromPrivileges: boolean;
}> = ({ children, inferredFromPrivileges }) => {
  const darkMode = useDarkMode();
  return (
    <div title={children} className={cardNameWrapper}>
      <Subtitle
        as="div"
        className={cx(
          cardName,
          darkMode ? cardNameDark : cardNameLight,
          inferredFromPrivileges &&
            !darkMode &&
            inferredFromPrivilegesLightStyles,
          inferredFromPrivileges && darkMode && inferredFromPrivilegesDarkStyles
        )}
      >
        {children}
      </Subtitle>
    </div>
  );
};

const cardActionContainer = css({
  marginLeft: 'auto',
  flex: 'none',
});

const cardBadges = css({
  display: 'flex',
  gap: spacing[200],
  // Preserving space for when cards with and without badges are mixed in a
  // single row
  minHeight: 20,
});

const CardBadges: React.FunctionComponent = ({ children }) => {
  return <div className={cardBadges}>{children}</div>;
};

const cardBadge = css({
  gap: spacing[100],
});

const cardBadgeLabel = css({});

export type BadgeProp = {
  id: string;
  name: string;
  variant?: BadgeVariant;
  icon?: GlyphName;
  hint?: React.ReactNode;
};

const CardBadge: React.FunctionComponent<BadgeProp> = ({
  id,
  name,
  icon,
  variant,
  hint,
}) => {
  const badge = useCallback(
    ({ className, children, ...props } = {}) => {
      return (
        <Badge
          data-testid={`collection-badge-${id}`}
          className={cx(cardBadge, className)}
          variant={variant}
          {...props}
        >
          {icon && <Icon size="small" glyph={icon}></Icon>}
          <span className={cardBadgeLabel}>{name}</span>
          {/* Tooltip will be rendered here */}
          {children}
        </Badge>
      );
    },
    [id, icon, name, variant]
  );

  if (hint) {
    return <Tooltip trigger={badge}>{hint}</Tooltip>;
  }

  return badge();
};

const card = css({
  padding: spacing[400],
});

export type DataProp = {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  insights?: React.ComponentProps<typeof SignalPopover>['signals'];
};

export type NamespaceItemCardProps = {
  id: string;
  type: 'database' | 'collection';
  viewType: ViewType;
  name: string;
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  data: DataProp[];
  badges?: BadgeProp[] | null;
  inferredFromPrivileges: boolean;
  onItemClick(id: string): void;
  onItemDeleteClick?: (id: string) => void;
};

const namespaceDataGroup = css({
  display: 'flex',
  gap: spacing[200],
  marginTop: spacing[400],
});

const column = css({
  flexDirection: 'column',
});

type NamespaceAction = 'delete';

export const NamespaceItemCard: React.FunctionComponent<
  NamespaceItemCardProps &
    Omit<
      React.HTMLProps<HTMLDivElement>,
      Extract<keyof NamespaceItemCardProps, string>
    >
> = ({
  id,
  type,
  name,
  status,
  data,
  onItemClick,
  onItemDeleteClick,
  badges = null,
  viewType,
  inferredFromPrivileges,
  ...props
}) => {
  const { readOnly, enableDbAndCollStats } = usePreferences([
    'readOnly',
    'enableDbAndCollStats',
  ]);
  const darkMode = useDarkMode();
  const [hoverProps, isHovered] = useHoverState();
  const [focusProps, focusState] = useFocusState();

  const onDefaultAction = useCallback(() => {
    onItemClick(id);
  }, [onItemClick, id]);

  const hasDeleteHandler = !!onItemDeleteClick;
  const cardActions: ItemAction<NamespaceAction>[] = useMemo(() => {
    return readOnly || !hasDeleteHandler || inferredFromPrivileges
      ? []
      : [
          {
            action: 'delete',
            label: `Delete ${type}`,
            icon: 'Trash',
          },
        ];
  }, [type, readOnly, inferredFromPrivileges, hasDeleteHandler]);

  const defaultActionProps = useDefaultAction(onDefaultAction);

  const onAction = useCallback(
    (action: NamespaceAction) => {
      if (action === 'delete') {
        onItemDeleteClick?.(id);
      }
    },
    [onItemDeleteClick, id]
  );

  const badgesGroup = badges && (
    <CardBadges>
      {badges.map((badge) => {
        return <CardBadge key={badge.id} {...badge}></CardBadge>;
      })}
    </CardBadges>
  );

  const cardProps = mergeProps(
    {
      className: cx(
        card,
        inferredFromPrivileges && [
          !darkMode && inferredFromPrivilegesLightStyles,
          darkMode && inferredFromPrivilegesDarkStyles,
          inactiveCardStyles,
        ]
      ),
    },
    defaultActionProps,
    hoverProps,
    focusProps,
    props
  );

  const isButtonVisible =
    [FocusState.FocusVisible, FocusState.FocusWithinVisible].includes(
      focusState
    ) || isHovered;

  return (
    // @ts-expect-error the error here is caused by passing children to Card
    // component, even though it's allowed on the implementation level the types
    // are super confused and don't allow that
    <Card
      key={id}
      contentStyle="clickable"
      data-testid={`${type}-grid-item`}
      data-id={id}
      {...cardProps}
    >
      <CardTitleGroup>
        <CardName inferredFromPrivileges={inferredFromPrivileges}>
          {name}
        </CardName>

        {inferredFromPrivileges && (
          <Tooltip
            align="bottom"
            justify="start"
            trigger={
              <div className={tooltipTriggerStyles}>
                <Icon glyph={'InfoWithCircle'} />
              </div>
            }
          >
            Your privileges grant you access to this namespace, but it might not
            currently exist
          </Tooltip>
        )}

        {viewType === 'list' && badgesGroup}

        <ItemActionControls
          data-testid="namespace-card-actions"
          isVisible={isButtonVisible && cardActions.length > 0}
          actions={cardActions}
          onAction={onAction}
          className={cardActionContainer}
        ></ItemActionControls>
      </CardTitleGroup>

      {viewType === 'grid' && badgesGroup}

      {enableDbAndCollStats && (
        <div className={cx(namespaceDataGroup, viewType === 'grid' && column)}>
          {data.map(({ label, value, hint, insights }, idx) => {
            return (
              <NamespaceParam
                key={idx}
                label={label}
                hint={!inferredFromPrivileges && hint}
                value={value}
                status={status}
                viewType={viewType}
                insights={insights}
              ></NamespaceParam>
            );
          })}
        </div>
      )}
    </Card>
  );
};
