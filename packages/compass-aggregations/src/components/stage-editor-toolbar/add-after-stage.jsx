import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Tooltip } from 'hadron-react-components';
import { connect } from 'react-redux';
import { addStage } from '../../modules/pipeline-builder/stage-editor';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import styles from './add-after-stage.module.less';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

/**
 * The add after stage button.
 */
export class AddAfterStage extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    onAddStageClick: PropTypes.func.isRequired
  };

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div
        className={classnames(styles['add-after-stage'])}
        data-tip="Add stage below"
        data-place="top"
        data-for="add-after-stage">
        <button
          data-testid="add-after-stage"
          type="button"
          title="Add After Stage"
          className="btn btn-default btn-xs"
          onClick={this.props.onAddStageClick}>
          +
        </button>
        <Tooltip id="add-after-stage" />
      </div>
    );
  }
}

export default connect(
  (state) => ({
    num_stages: state.pipelineBuilder.stageEditor.stages.length,
  }),
  {
    addStage,
  },
  (stateProps, dispatchProps, ownProps) => {
    const { num_stages } = stateProps;
    const { addStage } = dispatchProps;
    const { index } = ownProps;
    return {
      ...ownProps,
      onAddStageClick: () => {
        track('Aggregation Edited', {
          num_stages,
          stage_action: 'stage_added',
          editor_view_type: 'stage', // Its always stage view for this component
        });
        addStage(index);
      },
    };
  }
)(AddAfterStage);
