import {
  Icon,
  css,
  spacing,
  useHoverState,
} from '@mongodb-js/compass-components';
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import React, { useCallback } from 'react';
import SidebarDatabasesNavigation from '../../sidebar-databases-navigation';

const iconStyles = css({
  flex: 'none',
});

const openConnectionNameStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const openConnectionStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  borderRadius: spacing[1],
  padding: spacing[1],
  paddingLeft: spacing[2],
  alignItems: 'center',
  cursor: 'pointer',
  marginTop: 'auto',
});

export function OpenConnection({
  connectionInfo,
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  connectionInfo: ConnectionInfo;
  onToggle: (isExpanded: boolean) => void;
}): React.ReactElement {
  const [hoverProps] = useHoverState();
  const onClick = useCallback(() => {
    if (!isExpanded) onToggle(true);
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

  const connectionIcon = (
    <Icon size={spacing[3]} className={iconStyles} glyph="Favorite" />
  ); // TODO: icons
  return (
    <li
      {...hoverProps}
      className={openConnectionStyles}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="treeitem"
    >
      {isExpanded ? (
        <Icon size={spacing[3]} className={iconStyles} glyph="CaretDown" />
      ) : (
        <Icon size={spacing[3]} className={iconStyles} glyph="CaretRight" />
      )}
      {connectionIcon}{' '}
      <div className={openConnectionNameStyles}>
        {getConnectionTitle(connectionInfo)}
      </div>
      <SidebarDatabasesNavigation />
    </li>
  );
}
