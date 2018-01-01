import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import StageHeader from 'components/stage-header';
import StageEditor from 'components/stage-editor';

import styles from './stage.less';

/**
 * Behaviour for the stage drag source.
 */
const stageSource = {
  beginDrag(props) {
    return {
      index: props.index
    };
  }
};

/**
 * Behaviour for the stage drop target.
 */
const stageTarget = {
  hover(props, monitor, component) {
    const fromIndex = monitor.getItem().index;
    const toIndex = props.index;

    if (fromIndex !== toIndex) {
      // Determine rectangle on screen
      const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Dragging downwards
      if (fromIndex < toIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (fromIndex > toIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      props.stageMoved(fromIndex, toIndex);
      // This prevents us from overloading the store with stageMoved actions.
      monitor.getItem().index = toIndex;
    }
  }
};

/**
 * Display a single stage in the aggregation pipeline.
 *
 * Decorators added for giving the component drag/drop behaviour.
 */
@DropTarget('Stage', stageTarget, (connect) => ({
  connectDropTarget: connect.dropTarget()
}))
@DragSource('Stage', stageSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
class Stage extends Component {
  static displayName = 'StageComponent';

  static propTypes = {
    stage: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    const editor = this.props.stage.isExpanded ? <StageEditor {...this.props} /> : null;
    const opacity = this.props.isDragging ? 0 : 1;
    return this.props.connectDragSource(
      this.props.connectDropTarget(
        <div className={classnames(styles.stage)} style={{ opacity }}>
          <StageHeader {...this.props} />
          {editor}
        </div>
      )
    );
  }
}

export default Stage;
