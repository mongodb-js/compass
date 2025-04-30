import React, { useMemo } from 'react';
import {
  useConnectionColor,
  DefaultColorCode,
} from '@mongodb-js/connection-form';
import { palette, useDarkMode } from '@mongodb-js/compass-components';
import type { SidebarTreeItem } from './tree-data';

type AcceptedStyles = {
  '--item-bg-color'?: string;
  '--item-bg-color-hover'?: string;
  '--item-bg-color-active'?: string;
  '--item-color'?: string;
  '--item-color-active'?: string;
};

export default function StyledNavigationItem({
  item,
  children,
}: {
  item: SidebarTreeItem;
  children: React.ReactChild;
}): React.ReactElement {
  const isDarkMode = useDarkMode();
  const { connectionColorToHex, connectionColorToHexActive } =
    useConnectionColor();
  const { colorCode } = item;
  const inactiveColor = useMemo(
    () => (isDarkMode ? palette.gray.light1 : palette.gray.dark1),
    [isDarkMode]
  );

  const style: React.CSSProperties & AcceptedStyles = useMemo(() => {
    const style: AcceptedStyles = {};
    const isDisconnectedConnection =
      item.type === 'connection' && item.connectionStatus !== 'connected';

    const isNonExistentNamespace =
      (item.type === 'database' || item.type === 'collection') &&
      item.isNonExistent;

    if (colorCode && colorCode !== DefaultColorCode) {
      style['--item-bg-color'] = connectionColorToHex(colorCode);
      style['--item-bg-color-hover'] = connectionColorToHexActive(colorCode);
      style['--item-bg-color-active'] = connectionColorToHexActive(colorCode);
    }

    if (isDisconnectedConnection) {
      style['--item-color'] = inactiveColor;
      const connectionInfo = item.connectionInfo;
      if (
        connectionInfo.atlasMetadata?.clusterState === 'DELETING' ||
        connectionInfo.atlasMetadata?.clusterState === 'PAUSED' ||
        connectionInfo.atlasMetadata?.clusterState === 'CREATING'
      ) {
        style['--item-color-active'] = inactiveColor;
      }
    }

    // For a non-existent namespace, even if its active, we show it as inactive
    if (isNonExistentNamespace) {
      style['--item-color'] = inactiveColor;
      style['--item-color-active'] = inactiveColor;
    }
    return style;
  }, [
    inactiveColor,
    item,
    colorCode,
    connectionColorToHex,
    connectionColorToHexActive,
  ]);

  return <div style={style}>{children}</div>;
}
