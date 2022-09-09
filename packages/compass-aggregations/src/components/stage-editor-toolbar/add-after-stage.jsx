import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Tooltip } from 'hadron-react-components';
import styles from './add-after-stage.module.less';

/**
 * The add after stage button.
 */
class AddAfterStage extends PureComponent {
  static displayName = 'AddAfterStageComponent';

  static propTypes = {
    index: PropTypes.number.isRequired,
    stageAddedAfter: PropTypes.func.isRequired
  };

  /**
   * Handle stage add after clicks.
   */
  onStageAddedAfter = () => {
    this.props.stageAddedAfter(this.props.index);
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
          onClick={this.onStageAddedAfter}>
          +
        </button>
        <Tooltip id="add-after-stage" />
      </div>
    );
  }
}

export default AddAfterStage;
