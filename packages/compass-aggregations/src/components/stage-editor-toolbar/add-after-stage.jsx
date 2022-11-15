import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addStage } from '../../modules/pipeline-builder/stage-editor';

import styles from './add-after-stage.module.less';

/**
 * The add after stage button.
 */
export class AddAfterStage extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    onAddStageClick: PropTypes.func.isRequired
  };

  /**
   * Handle stage add after clicks.
   */
  onStageAddedAfter = () => {
    this.props.onAddStageClick(this.props.index);
  };

  /**
   * Render the button component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div
        className={styles['add-after-stage']}
      >
        <button
          data-testid="add-after-stage"
          type="button"
          title="Add Stage Below"
          className="btn btn-default btn-xs"
          onClick={this.onStageAddedAfter}
        >
          +
        </button>
      </div>
    );
  }
}

export default connect(null, { onAddStageClick: addStage })(AddAfterStage);
