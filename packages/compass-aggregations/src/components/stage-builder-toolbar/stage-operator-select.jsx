import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import semver from 'semver';
import Select from 'react-select-plus';
import { STAGE_OPERATORS } from 'mongodb-ace-autocompleter';

import styles from './stage-operator-select.less';

const OUT = '$out';
const MERGE = '$merge';

/**
 * Select from a list of stage operators.
 */

class StageOperatorSelect extends PureComponent {
  static displayName = 'StageOperatorSelectComponent';

  static propTypes = {
    allowWrites: PropTypes.bool.isRequired,
    env: PropTypes.string.isRequired,
    stageOperator: PropTypes.string,
    index: PropTypes.number.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
    setIsModified: PropTypes.func.isRequired
  }

  /**
   * Called when the stage operator is selected.
   * @param {String} name The name of the stage operator.
   * @returns {void}
   */
  onStageOperatorSelected = (name) => {
    this.props.stageOperatorSelected(this.props.index, name, this.props.isCommenting);
    this.props.setIsModified(true);
  }


  /**
   * Is the env supported?
   *
   * @param {Array} opEnvs - The operation supported environments.
   * @param {String} env - The current env.
   *
   * @returns {boolean} If the env is supported.
   */
  isSupportedEnv = (opEnvs, env) => {
    if (!opEnvs || !env) return true;
    return opEnvs.includes(env);
  };

  /**
   * Render the stage operator select component.
   *
   * @returns {Component} The component.
   */
  render() {
    const operators = STAGE_OPERATORS.filter((o) => {
      if ((o.name === OUT || o.name === MERGE) && !this.props.allowWrites) return false;
      return semver.gte(this.props.serverVersion, o.version) &&
        this.isSupportedEnv(o.env, this.props.env);
    });
    return (
      <div className={classnames(styles['stage-operator-select'])}>
        <Select
          simpleValue
          searchable
          openOnClick
          openOnFocus
          clearable={false}
          disabled={!this.props.isEnabled}
          className={classnames(styles['stage-operator-select-control'])}
          options={operators}
          value={this.props.stageOperator}
          onChange={this.onStageOperatorSelected} />
      </div>
    );
  }
}

export default StageOperatorSelect;
