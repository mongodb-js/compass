import React from 'react';
import { spacing } from '@mongodb-js/compass-components';
import {
  useConnectionColor,
  DefaultColorCode,
} from '@mongodb-js/connection-form';

export default function StyledNavigationItem({
  colorCode,
  isSingleConnection,
  children,
}: {
  colorCode?: string;
  isSingleConnection: boolean;
  children: React.ReactChild;
}): React.ReactElement {
  const { connectionColorToHex, connectionColorToHex_Active } =
    useConnectionColor();
  const style: React.CSSProperties & {
    '--item-bg-color'?: string;
    '--item-bg-color-hover'?: string;
    '--item-bg-color-active'?: string;
  } = {};

  if (!isSingleConnection) {
    if (colorCode && colorCode !== DefaultColorCode) {
      style['--item-bg-color'] = connectionColorToHex(colorCode);
      style['--item-bg-color-hover'] = connectionColorToHex_Active(colorCode);
      style['--item-bg-color-active'] = connectionColorToHex_Active(colorCode);
    }
  }
  return <div style={style}>{children}</div>;
}
