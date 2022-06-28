import React from 'react';
import PropTypes from 'prop-types';
import {
  css,
  Icon,
  Badge,
  BadgeVariant,
  mergeProps,
  useFocusRing
} from '@mongodb-js/compass-components';

// Let's not worry too much about styling here until
// the sidebar is redone soon anyway.
const badgeContainerStyles = css({
  padding: '0px 0px 6px 36px'
});

const badgeButtonStyles = css({
  background: 'inherit',
  padding: 0,
  margin: 0,
  border: 'none',
  '&:hover': {
    cursor: 'pointer'
  }
});

function CSFLEMarker({ csfleMode, toggleCSFLEModalVisible }) {
  const focusRingProps = useFocusRing();

  if (!csfleMode || csfleMode === 'unavailable') {
    return null;
  }

  const buttonProps = mergeProps(
    {
      type: 'button',
      'aria-label': 'Open connection In-Use Encryption configuration',
      title: 'Connection In-Use Encryption configuration',
      'data-test-id': 'fle-connection-configuration',
      className: badgeButtonStyles,
      onClick: () => toggleCSFLEModalVisible()
    },
    focusRingProps
  );

  return (
    <div className={badgeContainerStyles}>
      <button {...buttonProps}>
        <Badge variant={csfleMode === 'enabled' ? BadgeVariant.DarkGray : BadgeVariant.LightGray}>
          <Icon glyph="Key" />
          In-Use Encryption
        </Badge>
      </button>
    </div>
  );
}

CSFLEMarker.displayName = 'CSFLEMarker';
CSFLEMarker.propTypes = {
  csfleMode: PropTypes.string,
  toggleCSFLEModalVisible: PropTypes.func.isRequired,
};

export default CSFLEMarker;
