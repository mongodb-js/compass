import React, { useMemo } from 'react';
import {
  useConnectionColor,
  DefaultColorCode,
} from '@mongodb-js/connection-form';
import { usePreference } from 'compass-preferences-model/provider';
import { css, spacing } from '@mongodb-js/compass-components';

type AcceptedStyles = {
  '--item-bg-color'?: string;
  '--item-bg-color-hover'?: string;
  '--item-bg-color-active'?: string;
  borderRadius?: string;
};

const styledStyles = css({
  overflow: 'hidden',
});

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

  const style: React.CSSProperties & AcceptedStyles = useMemo(() => {
    const style: AcceptedStyles = {};

    if (!isSingleConnection) {
      style['borderRadius'] = `${spacing[100]}px`;
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

  return (
    <div className={styledStyles} style={style}>
      {children}
    </div>
  );
}
