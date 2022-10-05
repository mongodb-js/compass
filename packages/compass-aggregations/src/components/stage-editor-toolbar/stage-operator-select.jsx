import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select-plus';

import SelectOptionWithTooltip from './select-option-with-tooltip/select-option-with-tooltip';
import { filterStageOperators } from '../../utils/stage';

import styles from './stage-operator-select.module.less';

/**
 * Select from a list of stage operators.
 */

class StageOperatorSelect extends PureComponent {
  static displayName = 'StageOperatorSelectComponent';

  static propTypes = {
    env: PropTypes.string.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    sourceName: PropTypes.string,
    stageOperator: PropTypes.string,
    index: PropTypes.number.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
  }

  /**
   * Called when the stage operator is selected.
   * @param {String} name The name of the stage operator.
   * @returns {void}
   */
  onStageOperatorSelected = (name) => {
    this.props.stageOperatorSelected(this.props.index, name);
  }

  /**
   * Render the stage operator select component.
   *
   * @returns {Component} The component.
   */
  render() {
    const operators = filterStageOperators({
      serverVersion: this.props.serverVersion,
      env: this.props.env,
      isTimeSeries: this.props.isTimeSeries,
      isReadonly: this.props.isReadonly,
      sourceName: this.props.sourceName
    });
    return (
      <div className={styles['stage-operator-select']}>
        <Select
          optionComponent={SelectOptionWithTooltip}
          simpleValue
          searchable
          openOnClick
          openOnFocus
          clearable={false}
          disabled={!this.props.isEnabled}
          className={styles['stage-operator-select-control']}
          options={operators}
          value={this.props.stageOperator}
          onChange={this.onStageOperatorSelected}
        />
      </div>
    );
  }
}

export default StageOperatorSelect;
