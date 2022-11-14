import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Stage from '../stage';
import Input from '../input';
import AddStage from '../add-stage';
import ModifySourceBanner from '../modify-source-banner';
import { moveStage } from '../../modules/pipeline-builder/stage-editor';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import styles from './pipeline-builder-ui-workspace.module.less';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const SortableStage = sortableElement(({ idx, ...props }) => {
  return <Stage index={idx} {...props}></Stage>;
});

const SortableContainer = sortableContainer(({ children }) => {
  return <div>{children}</div>;
});

export class PipelineBuilderUIWorkspace extends PureComponent {
  static propTypes = {
    stageIds: PropTypes.array.isRequired,
    editViewName: PropTypes.string,
    onStageMoveEnd: PropTypes.func.isRequired
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
            <Input />
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
                return <SortableStage key={id} idx={index} index={index} />;
              })}
            </SortableContainer>
            <AddStage />
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
    editViewName: state.editViewName,
    stageOperators: state.pipelineBuilder.stageEditor.stages.map(
      (stage) => stage.stageOperator
    ),
  };
};

export default connect(
  mapState,
  { moveStage },
  (stateProps, dispatchProps, ownProps) => {
    const { stageOperators, ...restOfStageProps } = stateProps;
    const { moveStage } = dispatchProps;
    return {
      ...ownProps,
      ...restOfStageProps,
      onStageMoveEnd: (fromIndex, toIndex) => {
        track('Aggregation Edited', {
          num_stages: stageOperators.length,
          stage_action: 'stage_reordered',
          stage_name: stageOperators[fromIndex],
          editor_view_type: 'stage', // Its always stage view for this component
        });
        moveStage(fromIndex, toIndex);
      },
    };
  }
)(PipelineBuilderUIWorkspace);
