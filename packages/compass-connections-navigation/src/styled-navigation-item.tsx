import React, { useMemo } from 'react';
import {
  useConnectionColor,
  DefaultColorCode,
} from '@mongodb-js/connection-form';
import { usePreference } from 'compass-preferences-model/provider';

export default function StyledNavigationItem({
  colorCode,
  children,
}: {
  colorCode?: string;
  children: React.ReactChild;
}): React.ReactElement {
  const { connectionColorToHex, connectionColorToHexActive } =
    useConnectionColor();
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const style: React.CSSProperties & {
    '--item-bg-color'?: string;
    '--item-bg-color-hover'?: string;
    '--item-bg-color-active'?: string;
  } = useMemo(() => {
    const style: {
      '--item-bg-color'?: string;
      '--item-bg-color-hover'?: string;
      '--item-bg-color-active'?: string;
    } = {};

    if (!isSingleConnection) {
      if (colorCode && colorCode !== DefaultColorCode) {
        style['--item-bg-color'] = connectionColorToHex(colorCode);
        style['--item-bg-color-hover'] = connectionColorToHexActive(colorCode);
        style['--item-bg-color-active'] = connectionColorToHexActive(colorCode);
      }
    }
    return style;
  }, [
    isSingleConnection,
    colorCode,
    connectionColorToHex,
    connectionColorToHexActive,
  ]);

  return <div style={style}>{children}</div>;
}
