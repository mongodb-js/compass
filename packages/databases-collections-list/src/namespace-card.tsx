/* eslint-disable react/prop-types */
import {
  Card,
  css,
  Icon,
  IconButton,
  spacing,
  Subtitle,
  useHoverState,
  Badge,
  BadgeVariant,
  IconGlyph,
  Tooltip,
  cx,
  useFocusState,
  FocusState,
  uiColors,
} from '@mongodb-js/compass-components';
import React, { useCallback } from 'react';
import { mergeProps } from './merge-props';
import { NamespaceParam } from './namespace-param';
import { ItemType } from './use-create';
import { ViewType } from './use-view-type';

function useDefaultAction<T>(
  onDefaultAction: (evt: React.KeyboardEvent<T> | React.MouseEvent<T>) => void
): React.HTMLAttributes<T> {
  // Prevent event from possibly causing bubbled focus on parent element, if
  // something is interacting with this component using mouse, we want to
  // prevent anything from bubbling
  const onMouseDown = useCallback((evt: React.MouseEvent<T>) => {
    evt.preventDefault();
    evt.stopPropagation();
  }, []);

  const onClick = useCallback(
    (evt: React.MouseEvent<T>) => {
      evt.stopPropagation();
      onDefaultAction(evt);
    },
    [onDefaultAction]
  );

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<T>) => {
      if (
        // Only handle keyboard events if they originated on the element
        evt.target === evt.currentTarget &&
        [' ', 'Enter'].includes(evt.key)
      ) {
        evt.preventDefault();
        evt.stopPropagation();
        onDefaultAction(evt);
      }
    },
    [onDefaultAction]
  );

  return { onMouseDown, onClick, onKeyDown };
}

const cardTitleGroup = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
  marginBottom: spacing[2],
});

const CardTitleGroup: React.FunctionComponent = ({ children }) => {
  return <div className={cardTitleGroup}>{children}</div>;
};

const cardNameWrapper = css({
  // Workaround for uncollapsible text in flex children
  minWidth: 0,
});

const cardName = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  // To make container 28px to match leafygreen buttons
  paddingTop: 2,
  paddingBottom: 2,
  // Because leafygreen
  color: `${uiColors.green.dark1} !important`,
  // TS is very confused if fontWeight is not a number even though it's a valid
  // CSS value
  fontWeight: '600 !important' as unknown as number,
});

const CardName: React.FunctionComponent<{ children: string }> = ({
  children,
}) => {
  return (
    <div title={children} className={cardNameWrapper}>
      <Subtitle as="div" className={cardName}>
        {children}
      </Subtitle>
    </div>
  );
};

const cardActionContainer = css({
  marginLeft: 'auto',
  flex: 'none',
});

const CardActionContainer: React.FunctionComponent = ({ children }) => {
  return <div className={cardActionContainer}>{children}</div>;
};

const cardBadges = css({
  display: 'flex',
  gap: spacing[2],
  // Preserving space for when cards with and without badges are mixed in a
  // single row
  minHeight: 20,
});

const CardBadges: React.FunctionComponent = ({ children }) => {
  return <div className={cardBadges}>{children}</div>;
};

const cardBadge = css({
  gap: spacing[1],
});

const cardBadgeLabel = css({});

export type BadgeProp = {
  name: string;
  variant?: BadgeVariant;
  icon?: IconGlyph;
  hint?: React.ReactNode;
};

const CardBadge: React.FunctionComponent<BadgeProp> = ({
  name,
  icon,
  variant,
  hint,
}) => {
  const badge = (
    <Badge className={cardBadge} variant={variant}>
      {icon && <Icon size="small" glyph={icon}></Icon>}
      <span className={cardBadgeLabel}>{name}</span>
    </Badge>
  );

  if (hint) {
    return <Tooltip trigger={badge}>{hint}</Tooltip>;
  }

  return badge;
};

const card = css({
  padding: spacing[3],
});

export type DataProp = {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
};

export type NamespaceItemCardProps = {
  id: string;
  type: ItemType;
  viewType: ViewType;
  name: string;
  status: string;
  data: DataProp[];
  badges?: BadgeProp[] | null;
  onItemClick(id: string): void;
  onItemDeleteClick?: (id: string) => void;
};

const namespaceDataGroup = css({
  display: 'flex',
  gap: spacing[2],
  marginTop: spacing[3],
});

const column = css({
  flexDirection: 'column',
});

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
  ...props
}) => {
  const [hoverProps, isHovered] = useHoverState();
  const [focusProps, focusState] = useFocusState();

  const onDefaultAction = useCallback(() => {
    onItemClick(id);
  }, [onItemClick, id]);

  const defaultActionProps = useDefaultAction(onDefaultAction);

  const onDeleteClick = useCallback(
    (evt) => {
      evt.stopPropagation();
      if (onItemDeleteClick) {
        onItemDeleteClick(id);
      }
    },
    [onItemDeleteClick, id]
  );

  const badgesGroup = badges && (
    <CardBadges>
      {badges.map((badge) => {
        return <CardBadge key={badge.name} {...badge}></CardBadge>;
      })}
    </CardBadges>
  );

  const cardProps = mergeProps(
    { className: card },
    defaultActionProps,
    hoverProps,
    focusProps,
    props
  );

  const isButtonVisible =
    onItemDeleteClick &&
    ([FocusState.FocusVisible, FocusState.FocusWithinVisible].includes(
      focusState
    ) ||
      isHovered);

  return (
    // @ts-expect-error the error here is caused by passing children to Card
    // component, even though it's allowed on the implementation level the types
    // are super confused and don't allow that
    <Card
      key={id}
      contentStyle="clickable"
      data-testid={`${type}-grid-item-${id}`}
      {...cardProps}
    >
      <CardTitleGroup>
        <CardName>{name}</CardName>

        {viewType === 'list' && badgesGroup}

        {isButtonVisible && (
          <CardActionContainer>
            <IconButton
              aria-label={`Delete ${type}`}
              title={`Delete ${type}`}
              onClick={onDeleteClick}
            >
              <Icon glyph="Trash"></Icon>
            </IconButton>
          </CardActionContainer>
        )}
      </CardTitleGroup>

      {viewType === 'grid' && badgesGroup}

      <div className={cx(namespaceDataGroup, viewType === 'grid' && column)}>
        {data.map(({ label, value, hint }, idx) => {
          return (
            <NamespaceParam
              key={idx}
              label={label}
              hint={hint}
              value={value}
              status={status}
              viewType={viewType}
            ></NamespaceParam>
          );
        })}
      </div>
    </Card>
  );
};
