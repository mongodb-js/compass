import {
  Icon,
  IconButton,
  css,
  palette,
  spacing,
  useHoverState,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import React, { useCallback } from 'react';
import ServerIcon from '../icons/server-icon';

const iconStyles = css({
  flex: 'none',
});

const toggleBtnStyles = css({
  color: palette.gray.dark2,
  backgroundColor: 'none',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: 'none',
    boxShadow: 'none',
  },
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
  padding: spacing[1],
  borderRadius: spacing[1],

  '&:hover': {
    backgroundColor: 'var(--item-bg-color-hover)',
  },
});

const activeConnectionStyles = css({
  gap: spacing[2],
  alignItems: 'center',
  marginTop: 'auto',
});

const databasesStyles = css({
  height: `calc(100% - ${spacing[4]}px)`,
  padding: spacing[1],
  alignItems: 'center',
  marginTop: 'auto',
  height: '100%',
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
  const [hoverProps, isHovered] = useHoverState();

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
      if (e.target === e.currentTarget && [' ', 'Enter'].includes(e.key))
        onToggle(!isExpanded);
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
          <IconButton
            aria-label="Collapse"
            title="Collapse"
            tabIndex={-1}
            onClick={onCollapse}
            className={toggleBtnStyles}
          >
            <Icon size={spacing[3]} className={iconStyles} glyph="CaretDown" />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Expand"
            title="Expand"
            tabIndex={-1}
            className={toggleBtnStyles}
          >
            <Icon size={spacing[3]} className={iconStyles} glyph="CaretRight" />
          </IconButton>
        )}
        {connectionIcon}{' '}
        <div className={activeConnectionNameStyles}>{connection.title}</div>
        <div style={{ visibility: isHovered ? 'visible' : 'hidden' }}>
          <IconButton
            data-testid="options-button"
            aria-label="Options"
            title="Options"
          >
            <Icon glyph="Ellipsis" />
          </IconButton>
        </div>
      </div>
      {isExpanded && (
        <div className={databasesStyles}>Databases placeholder</div>
      )}
    </li>
  );
}
