import React, { useMemo } from 'react';
import {
  useConnectionColor,
  DefaultColorCode,
} from '@mongodb-js/connection-form';
import { usePreference } from 'compass-preferences-model/provider';
import { palette, useDarkMode } from '@mongodb-js/compass-components';
import type { SidebarTreeItem } from './tree-data';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';

type AcceptedStyles = {
  '--item-bg-color'?: string;
  '--item-bg-color-hover'?: string;
  '--item-bg-color-active'?: string;
  '--item-color'?: string;
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
  const isSingleConnection = !usePreference('enableMultipleConnectionSystem');
  const { colorCode } = item;
  const isDisconnectedConnection =
    item.type === 'connection' &&
    item.connectionStatus !== ConnectionStatus.Connected;

  const style: React.CSSProperties & AcceptedStyles = useMemo(() => {
    const style: AcceptedStyles = {};

    if (!isSingleConnection) {
      if (colorCode && colorCode !== DefaultColorCode) {
        style['--item-bg-color'] = connectionColorToHex(colorCode);
        style['--item-bg-color-hover'] = connectionColorToHexActive(colorCode);
        style['--item-bg-color-active'] = connectionColorToHexActive(colorCode);
      }

      if (isDisconnectedConnection) {
        style['--item-color'] = isDarkMode
          ? palette.gray.light1
          : palette.gray.dark1;
      }
    }
    return style;
  }, [
    isDarkMode,
    isSingleConnection,
    isDisconnectedConnection,
    colorCode,
    connectionColorToHex,
    connectionColorToHexActive,
  ]);

  return <div style={style}>{children}</div>;
}
