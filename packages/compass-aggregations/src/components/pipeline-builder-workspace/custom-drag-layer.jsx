import React from 'react';
import PropTypes from 'prop-types';
import { DragLayer } from 'react-dnd';

import styles from './custom-drag-layer.module.less';

const getItemStyles = (props) => {
  const { initialOffset, currentOffset } = props;
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
};

const CustomDragLayer = (props) => {
  const { isDragging, item } = props;

  if (!isDragging) {
    return null;
  }

  return (
    <div className={styles['custom-drag-layer']}>
      <div style={getItemStyles(props)}>
        <div className={styles['custom-drag-layer-container']}>
          <div>
            {item.stageOperator ? item.stageOperator : `Stage ${item.index + 1}`}
          </div>
        </div>
      </div>
    </div>
  );
};

CustomDragLayer.propTypes = {
  isDragging: PropTypes.bool,
  item: PropTypes.object
};

const collect = (monitor) => ({
  item: monitor.getItem(),
  initialOffset: monitor.getInitialSourceClientOffset(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
});

export default DragLayer(collect)(CustomDragLayer);
