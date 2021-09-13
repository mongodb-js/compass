import React from 'react';
import PropTypes from 'prop-types';

import styles from './resize-handle.module.less';

const LEFT_ARROW_KEY = 'ArrowLeft';
const RIGHT_ARROW_KEY = 'ArrowRight';

function ResizeHandle({
  onMoveRightPressed,
  onMoveLeftPressed
}) {
  return (
    <div
      className={styles['resize-handle']}
      onKeyDown={(e) => {
        if (e.key === LEFT_ARROW_KEY) {
          onMoveLeftPressed();
        } else if (e.key === RIGHT_ARROW_KEY) {
          onMoveRightPressed();
        }
      }}
      tabIndex={1}
    />
  );
}

ResizeHandle.propTypes = {
  onMoveRightPressed: PropTypes.func.isRequired,
  onMoveLeftPressed: PropTypes.func.isRequired
};

export default ResizeHandle;
