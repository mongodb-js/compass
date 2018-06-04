import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './add-after-stage.less';

/**
 * The add after stage button.
 */
class AddAfterStage extends PureComponent {
  static displayName = 'AddAfterStageComponent';

  static propTypes = {
    stageAddedAfter: PropTypes.func.isRequired
  }

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['add-after-stage'])}>
        <button
          type="button"
          title="Add After Stage"
          className="btn btn-default btn-xs"
          clickHandler={this.props.stageAddedAfter}>
          +
        </button>
      </div>
    );
  }
}

export default AddAfterStage;
