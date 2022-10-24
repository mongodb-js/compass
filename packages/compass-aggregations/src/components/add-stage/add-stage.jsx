import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TextButton } from 'hadron-react-buttons';
import { connect } from 'react-redux';
import { addStage } from '../../modules/pipeline-builder/stage-editor';

import styles from './add-stage.module.less';

/**
 * Display a card with an add stage button.
 */
export class AddStage extends PureComponent {
  static displayName = 'AddStageComponent';

  static propTypes = {
    onAddStageClick: PropTypes.func.isRequired
  };

  onClick = () => {
    this.props.onAddStageClick();
  };

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
            dataTestId="add-stage"
            text="Add Stage"
            className="btn btn-xs btn-default"
            clickHandler={this.onClick}
          />
        </div>
      </div>
    );
  }
}

export default connect(null, { onAddStageClick: addStage })(AddStage);
