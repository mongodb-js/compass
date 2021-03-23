import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TextButton } from 'hadron-react-buttons';

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
      <div className={styles['add-stage-container']}>
        <div className={styles['add-stage']}>
          <TextButton
            text="Add Stage"
            className="btn btn-xs btn-default"
            clickHandler={this.props.stageAdded}
          />
        </div>
      </div>
    );
  }
}

export default AddStage;
