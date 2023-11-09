import React, { useCallback } from 'react';
import type { MenuAction } from '@mongodb-js/compass-components';
import { cx, useDarkMode } from '@mongodb-js/compass-components';
import {
  Card,
  css,
  useDefaultAction,
  Badge,
  Icon,
  Subtitle,
  spacing,
  palette,
  useFocusState,
  useHoverState,
  mergeProps,
  FocusState,
  ItemActionMenu,
  useFormattedDate,
} from '@mongodb-js/compass-components';
import type { Item } from '../stores/aggregations-queries-items';

export type Action = 'open' | 'delete' | 'copy' | 'rename';

export type SavedItemCardProps = Pick<
  Item,
  'id' | 'type' | 'name' | 'database' | 'collection' | 'lastModified'
> & {
  onAction(id: string, actionName: Action): void;
};

const namespacePart = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  minWidth: 0,
});

const namespaceIconStyles = css({ flex: 'none' });

const namespaceNameStyles = css({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

const NamespacePart: React.FunctionComponent<{
  type: 'database' | 'collection';
  name: string;
}> = ({ type, name }) => {
  return (
    <div className={namespacePart}>
      <Icon
        title={null}
        glyph={type === 'database' ? 'Database' : 'Folder'}
        color={palette.gray.dark1}
        className={namespaceIconStyles}
      ></Icon>
      <span className={namespaceNameStyles}>{name}</span>
    </div>
  );
};

export const CARD_WIDTH = spacing[6] * 4;

export const CARD_HEIGHT = 218;

const card = css({
  // Workaround for uncollapsible text in flex children
  minWidth: 0,
  width: '100%',
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
});

const actionsRow = css({
  display: 'flex',
  alignItems: 'center',
  // Because badge and action button ("...") are of different heights and
  // actions are only shown on condition, we need to have a set size for the
  // container to avoid it jumping when the actions button becomes visible (this
  // size is also not part of leafygreen, so we can't use spacing here)
  minHeight: 28,
  marginBottom: spacing[2],
});

const cardBadge = css({
  flex: 'none',
});

const cardActions = css({
  flex: 'none',
  marginLeft: 'auto',
});

const cardNameDark = css({
  color: palette.green.light2,
});

const cardNameLight = css({
  color: palette.green.dark2,
});

const cardName = css({
  fontWeight: 'bold',
  height: spacing[4] * 2,
  marginBottom: spacing[3],

  // WebkitLineClamp css property is in a very weird state in the spec and
  // requires using deprecated flexbox spec props, but this does work in
  // (Chromium) Electron and is the only way to get multiline text overflow to
  // work using CSS only
  //
  // See: https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

const namespaceGroup = css({
  display: 'grid',
  gap: spacing[2],
  marginBottom: spacing[3],
});

const lastModifiedLabel = css({
  fontStyle: 'italic',
});

type SavedItemAction = 'copy' | 'rename' | 'delete';
const savedItemActions: MenuAction<SavedItemAction>[] = [
  { action: 'copy', label: 'Copy' },
  { action: 'rename', label: 'Rename' },
  { action: 'delete', label: 'Delete' },
];

const CardActions: React.FunctionComponent<{
  itemId: string;
  isVisible: boolean;
  onAction: SavedItemCardProps['onAction'];
}> = ({ itemId, isVisible, onAction }) => {
  const onMenuItemClick = useCallback(
    (action: SavedItemAction) => {
      onAction(itemId, action);
    },
    [itemId, onAction]
  );

  return (
    <ItemActionMenu<SavedItemAction>
      data-testid="saved-item-actions"
      isVisible={isVisible}
      actions={savedItemActions}
      onAction={onMenuItemClick}
      // NB: Focus should be preserved inside the card while interactions are
      // happening inside the card DOM tree, otherwise we will have troubles
      // tracking card focus for the virtual grid keyboard navigation
      usePortal={false}
    ></ItemActionMenu>
  );
};

export const SavedItemCard: React.FunctionComponent<
  SavedItemCardProps & React.HTMLProps<HTMLDivElement>
> = ({
  id,
  type,
  name,
  database,
  collection,
  lastModified,
  onAction,
  ...containerProps
}) => {
  const [hoverProps, isHovered] = useHoverState();
  const [focusProps, focusState] = useFocusState();
  const defaultActionProps = useDefaultAction(() => {
    onAction(id, 'open');
  });

  const cardProps = mergeProps(
    { className: card },
    containerProps,
    hoverProps,
    focusProps,
    defaultActionProps
  );

  let badge: string;
  switch (type) {
    case 'query':
      badge = 'find';
      break;
    case 'updatemany':
      badge = 'updatemany';
      break;
    case 'aggregation':
      badge = 'aggregate';
      break;
  }

  const formattedDate = useFormattedDate(lastModified);
  const darkMode = useDarkMode();

  return (
    // @ts-expect-error the error here is caused by passing children to Card
    // component, even though it's allowed on the implementation level the types
    // are super confused and don't allow that
    <Card key={id} contentStyle="clickable" data-id={id} {...cardProps}>
      <div className={actionsRow}>
        <Badge variant="darkgray" className={cardBadge}>
          .{badge}
        </Badge>

        <div className={cardActions}>
          <CardActions
            itemId={id}
            isVisible={
              isHovered ||
              [FocusState.FocusVisible, FocusState.FocusWithinVisible].includes(
                focusState
              )
            }
            onAction={onAction}
          ></CardActions>
        </div>
      </div>
      <Subtitle
        as="div"
        className={cx(cardName, darkMode ? cardNameDark : cardNameLight)}
        title={name}
      >
        {name}
      </Subtitle>
      <div className={namespaceGroup}>
        <NamespacePart type="database" name={database}></NamespacePart>
        <NamespacePart type="collection" name={collection}></NamespacePart>
      </div>
      <div className={lastModifiedLabel}>
        Last&nbsp;modified: {formattedDate}
      </div>
    </Card>
  );
};
