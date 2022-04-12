import React from 'react';
import PropTypes from 'prop-types';
import { css, Icon, Badge, BadgeVariant } from '@mongodb-js/compass-components';

// Let's not worry too much about styling here until
// the sidebar is redone soon anyway.
const badgeContainerStyles = css({
  padding: '0px 0px 6px 36px'
});

const badgeButtonStyles = css({
  '&': {
    background: 'inherit',
    padding: 0,
    margin: 0,
    border: 'none',
  },
  '&:hover': {
    cursor: 'pointer'
  }
});

function CSFLEMarker({ csfleMode, toggleCSFLEModalVisible }) {
  if (!csfleMode || csfleMode === 'unavailable') {
    return null;
  }
  return (
    <div className={badgeContainerStyles}>
      <button className={badgeButtonStyles} onClick={() => toggleCSFLEModalVisible()}>
        <Badge variant={csfleMode === 'enabled' ? BadgeVariant.DarkGray : BadgeVariant.LightGray}>
          <Icon glyph="Key" />
          CSFLE
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
