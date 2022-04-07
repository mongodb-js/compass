import React from 'react';
import PropTypes from 'prop-types';
import { css, Icon, Badge, BadgeVariant } from '@mongodb-js/compass-components';

// Let's not worry too much about styling here until
// the sidebar is redone soon anyway.
const badgeContainerStyles = css({
  padding: '0px 0px 6px 36px'
});

function CSFLEMarker({ isCSFLEConnection }) {
  if (!isCSFLEConnection) {
    return null;
  }
  return (
    <div className={badgeContainerStyles}>
      <Badge variant={BadgeVariant.DarkGray}>
        <Icon glyph="Key" />
        CSFLE
      </Badge>
    </div>
  );
}

CSFLEMarker.displayName = 'CSFLEMarker';
CSFLEMarker.propTypes = {
  isCSFLEConnection: PropTypes.boolean
};

export default CSFLEMarker;
