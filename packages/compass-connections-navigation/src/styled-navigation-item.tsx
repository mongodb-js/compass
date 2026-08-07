import React, { useMemo } from 'react';
import {
  useConnectionColor,
  DefaultColorCode,
} from '@mongodb-js/connection-form';
import { palette, useDarkMode } from '@mongodb-js/compass-components';
import {
  getConnectionId,
  isHiddenTreeItem,
  type SidebarTreeItem,
} from './tree-data';
import { useConnectable } from '@mongodb-js/compass-connections/provider';

type AcceptedStyles = {
  '--item-bg-color'?: string;
  '--item-bg-color-hover'?: string;
  '--item-bg-color-active'?: string;
  '--item-color'?: string;
  '--item-color-active'?: string;
  '--item-font-style'?: string;
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
  // More washed-out than inactiveColor: a hidden namespace that's being
  // shown anyway should read as "don't touch this" at a glance.
  const hiddenColor = palette.gray.base;
  const getConnectable = useConnectable();

  const style: React.CSSProperties & AcceptedStyles = useMemo(() => {
    const style: AcceptedStyles = {};
    const connectionId = getConnectionId(item);
    const isConnectable = getConnectable(connectionId);
    const isDisconnectedConnection =
      item.type === 'connection' && item.connectionStatus !== 'connected';
    const inferredFromPrivilegesNamespace =
      (item.type === 'database' || item.type === 'collection') &&
      item.inferredFromPrivileges;
    const isHidden = isHiddenTreeItem(item);

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

    // Hidden namespaces get their own, more washed-out treatment (takes
    // precedence over the plain inactive styling above).
    if (isHidden) {
      style['--item-color'] = hiddenColor;
      style['--item-color-active'] = hiddenColor;
      style['--item-font-style'] = 'italic';
    }
    return style;
  }, [
    inactiveColor,
    hiddenColor,
    item,
    colorCode,
    getConnectable,
    connectionColorToHex,
    connectionColorToHexActive,
  ]);

  return <div style={style}>{children}</div>;
}
