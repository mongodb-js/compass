import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select-plus';
import { connect } from 'react-redux';
import { changeStageOperator } from '../../modules/pipeline-builder/stage-editor';
import SelectOptionWithTooltip from './select-option-with-tooltip/select-option-with-tooltip';
import { filterStageOperators } from '../../utils/stage';

import styles from './stage-operator-select.module.less';

/**
 * Select from a list of stage operators.
 */

export class StageOperatorSelect extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    stages: PropTypes.array.isRequired,
    selectedStage: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
  }

  /**
   * Called when the stage operator is selected.
   * @param {String} name The name of the stage operator.
   * @returns {void}
   */
  onStageOperatorSelected = (name) => {
    this.props.onChange(this.props.index, name);
  }

  /**
   * Render the stage operator select component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={styles['stage-operator-select']}>
        <Select
          optionComponent={SelectOptionWithTooltip}
          simpleValue
          searchable
          openOnClick
          openOnFocus
          clearable={false}
          disabled={this.props.isDisabled}
          className={styles['stage-operator-select-control']}
          options={this.props.stages}
          value={this.props.selectedStage}
          onChange={this.onStageOperatorSelected}
        />
      </div>
    );
  }
}

export default connect(
  (state, ownProps) => {
    const stages = filterStageOperators({
      serverVersion: state.serverVersion,
      env: state.env,
      isTimeSeries: state.isTimeSeries,
      isReadonly: state.isReadonly,
      preferencesReadOnly: state.preferencesReadOnly,
      sourceName: state.sourceName
    })
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    return {
      stages,
      selectedStage: stage.stageOperator,
      isDisabled: stage.disabled
    };
  },
  { onChange: changeStageOperator }
)(StageOperatorSelect);
