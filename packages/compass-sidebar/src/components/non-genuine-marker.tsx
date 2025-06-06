import React from 'react';

import {
  Badge,
  BadgeVariant,
  Icon,
  css,
  cx,
  spacing,
  focusRing,
} from '@mongodb-js/compass-components';

const nonGenuineMarkerContainer = css({
  lineHeight: 1,
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

const nonGenuineMarkerButton = css({
  all: 'unset',
  background: 'inherit',
  padding: 0,
  margin: 0,
  border: 'none',
  cursor: 'pointer',
});

export default function NonGenuineMarker({
  isGenuine,
  showNonGenuineModal,
}: {
  isGenuine?: boolean;
  showNonGenuineModal: () => void;
}) {
  // isGenuine === undefined means we haven't loaded the info yet
  if (isGenuine !== false) {
    return null;
  }

  return (
    <div className={nonGenuineMarkerContainer}>
      <button
        type="button"
        data-testid="non-genuine-information"
        className={cx(nonGenuineMarkerButton, focusRing)}
        onClick={showNonGenuineModal}
      >
        <Badge variant={BadgeVariant.Yellow}>
          <Icon glyph="Warning" />
          Non-genuine MongoDB
        </Badge>
      </button>
    </div>
  );
}
