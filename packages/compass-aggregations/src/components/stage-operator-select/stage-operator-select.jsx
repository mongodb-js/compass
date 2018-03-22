import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import semver from 'semver';
import Select from 'react-select-plus';
import STAGE_OPERATORS from 'constants/stage-operators';

import styles from './stage-operator-select.less';

/**
 * Select from a list of stage operators.
 */
class StageOperatorSelect extends PureComponent {
  static displayName = 'StageOperatorSelectComponent';

  static propTypes = {
    stageOperator: PropTypes.string,
    index: PropTypes.number.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired
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
    const operators = STAGE_OPERATORS.filter((o) => {
      return semver.gte(this.props.serverVersion, o.version);
    });
    return (
      <div className={classnames(styles['stage-operator-select'])}>
        <Select
          simpleValue
          searchable
          openOnClick
          clearable={false}
          className={classnames(styles['stage-operator-select-control'])}
          options={operators}
          value={this.props.stageOperator}
          onChange={this.onStageOperatorSelected} />
      </div>
    );
  }
}

export default StageOperatorSelect;
