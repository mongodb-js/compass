import React, {Component} from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

function makeDragSource(component) {
  const spec = {
    beginDrag: (props) => {
      return {index: props.index};
    }
  };

  const collect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  });

  return DragSource('stage', spec, collect)(component);
}

function makeDropTarget(component) {
  const spec = {
    drop: (props, monitor) => {
      const onDrop = props.onDrop;

      if (!onDrop) {
        return;
      }

      const item = monitor.getItem();
      if (!item) {
        return;
      }

      const sourceIndex = item.index;
      const targetIndex = props.index;

      if (sourceIndex === targetIndex) {
        return;
      }

      onDrop(sourceIndex, targetIndex);
    }
  };

  const collect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  });

  return DropTarget('stage', spec, collect)(component);
}

class SortableStageContainer extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    isDragging: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired
  };

  render() {
    const connectDragSource = this.props.connectDragSource;
    const connectDropTarget = this.props.connectDropTarget;

    const classNames = [];
    if (this.props.isDragging) {
      classNames.push('sortable-stage-list-is-dragging');
    }

    if (this.props.isOver) {
      classNames.push('sortable-stage-list-is-over');
    }

    return connectDragSource(
      connectDropTarget(
        <div className={classNames.join(' ')}>{this.props.children}</div>
      ));
  }
}

export default makeDragSource(makeDropTarget(SortableStageContainer));
