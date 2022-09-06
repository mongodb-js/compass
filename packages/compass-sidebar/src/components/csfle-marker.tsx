import React from 'react';
import {
  css,
  cx,
  Icon,
  Badge,
  BadgeVariant,
  focusRing,
  spacing,
} from '@mongodb-js/compass-components';

const badgeContainerStyles = css({
  padding: `0 ${spacing[3]}px ${spacing[2]}px`,
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
  if (!csfleMode || csfleMode === 'unavailable') {
    return null;
  }

  return (
    <div className={badgeContainerStyles}>
      <button
        type="button"
        data-testid="fle-connection-configuration"
        aria-label="Open connection In-Use Encryption configuration"
        title="Connection In-Use Encryption configuration"
        className={cx(badgeButtonStyles, focusRing)}
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
