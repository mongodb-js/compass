import React, { useMemo } from 'react';
import {
  useConnectionColor,
  DefaultColorCode,
} from '@mongodb-js/connection-form';
import { palette, useDarkMode } from '@mongodb-js/compass-components';
import { getConnectionId, type SidebarTreeItem } from './tree-data';
import { useConnectable } from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';

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
  const showDisabledConnections = !!usePreference('showDisabledConnections');
  const isDarkMode = useDarkMode();
  const { connectionColorToHex, connectionColorToHexActive } =
    useConnectionColor();
  const { colorCode } = item;
  const inactiveColor = useMemo(
    () => (isDarkMode ? palette.gray.light1 : palette.gray.dark1),
    [isDarkMode]
  );
  const getConnectable = useConnectable();

  const style: React.CSSProperties & AcceptedStyles = useMemo(() => {
    const style: AcceptedStyles = {};
    const connectionId = getConnectionId(item);
    const isConnectable =
      !showDisabledConnections || getConnectable(connectionId);
    const isDisconnectedConnection =
      item.type === 'connection' && item.connectionStatus !== 'connected';
    const inferredFromPrivilegesNamespace =
      (item.type === 'database' || item.type === 'collection') &&
      item.inferredFromPrivileges;

    if (colorCode && colorCode !== DefaultColorCode) {
      style['--item-bg-color'] = connectionColorToHex(colorCode);
      style['--item-bg-color-hover'] = connectionColorToHexActive(colorCode);
      style['--item-bg-color-active'] = connectionColorToHexActive(colorCode);
    }

    if (
      isDisconnectedConnection ||
      inferredFromPrivilegesNamespace ||
      !isConnectable
    ) {
      style['--item-color'] = inactiveColor;
    }

    // We always show these as inactive
    if (inferredFromPrivilegesNamespace || !isConnectable) {
      style['--item-color-active'] = inactiveColor;
    }
    return style;
  }, [
    inactiveColor,
    item,
    colorCode,
    getConnectable,
    showDisabledConnections,
    connectionColorToHex,
    connectionColorToHexActive,
  ]);

  return <div style={style}>{children}</div>;
}
