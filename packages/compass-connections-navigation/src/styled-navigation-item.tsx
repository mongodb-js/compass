import React from 'react';
import { spacing } from '@mongodb-js/compass-components';
import { useConnectionColor } from '@mongodb-js/connection-form';

export default function StyledNavigationItem({
  colorCode,
  isSingleConnection,
  children,
}: {
  colorCode?: string;
  isSingleConnection: boolean;
  children: React.ReactChild;
}): React.ReactElement {
  const { connectionColorToHex } = useConnectionColor();
  const style: React.CSSProperties & {
    '--item-bg-color'?: string;
    '--item-bg-color-hover'?: string;
    '--item-bg-color-active'?: string;
    '--item-bg-radius'?: number;
  } = {
    '--item-bg-radius': 0,
  };

  if (!isSingleConnection) {
    style['--item-bg-radius'] = spacing[100];
    if (colorCode) {
      style['--item-bg-color'] = connectionColorToHex(colorCode);
      style['--item-bg-color-hover'] = connectionColorToHex(colorCode);
      style['--item-bg-color-active'] = connectionColorToHex(colorCode);
    }
  }
  return <div style={style}>{children}</div>;
}
