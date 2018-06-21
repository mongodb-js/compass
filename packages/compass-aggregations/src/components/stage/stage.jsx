import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import StageToolbar from 'components/stage-toolbar';
import StageWorkspace from 'components/stage-workspace';

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
      props.setIsModified(true);
      // This prevents us from overloading the store with stageMoved actions.
      monitor.getItem().index = toIndex;
      props.runStage(0);
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
    isCommenting: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    runStage: PropTypes.func.isRequired,
    runOutStage: PropTypes.func.isRequired,
    gotoOutResults: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageAddedAfter: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired,
    setIsModified: PropTypes.func.isRequired
  }

  /**
   * Render the workspace.
   *
   * @returns {React.Component} The workspace.
   */
  renderWorkspace() {
    if (this.props.stage.isExpanded) {
      return (
        <StageWorkspace
          stage={this.props.stage}
          runStage={this.props.runStage}
          runOutStage={this.props.runOutStage}
          gotoOutResults={this.props.gotoOutResults}
          index={this.props.index}
          isAutoPreviewing={this.props.isAutoPreviewing}
          serverVersion={this.props.serverVersion}
          fields={this.props.fields}
          setIsModified={this.props.setIsModified}
          stageChanged={this.props.stageChanged} />
      );
    }
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    const opacity = this.props.isDragging ? 0 : (this.props.stage.isEnabled ? 1 : 0.6);
    const errored = this.props.stage.error ? 'stage-errored' : 'stage';
    return this.props.connectDragSource(
      this.props.connectDropTarget(
        <div className={classnames(styles[errored])} style={{ opacity }}>
          <StageToolbar
            stage={this.props.stage}
            index={this.props.index}
            serverVersion={this.props.serverVersion}
            stageOperatorSelected={this.props.stageOperatorSelected}
            stageToggled={this.props.stageToggled}
            openLink={this.props.openLink}
            stageAddedAfter={this.props.stageAddedAfter}
            stageDeleted={this.props.stageDeleted}
            runStage={this.props.runStage}
            isCommenting={this.props.isCommenting}
            setIsModified={this.props.setIsModified}
            stageCollapseToggled={this.props.stageCollapseToggled} />
          {this.renderWorkspace()}
        </div>
      )
    );
  }
}

export default Stage;
