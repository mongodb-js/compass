import React from 'react';
import {
  css,
  cx,
  Icon,
  Badge,
  BadgeVariant,
  focusRing,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';

const badgeContainerStyles = css({
  lineHeight: 1,
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
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
  const t = useTranslation();
  if (!csfleMode || csfleMode === 'unavailable') {
    return null;
  }

  return (
    <div className={badgeContainerStyles}>
      <button
        type="button"
        data-testid="fle-connection-configuration"
        aria-label={t(
          'sidebar.csfleMarker.openConfiguration',
          'Open connection In-Use Encryption configuration'
        )}
        title={t(
          'sidebar.csfleMarker.configuration',
          'Connection In-Use Encryption configuration'
        )}
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
          {t('sidebar.csfleMarker.badge', 'In-Use Encryption')}
        </Badge>
      </button>
    </div>
  );
}
