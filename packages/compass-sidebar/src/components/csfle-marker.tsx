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
  lineHeight: 1,
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
});

const badgeButtonStyles = css({
  all: 'unset',
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
