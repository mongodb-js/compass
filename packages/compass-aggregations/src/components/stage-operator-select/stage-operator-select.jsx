import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Select from 'react-select-plus';
import STAGE_OPERATORS from 'constants/stage-operators';

import styles from './stage-operator-select.less';

/**
 * Select from a list of stage operators.
 */
class StageOperatorSelect extends PureComponent {
  static displayName = 'StageOperatorSelectComponent';

  static propTypes = {
    stage: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired
  }

  /**
   * Called when the stage operator is selected.
   *
   * @param {String} name - The name of the stage operator.
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
    return (
      <div className={classnames(styles['stage-operator-select'])}>
        <Select
          simpleValue
          searchable
          openOnClick
          clearable={false}
          className={classnames(styles['stage-operator-select-control'])}
          options={STAGE_OPERATORS}
          value={this.props.stage.stageOperator}
          onChange={this.onStageOperatorSelected} />
      </div>
    );
  }
}

export default StageOperatorSelect;
