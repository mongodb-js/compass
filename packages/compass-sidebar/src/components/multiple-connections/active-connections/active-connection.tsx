import {
  Icon,
  css,
  spacing,
  useHoverState,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import React, { useCallback } from 'react';
import ServerIcon from '../icons/server-icon';

const iconStyles = css({
  flex: 'none',
});

const activeConnectionNameStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const activeConnectionTitleStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  alignItems: 'center',
  cursor: 'pointer',
  marginTop: 'auto',
  padding: `${spacing[2]}px ${spacing[1]}px`,
  borderRadius: spacing[1],

  '&:hover': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },
});

const activeConnectionStyles = css({
  gap: spacing[2],
  alignItems: 'center',
  marginTop: 'auto',
  height: '100%',
});

const databasesStyles = css({
  height: `calc(100% - ${spacing[4]}px)`,
  display: 'flex',
});

export function ActiveConnection({
  connection,
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  connection: ConnectionInfo & { title: string };
  onToggle: (isExpanded: boolean) => void;
}): React.ReactElement {
  const [hoverProps] = useHoverState();

  const isLocalhost = connection.connectionOptions.connectionString.startsWith(
    'mongodb://localhost'
  );
  const isFavorite = connection.savedConnectionType === 'favorite';

  const onExpand = useCallback(() => {
    if (!isExpanded) onToggle(true);
  }, [isExpanded, onToggle]);

  const onCollapse = useCallback(() => {
    if (isExpanded) onToggle(false);
  }, [isExpanded, onToggle]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        !isExpanded &&
        e.target === e.currentTarget &&
        [' ', 'Enter'].includes(e.key)
      )
        onToggle(true);
    },
    [isExpanded, onToggle]
  );

  const connectionIcon = isLocalhost ? (
    <Icon size={spacing[3]} className={iconStyles} glyph="Laptop" />
  ) : isFavorite ? (
    <Icon size={spacing[3]} className={iconStyles} glyph="Favorite" />
  ) : (
    <ServerIcon />
  );
  return (
    <li
      {...hoverProps}
      className={activeConnectionStyles}
      onClick={onExpand}
      onKeyDown={onKeyDown}
      role="treeitem"
    >
      <div className={activeConnectionTitleStyles}>
        {isExpanded ? (
          <Icon
            size={spacing[3]}
            className={iconStyles}
            glyph="CaretDown"
            onClick={onCollapse}
          />
        ) : (
          <Icon size={spacing[3]} className={iconStyles} glyph="CaretRight" />
        )}
        {connectionIcon}{' '}
        <div className={activeConnectionNameStyles}>{connection.title}</div>
      </div>
      {isExpanded && (
        <div className={databasesStyles}>Databases placeholder</div>
      )}
    </li>
  );
}
