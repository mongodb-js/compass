import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Stage from '../stage';
import PipelineBuilderInputDocuments from '../pipeline-builder-input-documents';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';
import { addStage, moveStage } from '../../modules/pipeline-builder/stage-editor';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import { css } from '@mongodb-js/compass-components';

import styles from './pipeline-builder-ui-workspace.module.less';

const stageContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  '&.dragging .add-stage-button': {
    visibility: 'hidden',
    pointerEvents: 'none'
  }
});

const SortableStage = sortableElement(({ idx, onAddStage, ...props }) => {
  return (
    <div className={stageContainerStyles}>
      {/* We render the stage add button first and then the stage. */}
      {/* So, clicking add stage, should add a stage before the current one */}
      <div className='add-stage-button'>
        <AddStage onAddStage={() => onAddStage(idx - 1)} variant='icon' />
      </div>
      <Stage index={idx} {...props}></Stage>
    </div>
  );
});

const SortableContainer = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

export class PipelineBuilderUIWorkspace extends PureComponent {
  static propTypes = {
    stageIds: PropTypes.array.isRequired,
    editViewName: PropTypes.string,
    onStageMoveEnd: PropTypes.func.isRequired,
    onAddStage: PropTypes.func.isRequired
  };

  /**
   * The stage moved handler.
   *
   * @param {Number} fromIndex - The original index.
   * @param {Number} toIndex - The index to move to.
   */
  onStageMoved = ({ oldIndex, newIndex }) => {
    this.props.onStageMoveEnd(oldIndex, newIndex);
  };

  /**
   * Renders the pipeline workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div
        data-testid="pipeline-builder-ui-workspace"
        ref={(ref) => {
          this.stageListContainerRef = ref;
        }}
      >
        <div className={styles['pipeline-workspace-container']}>
          <div className={styles['pipeline-workspace']}>
            {this.props.editViewName && (
              <ModifySourceBanner editViewName={this.props.editViewName} />
            )}
            <PipelineBuilderInputDocuments />
            <SortableContainer
              axis="y"
              lockAxis="y"
              onSortEnd={this.onStageMoved}
              useDragHandle
              transitionDuration={0}
              helperContainer={() => {
                return this.stageListContainerRef ?? document.body;
              }}
              helperClass="dragging"
              // Slight distance requirement to prevent sortable logic messing with
              // interactive elements in the handler toolbar component
              distance={10}
            >
              {this.props.stageIds.map((id, index) => {
                return (
                  <SortableStage
                    key={id}
                    idx={index}
                    index={index}
                    onAddStage={this.props.onAddStage} />
                );
              })}
            </SortableContainer>
            <AddStage onAddStage={this.props.onAddStage} variant='button' />
          </div>
        </div>
      </div>
    );
  }
}

/**
 *
 * @param {import('./../../modules/').RootState} state
 */
const mapState = (state) => {
  return {
    stageIds: state.pipelineBuilder.stageEditor.stageIds,
    editViewName: state.editViewName
  }
};

const mapDispatch = {
  onStageMoveEnd: moveStage,
  onAddStage: addStage
};

export default connect(mapState, mapDispatch)(PipelineBuilderUIWorkspace);
