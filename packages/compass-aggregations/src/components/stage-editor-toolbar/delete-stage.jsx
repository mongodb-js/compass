import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { removeStage } from '../../modules/pipeline-builder/stage-editor';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import styles from './delete-stage.module.less';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

/**
 * The delete stage button.
 */
export class DeleteStage extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    onStageDeleteClick: PropTypes.func.isRequired
  };

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['delete-stage'])}>
        <button
          data-testid="delete-stage"
          type="button"
          title="Delete Stage"
          className="btn btn-default btn-xs"
          onClick={this.props.onStageDeleteClick}>
          <i className="fa fa-trash-o" aria-hidden />
        </button>
      </div>
    );
  }
}

export default connect(
  (state, ownProps) => {
    const pipeline = state.pipelineBuilder.stageEditor.stages;
    return {
      num_stages: pipeline.length,
      stage_name: pipeline[ownProps.index]?.stageOperator,
    };
  },
  {
    removeStage,
  },
  (stateProps, dispatchProps, ownProps) => {
    const { num_stages, stage_name } = stateProps;
    const { removeStage } = dispatchProps;
    const { index } = ownProps;
    return {
      ...ownProps,
      onStageDeleteClick: () => {
        track('Aggregation Edited', {
          num_stages,
          stage_action: 'stage_deleted',
          stage_name,
          editor_view_type: 'stage', // Its always stage view for this component
        });
        removeStage(index);
      },
    };
  }
)(DeleteStage);
