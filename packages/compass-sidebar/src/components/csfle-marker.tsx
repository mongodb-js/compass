import React from 'react';
import {
  css,
  Icon,
  Badge,
  BadgeVariant,
  useFocusRing,
  spacing,
} from '@mongodb-js/compass-components';

const badgeContainerStyles = css({
  padding: `0 ${spacing[3]}px ${spacing[3]}px`,
});

const badgeButtonStyles = css({
  background: 'inherit',
  padding: 0,
  margin: 0,
  border: 'none',
  cursor: 'pointer',
});

export default function CSFLEMarker({
  csfleMode,
  toggleCSFLEModalVisible,
}: {
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
  toggleCSFLEModalVisible: () => void;
}) {
  const focusRingProps = useFocusRing<HTMLButtonElement>();

  if (!csfleMode || csfleMode === 'unavailable') {
    return null;
  }

  return (
    <div className={badgeContainerStyles}>
      <button
        {...focusRingProps}
        type={focusRingProps.type as 'button'}
        data-testid="fle-connection-configuration"
        aria-label="Open connection In-Use Encryption configuration"
        title="Connection In-Use Encryption configuration"
        className={badgeButtonStyles}
        onClick={toggleCSFLEModalVisible}
      >
        <Badge
          variant={
            csfleMode === 'enabled'
              ? BadgeVariant.DarkGray
              : BadgeVariant.LightGray
          }
        >
          <Icon glyph="Key" />
          In-Use Encryption
        </Badge>
      </button>
    </div>
  );
}
