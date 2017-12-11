import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './add-stage.less';

/**
 * Display a card with an add stage button.
 */
class AddStage extends PureComponent {
  static displayName = 'AddStageComponent';

  static propTypes = {
    stageAdded: PropTypes.func.isRequired
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['add-stage'])}>
        <button className="btn btn-default btn-xs" onClick={this.props.stageAdded}>
          Add Stage
        </button>
      </div>
    );
  }
}

export default AddStage;
